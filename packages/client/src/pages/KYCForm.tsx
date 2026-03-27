import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { api } from '@/lib/api';

interface VerificationData {
  valid: boolean;
  merchant: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  token: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany',
  'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico',
  'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Saudi Arabia',
  'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden',
  'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'UAE', 'Ukraine',
  'United Kingdom', 'United States', 'Venezuela', 'Vietnam', 'Other'
];

export function KYCForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [isNewUser, setIsNewUser] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    country: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [documents, setDocuments] = useState({
    idDocuments: [] as string[],
    passportPhotoUrl: '',
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid link: No token provided');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const data = await api.verifyKYCToken(token);
        setVerification(data);
        if (data.user) {
          setFormData({
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            country: '',
            street: '',
            city: '',
            state: '',
            postalCode: '',
          });
        } else {
          setIsNewUser(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired token');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isNewUser && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (documents.idDocuments.length === 0) {
      setError('Please upload at least one government ID document');
      return;
    }

    if (!documents.passportPhotoUrl) {
      setError('Please upload a passport size photo');
      return;
    }

    setSubmitting(true);

    try {
      await api.submitKYC({
        token: token!,
        kycData: formData,
        idDocuments: documents.idDocuments,
        passportPhotoUrl: documents.passportPhotoUrl,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>KYC Submitted Successfully!</CardTitle>
            <CardDescription>
              Your verification has been submitted to {verification?.merchant.name}.
              You will be notified once it's reviewed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{verification?.merchant.name}</h1>
          <p className="text-slate-600 mt-2">Identity Verification</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete Your Verification</CardTitle>
            <CardDescription>
              Please fill in your details and upload required documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {isNewUser && (
                <div className="space-y-4 pb-6 border-b">
                  <h3 className="font-semibold">Create Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a password to save your information for future verifications
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={isNewUser}
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={isNewUser}
                    />
                  </div>
                </div>
              )}

              {/* Passport Size Photo - TOP */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-semibold">Passport Size Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Please upload a clear passport size photo for facial verification.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload
                    label="Passport Photo"
                    value={documents.passportPhotoUrl}
                    onChange={(url) => setDocuments({ ...documents, passportPhotoUrl: url })}
                    required
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="House No., Street Name"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Government ID Documents - Multiple Uploads */}
              <div className="space-y-4 pt-6 border-t">
                <MultiFileUpload
                  label="Government ID Documents"
                  description="Please upload valid government ID documents such as Driver License, National ID (like Aadhar or Passport), or any other valid identity document. You can upload up to 10 files."
                  value={documents.idDocuments}
                  onChange={(urls) => setDocuments({ ...documents, idDocuments: urls })}
                  maxFiles={10}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
