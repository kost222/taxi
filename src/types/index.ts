export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'passenger' | 'driver';
  createdAt: string;
  updatedAt: string;
}

export interface Driver extends User {
  driverCode: string;
  carModel: string;
  carNumber: string;
  carColor: string;
  carClass: 'economy' | 'comfort' | 'business' | 'premium';
  latitude: number;
  longitude: number;
  isActive: boolean;
  rating: number;
  totalRides: number;
}

export interface Order {
  b_id: string;
  b_driver_code?: string;
  b_passenger_id: string;
  b_start_address: string;
  b_start_latitude: number;
  b_start_longitude: number;
  b_destination_address: string;
  b_destination_latitude: number;
  b_destination_longitude: number;
  b_contact: string;
  b_start_datetime: string;
  b_passengers_count: number;
  b_car_class: 'economy' | 'comfort' | 'business' | 'premium';
  b_payment_way: 'cash' | 'card' | 'online';
  b_max_waiting: number;
  b_services: string[];
  b_options: string[];
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface CreateOrderRequest {
  b_start_address: string;
  b_start_latitude: number;
  b_start_longitude: number;
  b_destination_address: string;
  b_destination_latitude: number;
  b_destination_longitude: number;
  b_contact: string;
  b_start_datetime: string;
  b_passengers_count: number;
  b_car_class: 'economy' | 'comfort' | 'business' | 'premium';
  b_payment_way: 'cash' | 'card' | 'online';
  b_max_waiting: number;
  b_services: string[];
  b_options: string[];
}

export interface CreateOrderResponse {
  b_id: string;
  b_driver_code: string | null;
  message: string;
  success: boolean;
}