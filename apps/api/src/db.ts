import type { Store, User, Service, Customer, Order, OrderItem, Payment, PrintJob } from './types.js';

interface QRISPayment {
  id: string;
  orderId: string;
  storeId: string;
  qrisReference: string;
  amount: number;
  status: 'WAITING_PAYMENT' | 'PAID' | 'EXPIRED' | 'FAILED';
  createdAt: string;
  expiresAt: string;
}

export class Database {
  stores: Store[] = [
    {
      id: 'store-demo-001',
      name: 'Kopi Copy Center',
      slug: 'kopi-copy-center',
      address: 'Jl. Merdeka No. 12',
      phone: '081234567890',
      whatsapp: '081234567890',
      email: 'hello@kopicopy.id',
      description: 'Fotokopi dan layanan dokumen untuk mahasiswa dan bisnis kecil.',
      isOpen: true,
      operatingHours: 'Senin-Jumat 08.00-21.00',
      createdAt: new Date().toISOString()
    }
  ];

  users: User[] = [
    {
      id: 'user-owner-001',
      name: 'Pemilik Toko',
      email: 'owner@kopicopy.id',
      password: 'admin123',
      role: 'OWNER',
      storeId: 'store-demo-001',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-operator-001',
      name: 'Operator Toko',
      email: 'operator@kopicopy.id',
      password: 'operator123',
      role: 'OPERATOR',
      storeId: 'store-demo-001',
      createdAt: new Date().toISOString()
    }
  ];

  services: Service[] = [
    {
      id: 'svc-001',
      storeId: 'store-demo-001',
      name: 'Print A4 Hitam Putih',
      category: 'PRINTING',
      description: 'Cetak dokumen hitam putih ukuran A4',
      unit: 'Per lembar',
      isActive: true,
      requiresFile: true,
      requiresPrinter: true,
      estimatedMinutes: 10,
      price: 500,
      createdAt: new Date().toISOString()
    },
    {
      id: 'svc-002',
      storeId: 'store-demo-001',
      name: 'Fotokopi A4',
      category: 'FOTOKOPI',
      description: 'Fotokopi dokumen ukuran A4',
      unit: 'Per lembar',
      isActive: true,
      requiresFile: false,
      requiresPrinter: true,
      estimatedMinutes: 8,
      price: 300,
      createdAt: new Date().toISOString()
    },
    {
      id: 'svc-003',
      storeId: 'store-demo-001',
      name: 'Laminasi A4',
      category: 'FINISHING',
      description: 'Laminasi dokumen ukuran A4',
      unit: 'Per lembar',
      isActive: true,
      requiresFile: false,
      requiresPrinter: false,
      estimatedMinutes: 5,
      price: 5000,
      createdAt: new Date().toISOString()
    }
  ];

  customers: Customer[] = [];
  orders: Order[] = [];
  orderItems: OrderItem[] = [];
  payments: Payment[] = [];
  printJobs: PrintJob[] = [];
  qrisPayments: QRISPayment[] = [];

  getNextOrderNumber(storeId: string): string {
    const storeOrders = this.orders.filter(o => o.storeId === storeId);
    const count = storeOrders.length + 1;
    return `FC-${new Date().toISOString().split('T')[0].replace(/-/g, '').slice(-6)}-${String(count).padStart(3, '0')}`;
  }
}

export const db = new Database();
