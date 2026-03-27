import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { merchantRouter } from './routes/merchants.js';
import { kycRouter } from './routes/kyc.js';
import { userRouter } from './routes/users.js';
import { getSignedDownloadUrl } from './services/s3.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/merchants', merchantRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/users', userRouter);

app.get('/api/files/:key(*)', async (req, res) => {
  try {
    const BUCKET = process.env.S3_BUCKET || 'kyc';
    let key = req.params.key;
    // Strip bucket prefix if present (e.g., "kyc/passport-photo/xxx" -> "passport-photo/xxx")
    if (key.startsWith(`${BUCKET}/`)) {
      key = key.substring(BUCKET.length + 1);
    }
    const signedUrl = await getSignedDownloadUrl(key);
    res.redirect(signedUrl);
  } catch (error) {
    console.error('File proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
