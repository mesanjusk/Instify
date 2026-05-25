const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const whatsappRoutes = require('./routes/whatsappRoutes');
const { initCronJobs } = require('./services/cronService');
const { autoReconnectSessions } = require('./services/baileysService');

dotenv.config();

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
  initCronJobs();
  // Restore and reconnect any active WhatsApp sessions after every deploy/restart
  autoReconnectSessions().catch(e => console.error('autoReconnectSessions:', e.message));
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Rate limiter for auth endpoints (max 10 attempts per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts — try again in 15 minutes' },
});

// ✅ Health check (DB-aware)
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    db: dbStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ✅ Subdomain-aware root route
app.get('/', (req, res) => {
  const host = req.headers.host || '';
  const baseDomains = ['onrender.com', 'render.com'];
  const isSubdomain = baseDomains.some(base =>
    host.endsWith(base) && host.split('.').length > base.split('.').length + 1
  );
  res.send(isSubdomain
    ? '🌐 Subdomain detected. Use frontend interface.'
    : '✅ API is running...');
});

// ✅ Core routes
app.use('/api', require('./routers/otpRoutes'));
app.use('/api/auth', authLimiter, require('./routers/authRoutes'));
app.use('/api/institute', require('./routers/instituteRoutes'));
app.use('/api/branding', require('./routers/brandingRoutes'));
app.use('/api/metadata', require('./routers/metadataRoute'));
app.use('/api/upload', require('./uploadRoute'));

// ✅ Domain routes
app.use('/api/courses', require('./routers/courseRoutes'));
app.use('/api/courseCategory', require('./routers/courseCategoryRoutes'));
app.use('/api/batches', require('./routers/batchRoutes'));
app.use('/api/org-categories', require('./routers/orgCategoryRoutes'));
app.use('/api/education', require('./routers/educationRoutes'));
app.use('/api/exams', require('./routers/examRoutes'));
app.use('/api/paymentmode', require('./routers/paymentModeRoutes'));

// ✅ New modular structure for leads, students, admissions
app.use('/api/students', require('./routers/studentRoutes'));
app.use('/api/leads', require('./routers/leadRoutes'));
app.use('/api/transaction', require('./routers/transactionRoutes'));
app.use('/api/account', require('./routers/accountRoutes'));
app.use('/api/accountgroup', require('./routers/accountgroupRoutes'));
app.use('/api/admissions', require('./routers/admissionRoutes'));
app.use('/api/fees', require('./routers/feesRoutes'));
app.use('/api/attendance', require('./routers/attendanceRoutes'));
app.use('/api/dashboard-stats', require('./routers/dashboardStats'));
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/whatsapp', require('./modules/whatsapp/whatsapp.routes'));
app.use('/api/baileys', require('./routers/baileysRoutes'));
app.use('/api/upi', require('./routers/upiRoutes'));
app.use('/api/csv-import', require('./routers/csvImportRoutes'));
app.use('/api/record', require('./routers/recordRoutes'));
app.use('/api/designs', require('./routers/designRoutes'));
app.use('/api/employees', require('./routers/employeeRoutes'));
app.use('/api/message-templates', require('./routers/messageTemplateRoutes'));
app.use('/api/reports', require('./routers/reportsRoutes'));
app.use('/api/custom-templates', require('./routers/customTemplateRoutes'));
app.use('/api/forms', require('./routers/formRoutes'));
app.use('/api/idcard', require('./routers/idCardRoutes'));


// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Optional global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
