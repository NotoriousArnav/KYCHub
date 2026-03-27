const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('merchant_token', token);
    } else {
      localStorage.removeItem('merchant_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('merchant_token');
    }
    return this.token;
  }

  getFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      if (urlObj.origin !== window.location.origin) {
        const key = urlObj.pathname.replace(/^\//, '');
        return `${API_BASE}/files/${key}`;
      }
    }
    return url;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async merchantRegister(data: { name: string; slug: string; email: string; password: string }) {
    return this.request<{ merchant: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async merchantLogin(email: string, password: string) {
    return this.request<{ merchant: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMerchantMe() {
    return this.request<{ merchant: any }>('/auth/me');
  }

  // Merchants
  async getMerchantBySlug(slug: string) {
    return this.request<{ merchant: any }>(`/merchants/slug/${slug}`);
  }

  async getMerchantStats() {
    return this.request<{ total: number; pending: number; approved: number; rejected: number }>('/merchants/stats');
  }

  // KYC Tokens
  async createKYCToken(expiresInHours: number = 72, userId?: string) {
    return this.request<{ token: string; expiresAt: string; url: string }>('/kyc/tokens', {
      method: 'POST',
      body: JSON.stringify({ expiresInHours, userId }),
    });
  }

  async verifyKYCToken(token: string) {
    return this.request<{ valid: boolean; merchant: any; user: any; token: string }>(`/kyc/verify/${token}`);
  }

  async submitKYC(data: {
    token: string;
    kycData: {
      name: string;
      email: string;
      phone: string;
      country: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
    };
    idDocuments?: string[];
    passportPhotoUrl?: string;
  }) {
    return this.request<{ success: boolean; message: string; isNewUser: boolean }>('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadFile(file: File, type: string): Promise<{ success: boolean; url: string; key: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/kyc/upload?type=${type}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async getMerchantKYCs(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return this.request<{ kycs: any[]; pagination: any }>(`/kyc/merchant?${params}`);
  }

  async getKYCById(id: string) {
    return this.request<{ kyc: any }>(`/kyc/merchant/${id}`);
  }

  async updateKYCStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    return this.request<{ kyc: any }>(`/kyc/merchant/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getKYCStatus(merchantSlug: string, token: string) {
    return this.request<{ status: string; createdAt?: string }>(`/kyc/status/${merchantSlug}?token=${token}`);
  }
}

export const api = new ApiClient();
