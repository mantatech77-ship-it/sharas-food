export interface Category {
  id: string;
  name: string;
  order: number;
  createdAt: any;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  imageUrl: string;
  categoryIds: string[];
  available: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  deliveryDate?: string;
  createdAt: any; // Timestamp
}

export interface AppSetting {
  deliveryEstimate: string;
  updatedAt: any;
}
