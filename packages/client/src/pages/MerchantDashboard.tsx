import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Users, Clock, CheckCircle, XCircle, Plus, Loader2, LogOut, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

interface KYC {
  id: string;
  status: string;
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
  idDocuments: string[];
  passportPhotoUrl?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function MerchantDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [kycs, setKycs] = useState<KYC[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [selectedKYC, setSelectedKYC] = useState<KYC | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const merchant = api.getToken();
    if (!merchant) {
      navigate('/login');
      return;
    }
    loadData();
  }, [slug, filter]);

  const loadData = async () => {
    try {
      const [kycRes, statsRes] = await Promise.all([
        api.getMerchantKYCs(filter === 'all' ? undefined : filter),
        api.getMerchantStats(),
      ]);
      setKycs(kycRes.kycs);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const result = await api.createKYCToken();
      setNewLink(result.url);
      const fullUrl = `${window.location.origin}/merchant/${slug}/kyc?token=${result.token}`;
      await navigator.clipboard.writeText(fullUrl);
    } catch (error) {
      console.error('Failed to generate link:', error);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.updateKYCStatus(id, status);
      loadData();
      setSelectedKYC(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">KYC Dashboard</h1>
              <p className="text-sm text-slate-500">/{slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>KYC Submissions</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleGenerateLink} disabled={generatingLink}>
                  {generatingLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Generate KYC Link
                </Button>
              </div>
            </div>
            {newLink && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Link copied to clipboard!</span>
                </div>
                <Link
                  to={`/merchant/${slug}/kyc?token=${newLink.split('token=')[1]}`}
                  target="_blank"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="mt-0">
                {kycs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No KYC submissions yet</p>
                    <p className="text-sm">Generate a KYC link to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kycs.map((kyc) => (
                      <div
                        key={kyc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedKYC(kyc)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {kyc.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{kyc.user.name}</p>
                            <p className="text-sm text-muted-foreground">{kyc.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-muted-foreground">
                            {new Date(kyc.createdAt).toLocaleDateString()}
                          </p>
                          {getStatusBadge(kyc.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {selectedKYC && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>KYC Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p>{selectedKYC.kycData.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p>{selectedKYC.kycData.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{selectedKYC.kycData.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p>{selectedKYC.kycData.country}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Street</p>
                      <p>{selectedKYC.kycData.street}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">City</p>
                      <p>{selectedKYC.kycData.city}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">State/Province</p>
                      <p>{selectedKYC.kycData.state}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Postal Code</p>
                      <p>{selectedKYC.kycData.postalCode}</p>
                    </div>
                  </div>
                </div>

                  <div>
                  <h3 className="font-semibold mb-2">Documents</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedKYC.idDocuments?.map((url, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-sm text-muted-foreground">ID Document {index + 1}</p>
                        <div className="relative group">
                          <img
                            src={api.getFileUrl(url)}
                            alt={`ID Document ${index + 1}`}
                            className="rounded-lg border w-full h-24 object-cover cursor-pointer"
                            onClick={() => window.open(api.getFileUrl(url), '_blank')}
                          />
                          <a
                            href={api.getFileUrl(url)}
                            download={`ID_Document_${index + 1}`}
                            className="absolute bottom-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {selectedKYC.passportPhotoUrl && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Passport Photo</p>
                        <div className="relative group">
                          <img
                            src={api.getFileUrl(selectedKYC.passportPhotoUrl)}
                            alt="Passport Photo"
                            className="rounded-lg border w-full h-24 object-cover cursor-pointer"
                            onClick={() => selectedKYC.passportPhotoUrl && window.open(api.getFileUrl(selectedKYC.passportPhotoUrl), '_blank')}
                          />
                          <a
                            href={selectedKYC.passportPhotoUrl ? api.getFileUrl(selectedKYC.passportPhotoUrl) : '#'}
                            download="Passport_Photo"
                            className="absolute bottom-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  {selectedKYC.status === 'PENDING' && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedKYC.id, 'REJECTED')}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleStatusUpdate(selectedKYC.id, 'APPROVED')}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setSelectedKYC(null)} className="flex-1">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
