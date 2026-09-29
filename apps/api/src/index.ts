import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
});

app.get('/api/v1/tenant-status', (_req, res) => {
  res.json({
    app: 'fotocopy-platform',
    phase: 'Phase 1',
    multiTenant: true,
    paymentFirst: true,
    status: 'ready-for-store-setup'
  });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
