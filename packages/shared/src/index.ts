export interface JWTPayload {
  merchantId: string;
  email: string;
}

export interface UserJWTPayload {
  userId: string;
  email: string;
}

export type KYCStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KYCSData {
  name: string;
  email: string;
  phone: string;
  country: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface MerchantInfo {
  id: string;
  name: string;
  slug: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface KYCTokenResponse {
  valid: boolean;
  merchant: MerchantInfo;
  user?: UserInfo;
  token: string;
}

export interface MerchantStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface KYCSubmission {
  id: string;
  status: KYCStatus;
  kycData: KYCSData;
  idDocuments: string[];
  passportPhotoUrl?: string;
  createdAt: string;
  user: UserInfo;
}

export interface PaginatedResponse<T> {
  kycs: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
