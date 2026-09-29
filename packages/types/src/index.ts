export type Role = 'OWNER' | 'ADMIN' | 'OPERATOR';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

export type OrderStatus =
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'QUEUED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  isOpen: boolean;
}

export interface CustomerOrderInput {
  customerName: string;
  customerPhone?: string;
  serviceId: string;
  notes?: string;
}
