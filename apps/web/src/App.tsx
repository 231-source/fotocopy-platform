import { useState, useEffect, useMemo } from 'react';

const API = 'http://localhost:4000';

type Store = { id: string; name: string; slug: string; address?: string; phone?: string; whatsapp?: string; email?: string; description?: string; isOpen: boolean; operatingHours?: string };
type Service = { id: string; storeId: string; name: string; category: string; description?: string; unit: string; isActive: boolean; requiresFile: boolean; requiresPrinter: boolean; estimatedMinutes?: number; price?: number };
type Order = { id: string; storeId: string; orderNumber: string; customerId: string; status: string; paymentStatus: string; subtotal: number; total: number; notes?: string; createdAt: string; updatedAt: string };
type Payment = { id: string; storeId: string; orderId: string; method: string; status: string; amount: number; externalRef?: string; paidAt?: string; confirmedBy?: string; createdAt: string };
type PrintJob = { id: string; storeId: string; orderId: string; status: string; fileName?: string; pageCount?: number; copyCount?: number; paperSize?: string; colorMode?: string; duplex?: boolean; createdAt: string };
type QRISStatus = { qrisStatus: string; qrisReference: string; amount: number; orderNumber: string; expiresAt: string; isExpired: boolean; orderStatus: string };

export default function App() {
  const [token, setToken] = useState<string>('');
  const [view, setView] = useState<'login' | 'owner' | 'operator' | 'customer'>('login');
  const [stores, setStores] = useState<Store[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; storeId?: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState('owner@kopicopy.id');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showRegister, setShowRegister] = useState(false);
  const [qrisData, setQrisData] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [cartItems, setCartItems] = useState<{ serviceId: string; quantity: number }[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (token) {
      fetchStores();
    }
  }, [token]);

  const fetchStores = async () => {
    const res = await fetch(`${API}/api/v1/stores`);
    const data = await res.json();
    setStores(data.stores || []);
    if (data.stores?.[0]) {
      setSelectedStore(data.stores[0]);
      fetchServices(data.stores[0].id);
      fetchOrders(data.stores[0].id);
    }
  };

  const fetchServices = async (storeId: string) => {
    const res = await fetch(`${API}/api/v1/stores/${storeId}/services`);
    const data = await res.json();
    setServices(data.services || []);
  };

  const fetchOrders = async (storeId: string) => {
    const res = await fetch(`${API}/api/v1/stores/${storeId}/orders`);
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      setView(data.user.role === 'OWNER' ? 'owner' : data.user.role === 'OPERATOR' ? 'operator' : 'customer');
    } else {
      alert('Login gagal');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: registerForm.name, email: registerForm.email, password: registerForm.password, role: registerForm.role })
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      setShowRegister(false);
      setView('owner');
    } else {
      alert('Registrasi gagal');
    }
  };

  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'OWNER' });

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setView('login');
  };

  const createOrder = async () => {
    if (!selectedStore || cartItems.length === 0 || !customerForm.name) {
      alert('Data tidak lengkap');
      return;
    }

    const res = await fetch(`${API}/api/v1/stores/${selectedStore.id}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customerName: customerForm.name,
        customerPhone: customerForm.phone,
        items: cartItems
      })
    });

    if (res.ok) {
      const data = await res.json();
      setSelectedOrder(data.order);
      setCartItems([]);
      await requestQRIS(data.order.id);
    } else {
      alert('Gagal membuat pesanan');
    }
  };

  const requestQRIS = async (orderId: string) => {
    if (!selectedStore) return;
    const res = await fetch(`${API}/api/v1/stores/${selectedStore.id}/orders/${orderId}/qris-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      setQrisData(data.qrisData);
      startPaymentChecking(orderId);
    }
  };

  const startPaymentChecking = (orderId: string) => {
    const interval = setInterval(() => {
      checkPaymentStatus(orderId, interval);
    }, 3000);
  };

  const checkPaymentStatus = async (orderId: string, interval: NodeJS.Timeout) => {
    if (!selectedStore) return;
    const res = await fetch(`${API}/api/v1/stores/${selectedStore.id}/orders/${orderId}/qris-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.qrisStatus === 'PAID' || data.orderStatus === 'PAID') {
        clearInterval(interval);
        alert('✅ Pembayaran berhasil! Pesanan masuk antrian printer');
        await fetchOrders(selectedStore.id);
        setQrisData(null);
        setSelectedOrder(null);
      } else if (data.isExpired) {
        clearInterval(interval);
        alert('❌ QRIS kadaluarsa. Silakan buat pesanan baru');
        setQrisData(null);
      }
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Fotocopy Platform</h1>

          {!showRegister ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">Masuk</button>
              <button type="button" onClick={() => setShowRegister(true)} className="w-full text-blue-600 py-2 font-medium hover:text-blue-700">Daftar akun baru</button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <input type="text" placeholder="Nama" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
              <input type="email" placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
              <input type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" />
              <select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                <option value="OWNER">Pemilik</option>
                <option value="ADMIN">Admin</option>
                <option value="OPERATOR">Operator</option>
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">Daftar</button>
              <button type="button" onClick={() => setShowRegister(false)} className="w-full text-blue-600 py-2 font-medium hover:text-blue-700">Kembali ke login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-blue-700 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Fotocopy Platform</h1>
          <div className="flex items-center gap-4">
            <span>{currentUser?.name} ({currentUser?.role})</span>
            <button onClick={handleLogout} className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-900">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {view === 'owner' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Pemilik</h2>
            {selectedStore && (
              <div className="grid gap-6 mb-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-slate-600">Total Pesanan</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-slate-600">Pembayaran Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{orders.filter(o => o.paymentStatus === 'PENDING').length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-slate-600">Pembayaran Berhasil</p>
                  <p className="text-3xl font-bold text-green-600">{orders.filter(o => o.paymentStatus === 'PAID').length}</p>
                </div>
              </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Daftar Pesanan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left">No Pesanan</th>
                      <th className="px-4 py-2 text-left">Pelanggan</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Status Pembayaran</th>
                      <th className="px-4 py-2 text-left">Status Pesanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-t">
                        <td className="px-4 py-2 font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-2">{order.customer?.name || '-'}</td>
                        <td className="px-4 py-2">Rp{order.total.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'operator' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Operator</h2>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-slate-600">Antrian Print</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === 'QUEUED' || o.status === 'PAID').length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-slate-600">Sedang Diproses</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === 'PROCESSING').length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-slate-600">Siap Diambil</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === 'READY_FOR_PICKUP').length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Pesanan Siap Diproses</h3>
              <div className="space-y-4">
                {orders.filter(o => o.paymentStatus === 'PAID' && (o.status === 'PAID' || o.status === 'QUEUED')).map(order => (
                  <div key={order.id} className="border p-4 rounded-lg bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="text-sm text-slate-600">{order.customer?.name} - {order.customer?.phone}</p>
                        <p className="text-sm mt-2">Total: Rp{order.total.toLocaleString('id-ID')}</p>
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Mulai Proses</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'customer' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Pesan Layanan</h2>
            {!selectedOrder ? (
              <div className="grid gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">Data Pelanggan</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Nama" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <input type="text" placeholder="No WhatsApp" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">Pilih Layanan</h3>
                  <div className="space-y-3">
                    {services.map(svc => (
                      <div key={svc.id} className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <p className="font-bold">{svc.name}</p>
                          <p className="text-sm text-slate-600">Rp{(svc.price || 0).toLocaleString('id-ID')} / {svc.unit}</p>
                        </div>
                        <input type="number" min="1" placeholder="Qty" className="w-16 px-2 py-1 border rounded" onChange={(e) => {
                          if (parseInt(e.target.value) > 0) {
                            setCartItems([...cartItems.filter(c => c.serviceId !== svc.id), { serviceId: svc.id, quantity: parseInt(e.target.value) }]);
                          }
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
                {cartItems.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Ringkasan Pesanan</h3>
                    <div className="space-y-2 mb-4">
                      {cartItems.map(item => {
                        const service = services.find(s => s.id === item.serviceId);
                        return (
                          <div key={item.serviceId} className="flex justify-between">
                            <span>{service?.name} x{item.quantity}</span>
                            <span>Rp{((service?.price || 0) * item.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t pt-2 font-bold text-lg">
                      Total: Rp{cartItems.reduce((sum, item) => sum + ((services.find(s => s.id === item.serviceId)?.price || 0) * item.quantity), 0).toLocaleString('id-ID')}
                    </div>
                    <button onClick={createOrder} className="w-full bg-blue-600 text-white py-3 rounded-lg mt-4 hover:bg-blue-700 font-bold">Lanjut ke Pembayaran QRIS</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">Pembayaran QRIS</h3>
                {qrisData && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600">No Pesanan</p>
                      <p className="font-bold text-lg">{qrisData.orderNumber}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Jumlah Pembayaran</p>
                      <p className="font-bold text-2xl text-green-600">Rp{qrisData.amount.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600">QRIS Reference</p>
                      <p className="font-mono text-sm">{qrisData.qrisReference}</p>
                    </div>
                    <div className="bg-slate-100 p-8 rounded-lg text-center">
                      <p className="text-sm text-slate-600 mb-2">📱 Scan QRIS ini dengan aplikasi pembayaran</p>
                      <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl">📲</p>
                          <p className="text-xs text-slate-600 mt-2">QRIS CODE</p>
                          <p className="font-mono text-xs mt-1">{qrisData.qrisReference}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>✅ Sistem otomatis memantau pembayaran</p>
                      <p>⏱️ QRIS berlaku sampai: {new Date(qrisData.expiresAt).toLocaleTimeString('id-ID')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
