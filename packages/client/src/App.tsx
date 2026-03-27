import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { MerchantLogin } from './pages/MerchantLogin';
import { MerchantRegister } from './pages/MerchantRegister';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { KYCForm } from './pages/KYCForm';
import { AdminPanel } from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<MerchantLogin />} />
        <Route path="/register" element={<MerchantRegister />} />
        <Route path="/dashboard/:slug" element={<MerchantDashboard />} />
        <Route path="/merchant/:slug/kyc" element={<KYCForm />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
