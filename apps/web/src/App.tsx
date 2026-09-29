import { useState, useEffect, useMemo } from 'react';

const API = 'http://localhost:4000';

type Store = { id: string; name: string; slug: string; address?: string; phone?: string; whatsapp?: string; email?: string; description?: string; isOpen: boolean; operatingHours?: string };
type Service = { id: string; storeId: string; name: string; category: string; description?: string; unit: string; isActive: boolean; requiresFile: boolean; requiresPrinter: boolean; estimatedMinutes?: number; price?: number };
type Order = { id: string; storeId: string; orderNumber: string; customerId: string; status: string; paymentStatus: string; subtotal: number; total: number; notes?: string; createdAt: string; updatedAt: string };
type Customer = { id: string; storeId: string; name: string; phone?: string; createdAt: string };

export default function App() {
  const [token, setToken] = useState<string>('');
  const [view, setView] = useState<'login' | 'owner' | 'operator' | 'customer'>('login');
  const [stores, setStores] = useState<Store[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; storeId?: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState('owner@kopicopy.id');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'OWNER' });
  const [showRegister, setShowRegister] = useState(false);

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
    }
  };

  const fetchServices = async (storeId: string) => {
    const res = await fetch(`${API}/api/v1/stores/${storeId}/services`);
    const data = await res.json();
    setServices(data.services || []);
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
      body: JSON.stringify(registerForm)
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

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setView('login');
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
            <span>Halo, {currentUser?.name}</span>
            <button onClick={handleLogout} className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-900">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {view === 'owner' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Pemilik</h2>
            {selectedStore && (
              <div className="grid gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-slate-600">Toko Anda</p>
                  <p className="text-2xl font-bold">{selectedStore.name}</p>
                  <p className="text-slate-700">{selectedStore.address}</p>
                  <p className="text-slate-700">{selectedStore.phone}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-slate-600">Status</p>
                  <p className={`text-2xl font-bold ${selectedStore.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedStore.isOpen ? 'BUKA' : 'TUTUP'}
                  </p>
                </div>
              </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Layanan Toko</h3>
              <div className="grid gap-4">
                {services.map((svc) => (
                  <div key={svc.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{svc.name}</p>
                        <p className="text-sm text-slate-600">{svc.category} • {svc.unit}</p>
                        <p className="text-lg font-bold text-blue-600 mt-2">Rp{(svc.price || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {svc.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'operator' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Operator</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-slate-600">Fitur lengkap operator akan tersedia di fase selanjutnya</p>
            </div>
          </div>
        )}

        {view === 'customer' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Pesan Layanan</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-slate-600">Fitur pemesanan pelanggan akan tersedia di fase selanjutnya</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
