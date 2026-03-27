import { Request } from 'express';
export { JWTPayload, UserJWTPayload, KYCStatus } from '@kyc/shared';

export interface KYCSData {
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
}

export interface AuthRequest extends Request {
  merchant?: {
    id: string;
    email: string;
    name: string;
    slug: string;
  };
}

export interface UserRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
