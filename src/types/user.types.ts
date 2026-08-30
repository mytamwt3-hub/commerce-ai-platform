export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'merchant' | 'customer' | 'investor' | 'delivery' | 'admin';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantProfile {
  id: string;
  userId: string;
  companyName: string;
  taxNumber: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  logo?: string;
  accountingType: 'manual' | 'ai' | 'hybrid';
  subscription: 'free' | 'basic' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestorProfile {
  id: string;
  userId: string;
  walletBalance: number;
  totalInvested: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryProfile {
  id: string;
  userId: string;
  vehicleType: string;
  licenseNumber: string;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  totalDeliveries: number;
  earnings: number;
  createdAt: Date;
  updatedAt: Date;
}
