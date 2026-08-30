export interface Delivery {
  id: string;
  orderId: string;
  merchantId: string;
  customerId: string;
  deliveryPersonId: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  shippingCost: number;
  estimatedTime: number;
  actualTime?: number;
  rating?: number;
  review?: string;
  trackingUpdates: TrackingUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface TrackingUpdate {
  status: string;
  timestamp: Date;
  location?: Location;
}

export interface DeliveryAssignment {
  id: string;
  deliveryPersonId: string;
  orderId: string;
  status: 'offered' | 'accepted' | 'rejected';
  offeredAt: Date;
  responseAt?: Date;
}
