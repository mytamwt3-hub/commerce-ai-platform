export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  barcode: string;
  category: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  rating: number;
  reviews: Review[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  merchantId: string;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  shippingAddress: string;
  shippingCost: number;
  paymentMethod: 'cash' | 'transfer';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}
