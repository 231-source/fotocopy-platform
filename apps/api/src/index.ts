import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { authMiddleware, requireRole, requireStoreAccess, type AuthRequest } from './middleware.js';
import type { Role, PaymentStatus, OrderStatus } from './types.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-key';

app.use(cors());
app.use(express.json());

const signToken = (payload: { id: string; email: string; role: Role; storeId?: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

// ============== HEALTH ==============
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fotocopy-api', version: '1.0', timestamp: new Date().toISOString() });
});

// ============== AUTH ==============
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, role = 'OWNER' } = req.body;

  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Data tidak lengkap atau password < 6 karakter' });
  }

  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email sudah terdaftar' });
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role: ['OWNER', 'ADMIN', 'OPERATOR'].includes(role) ? (role as Role) : 'OWNER',
    storeId: undefined,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: signToken({ id: user.id, email: user.email, role: user.role })
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Email atau password tidak valid' });
  }

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, storeId: user.storeId },
    token: signToken({ id: user.id, email: user.email, role: user.role, storeId: user.storeId })
  });
});

// ============== STORES ==============
app.get('/api/v1/stores', (_req, res) => {
  return res.json({ stores: db.stores });
});

app.post('/api/v1/stores', authMiddleware, requireRole(['OWNER']), (req: AuthRequest, res) => {
  const { name, address, phone, whatsapp, email, description, operatingHours } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama usaha wajib diisi' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'store';
  const store = {
    id: `store-${Date.now()}`,
    name,
    slug,
    address: address || '',
    phone: phone || '',
    whatsapp: whatsapp || '',
    email: email || '',
    description: description || '',
    isOpen: true,
    operatingHours: operatingHours || '',
    createdAt: new Date().toISOString()
  };

  db.stores.push(store);

  if (req.user && !db.users.find(u => u.id === req.user!.id)!.storeId) {
    const user = db.users.find(u => u.id === req.user!.id);
    if (user) user.storeId = store.id;
  }

  return res.status(201).json({ store });
});

app.get('/api/v1/stores/:storeId', (req, res) => {
  const store = db.stores.find(s => s.id === req.params.storeId);
  if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });
  return res.json({ store });
});

app.patch('/api/v1/stores/:storeId', authMiddleware, requireStoreAccess, (req: AuthRequest, res) => {
  const store = db.stores.find(s => s.id === req.params.storeId);
  if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan' });

  Object.assign(store, req.body);
  store.updatedAt = new Date().toISOString();
  return res.json({ store });
});

// ============== SERVICES ==============
app.get('/api/v1/stores/:storeId/services', (req, res) => {
  const services = db.services.filter(s => s.storeId === req.params.storeId);
  return res.json({ services });
});

app.post('/api/v1/stores/:storeId/services', authMiddleware, requireStoreAccess, (req: AuthRequest, res) => {
  const { name, category, unit, description, price, estimatedMinutes, requiresFile, requiresPrinter } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ message: 'Nama dan satuan layanan wajib diisi' });
  }

  const service = {
    id: `svc-${Date.now()}`,
    storeId: req.params.storeId,
    name,
    category: category || 'LAINNYA',
    description: description || '',
    unit,
    isActive: true,
    requiresFile: requiresFile || false,
    requiresPrinter: requiresPrinter || false,
    estimatedMinutes: estimatedMinutes || 15,
    price: price || 0,
    createdAt: new Date().toISOString()
  };

  db.services.push(service);
  return res.status(201).json({ service });
});

app.patch('/api/v1/stores/:storeId/services/:serviceId', authMiddleware, requireStoreAccess, (req: AuthRequest, res) => {
  const service = db.services.find(s => s.id === req.params.serviceId && s.storeId === req.params.storeId);
  if (!service) return res.status(404).json({ message: 'Layanan tidak ditemukan' });

  Object.assign(service, req.body);
  return res.json({ service });
});

// ============== ORDERS ==============
app.post('/api/v1/stores/:storeId/orders', (req: AuthRequest, res) => {
  const { customerName, customerPhone, items, notes } = req.body;

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Nama pelanggan dan item pesanan wajib diisi' });
  }

  const storeId = req.params.storeId;
  const customer = {
    id: `cust-${Date.now()}`,
    storeId,
    name: customerName,
    phone: customerPhone || '',
    createdAt: new Date().toISOString()
  };

  db.customers.push(customer);

  let subtotal = 0;
  const createdItems: typeof db.orderItems = [];

  for (const item of items) {
    const service = db.services.find(s => s.id === item.serviceId && s.storeId === storeId);
    if (!service) {
      return res.status(404).json({ message: `Layanan ${item.serviceId} tidak ditemukan` });
    }

    const itemTotal = (service.price || 0) * (item.quantity || 1);
    subtotal += itemTotal;

    createdItems.push({
      id: `item-${Date.now()}-${Math.random()}`,
      orderId: '',
      serviceId: service.id,
      serviceName: service.name,
      quantity: item.quantity || 1,
      unitPrice: service.price || 0,
      totalPrice: itemTotal
    });
  }

  const order = {
    id: `order-${Date.now()}`,
    storeId,
    orderNumber: db.getNextOrderNumber(storeId),
    customerId: customer.id,
    status: 'WAITING_PAYMENT' as OrderStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    subtotal,
    total: subtotal,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.push(order);

  createdItems.forEach(item => {
    item.orderId = order.id;
    db.orderItems.push(item);
  });

  return res.status(201).json({
    order,
    items: createdItems,
    message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran dengan QRIS.'
  });
});

app.get('/api/v1/stores/:storeId/orders/:orderId', (req, res) => {
  const order = db.orders.find(o => o.id === req.params.orderId && o.storeId === req.params.storeId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  const items = db.orderItems.filter(i => i.orderId === order.id);
  const payment = db.payments.find(p => p.orderId === order.id);
  const printJob = db.printJobs.find(p => p.orderId === order.id);
  const customer = db.customers.find(c => c.id === order.customerId);

  return res.json({ order, items, payment, printJob, customer });
});

app.get('/api/v1/stores/:storeId/orders', (req, res) => {
  const orders = db.orders.filter(o => o.storeId === req.params.storeId);
  const ordersWithDetails = orders.map(order => ({
    ...order,
    customer: db.customers.find(c => c.id === order.customerId),
    payment: db.payments.find(p => p.orderId === order.id),
    printJob: db.printJobs.find(j => j.orderId === order.id)
  }));
  return res.json({ orders: ordersWithDetails });
});

// ============== PAYMENTS - QRIS FLOW ==============

// Generate QRIS dan request pembayaran
app.post('/api/v1/stores/:storeId/orders/:orderId/qris-request', (req: AuthRequest, res) => {
  const order = db.orders.find(o => o.id === req.params.orderId && o.storeId === req.params.storeId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  if (order.paymentStatus !== 'PENDING') {
    return res.status(400).json({ message: 'Pesanan sudah memiliki pembayaran' });
  }

  // Generate QRIS reference (simulasi)
  const qrisRef = `QR-${order.orderNumber}-${Date.now()}`;
  const qrisData = {
    qrisReference: qrisRef,
    amount: order.total,
    storeName: db.stores.find(s => s.id === req.params.storeId)?.name || 'Toko',
    orderNumber: order.orderNumber,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 menit
  };

  // Simpan QRIS payment request
  if (!db.qrisPayments) db.qrisPayments = [];
  db.qrisPayments.push({
    id: `qris-${Date.now()}`,
    orderId: order.id,
    storeId: req.params.storeId,
    qrisReference: qrisRef,
    amount: order.total,
    status: 'WAITING_PAYMENT',
    createdAt: new Date().toISOString(),
    expiresAt: qrisData.expiresAt
  });

  return res.json({
    message: 'QRIS berhasil dibuat',
    qrisData,
    instruction: 'Scan QRIS dengan aplikasi pembayaran untuk menyelesaikan pembayaran'
  });
});

// Cek status pembayaran QRIS
app.get('/api/v1/stores/:storeId/orders/:orderId/qris-status', (req, res) => {
  const order = db.orders.find(o => o.id === req.params.orderId && o.storeId === req.params.storeId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  if (!db.qrisPayments) db.qrisPayments = [];
  const qrisPayment = db.qrisPayments.find(q => q.orderId === order.id);

  if (!qrisPayment) {
    return res.status(404).json({ message: 'QRIS belum diminta' });
  }

  const now = new Date();
  const expiresAt = new Date(qrisPayment.expiresAt);

  if (now > expiresAt) {
    qrisPayment.status = 'EXPIRED';
  }

  return res.json({
    qrisStatus: qrisPayment.status,
    qrisReference: qrisPayment.qrisReference,
    amount: qrisPayment.amount,
    orderNumber: order.orderNumber,
    expiresAt: qrisPayment.expiresAt,
    isExpired: now > expiresAt,
    orderStatus: order.paymentStatus
  });
});

// Webhook dari payment gateway untuk verifikasi pembayaran
app.post('/api/v1/webhooks/payment', (req, res) => {
  const { qrisReference, amount, status, transactionId } = req.body;

  if (!qrisReference || !amount || !status) {
    return res.status(400).json({ message: 'Data webhook tidak lengkap' });
  }

  if (!db.qrisPayments) db.qrisPayments = [];
  const qrisPayment = db.qrisPayments.find(q => q.qrisReference === qrisReference);

  if (!qrisPayment) {
    return res.status(404).json({ message: 'QRIS tidak ditemukan' });
  }

  const order = db.orders.find(o => o.id === qrisPayment.orderId);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

  // Validasi jumlah pembayaran
  if (amount !== order.total) {
    return res.status(400).json({ message: 'Jumlah pembayaran tidak sesuai' });
  }

  // Validasi status pembayaran
  if (status !== 'SUCCESS') {
    qrisPayment.status = status || 'FAILED';
    order.paymentStatus = 'FAILED' as PaymentStatus;
    order.status = 'PAYMENT_FAILED' as OrderStatus;
    order.updatedAt = new Date().toISOString();

    return res.json({
      message: 'Pembayaran gagal',
      orderStatus: order.status,
      paymentStatus: order.paymentStatus
    });
  }

  // Pembayaran berhasil - update order dan buat print job
  const payment = {
    id: `pay-${Date.now()}`,
    storeId: qrisPayment.storeId,
    orderId: order.id,
    method: 'QRIS',
    status: 'PAID' as PaymentStatus,
    amount: amount,
    externalRef: transactionId || qrisReference,
    paidAt: new Date().toISOString(),
    confirmedBy: 'gateway-webhook',
    createdAt: new Date().toISOString()
  };

  db.payments.push(payment);
  qrisPayment.status = 'PAID';

  order.paymentStatus = 'PAID';
  order.status = 'PAID';
  order.updatedAt = new Date().toISOString();

  // Buat print job otomatis setelah pembayaran
  const printJob = {
    id: `job-${Date.now()}`,
    storeId: qrisPayment.storeId,
    orderId: order.id,
    status: 'QUEUED' as const,
    fileName: undefined,
    pageCount: undefined,
    copyCount: undefined,
    paperSize: undefined,
    colorMode: undefined,
    duplex: false,
    createdAt: new Date().toISOString()
  };

  db.printJobs.push(printJob);

  return res.json({
    message: 'Pembayaran berhasil diverifikasi',
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    printJob: printJob,
    payment: payment,
    notification: 'Pesanan siap diproses ke antrian printer'
  });
});

// Manual payment confirmation (untuk admin/operator)
app.post('/api/v1/stores/:storeId/orders/:orderId/confirm-payment', authMiddleware, requireRole(['ADMIN', 'OPERATOR']), (req: AuthRequest, res) => {
  const { amount, transactionId } = req.body;
  const order = db.orders.find(o => o.id === req.params.orderId && o.storeId === req.params.storeId);

  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  if (order.paymentStatus !== 'PENDING') {
    return res.status(400).json({ message: 'Pesanan sudah memiliki status pembayaran' });
  }

  if (amount !== order.total) {
    return res.status(400).json({ message: `Jumlah harus Rp${order.total.toLocaleString('id-ID')}` });
  }

  const payment = {
    id: `pay-${Date.now()}`,
    storeId: req.params.storeId,
    orderId: order.id,
    method: 'MANUAL',
    status: 'PAID' as PaymentStatus,
    amount: amount,
    externalRef: transactionId || '',
    paidAt: new Date().toISOString(),
    confirmedBy: req.user!.id,
    createdAt: new Date().toISOString()
  };

  db.payments.push(payment);

  order.paymentStatus = 'PAID';
  order.status = 'PAID';
  order.updatedAt = new Date().toISOString();

  const printJob = {
    id: `job-${Date.now()}`,
    storeId: req.params.storeId,
    orderId: order.id,
    status: 'QUEUED' as const,
    fileName: undefined,
    pageCount: undefined,
    copyCount: undefined,
    paperSize: undefined,
    colorMode: undefined,
    duplex: false,
    createdAt: new Date().toISOString()
  };

  db.printJobs.push(printJob);

  return res.json({
    message: 'Pembayaran berhasil dikonfirmasi',
    payment,
    order,
    printJob,
    notification: 'Pesanan masuk antrian printer'
  });
});

// ============== PRINT JOBS ==============
app.get('/api/v1/stores/:storeId/print-jobs', (req, res) => {
  const jobs = db.printJobs.filter(j => j.storeId === req.params.storeId);
  const jobsWithOrder = jobs.map(job => ({
    ...job,
    order: db.orders.find(o => o.id === job.orderId),
    customer: db.customers.find(c => c.id === db.orders.find(o => o.id === job.orderId)?.customerId)
  }));
  return res.json({ printJobs: jobsWithOrder });
});

app.patch('/api/v1/stores/:storeId/print-jobs/:jobId', authMiddleware, requireRole(['OPERATOR']), (req: AuthRequest, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status wajib diisi' });
  }

  const job = db.printJobs.find(j => j.id === req.params.jobId && j.storeId === req.params.storeId);
  if (!job) return res.status(404).json({ message: 'Print job tidak ditemukan' });

  job.status = status;

  const order = db.orders.find(o => o.id === job.orderId);
  if (order) {
    if (status === 'PROCESSING') order.status = 'PROCESSING';
    if (status === 'COMPLETED') order.status = 'READY_FOR_PICKUP';
  }

  return res.json({ printJob: job, order });
});

app.patch('/api/v1/stores/:storeId/orders/:orderId/complete', authMiddleware, requireRole(['OPERATOR']), (req: AuthRequest, res) => {
  const order = db.orders.find(o => o.id === req.params.orderId && o.storeId === req.params.storeId);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

  order.status = 'COMPLETED';
  order.updatedAt = new Date().toISOString();

  return res.json({ message: 'Pesanan berhasil diselesaikan', order });
});

// ============== REPORTS ==============
app.get('/api/v1/stores/:storeId/reports/summary', (req, res) => {
  const orders = db.orders.filter(o => o.storeId === req.params.storeId);
  const payments = db.payments.filter(p => p.storeId === req.params.storeId);

  const summary = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
    pendingPayments: orders.filter(o => o.paymentStatus === 'PENDING').length,
    totalRevenue: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    totalCustomers: new Set(orders.map(o => o.customerId)).size,
    averageOrderValue: orders.length > 0 ? payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0) / orders.length : 0
  };

  return res.json(summary);
});

app.listen(port, () => {
  console.log(`\n✅ Fotocopy API running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Demo login: owner@kopicopy.id / admin123\n`);
});
