// Signal types
export interface Signal {
  id: number;
  type: 'OPEN' | 'AVAILABLE' | 'CLOSED';
  media_type: 'photo' | 'video' | 'none';
  media_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  price: string | null;
  lat: number;
  lng: number;
  distance_km?: number;
  is_expired: boolean;
  expires_at: string;
  created_at: string;
  context: Context;
  user: {
    id: number;
    name: string;
    is_verified?: boolean;
  };
  analytics?: {
    views: number;
    taps: number;
    shares: number;
  };
  score?: number;
}

// Context types
export interface Context {
  id: number;
  name: string;
  emoji: string;
  display_name: string;
  parent_category: 'food' | 'services' | 'goods';
  default_expiry_hours: number;
}

export interface GroupedContexts {
  food: Context[];
  services: Context[];
  goods: Context[];
}

// Subscription types
export interface Subscription {
  id: number;
  context_id: number;
  notify: boolean;
  created_at: string;
  context: Context;
}

// Demand types
export interface Demand {
  id: number;
  description: string;
  budget: string | null;
  lat: number;
  lng: number;
  radius_km: number;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  responses_count: number;
  is_expired: boolean;
  distance_km?: number;
  expires_at: string;
  created_at: string;
  context: Context;
  user: {
    id: number;
    name: string;
  };
}

// Chat types
export interface Conversation {
  id: number;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  other_user: {
    id: number;
    name: string;
  };
  latest_message?: {
    id: number;
    content: string;
    type: string;
    sender_id: number;
    created_at: string;
  };
  context?: {
    type: 'signal' | 'demand' | null;
    emoji: string;
    name: string;
  };
  messages?: Message[];
}

export interface Message {
  id: number;
  conversation_id: number;
  content: string;
  type: 'text' | 'image' | 'location';
  media_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender: {
    id: number;
    name: string;
  };
  is_mine: boolean;
}

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_verified?: boolean;
  subscriptions?: Subscription[];
}

// Auth types
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Location types
export interface Location {
  lat: number;
  lng: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Form types
export interface CreateSignalForm {
  context_id: number;
  type?: 'OPEN' | 'AVAILABLE' | 'CLOSED';
  description?: string;
  price?: string;
  lat: number;
  lng: number;
  media: {
    uri: string;
    type: string;
    name: string;
  };
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}
