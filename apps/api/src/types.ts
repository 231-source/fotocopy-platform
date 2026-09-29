export type Role = 'OWNER' | 'ADMIN' | 'OPERATOR';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
export type OrderStatus = 'WAITING_PAYMENT' | 'PAID' | 'QUEUED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_FAILED';
export type PrintJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  storeId?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  description?: string;
  isOpen: boolean;
  operatingHours?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  storeId?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  storeId: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  isActive: boolean;
  requiresFile: boolean;
  requiresPrinter: boolean;
  estimatedMinutes?: number;
  price?: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  storeId: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  storeId: string;
  orderId: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  externalRef?: string;
  paidAt?: string;
  confirmedBy?: string;
  createdAt: string;
}

export interface PrintJob {
  id: string;
  storeId: string;
  orderId: string;
  status: PrintJobStatus;
  fileName?: string;
  pageCount?: number;
  copyCount?: number;
  paperSize?: string;
  colorMode?: string;
  duplex?: boolean;
  createdAt: string;
}
