export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ScheduleItem {
  qty: string | number;
  variant: string;
  delivery: string | number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  schedule?: Record<string, ScheduleItem>;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'collection' | 'expense';
  amount: number;
  date: string;
  description: string;
  customerId?: string | null;
  productId?: string;
  quantity?: number;
  category?: string;
  isDeleted?: boolean;
  paymentMethod?: 'cash' | 'credit';
}

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

export interface Stats {
  lifetimeNet: number;
  totalReceivable: number;
  dayStats: Record<string, any>;
  monthStats: Record<string, any>;
  customerHistory: Record<string, any>;
}