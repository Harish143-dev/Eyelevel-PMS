import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';

dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'https://eyelevel-pms.vercel.app';
console.log(`[Config] Allowed Client Origin: ${CLIENT_URL}`);

import prisma from './config/db';
import { initSocket } from './config/socket';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import attachmentRoutes from './routes/attachment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import todoRoutes from './routes/todo.routes';
import searchRoutes from './routes/search.routes';
import timeRoutes from './routes/time.routes';
import analyticsRoutes from './routes/analytics.routes';
import departmentRoutes from './routes/department.routes';
import milestoneRoutes from './routes/milestone.routes';
import chatRoutes from './routes/chat.routes';
import leaveRoutes from './routes/leave.routes';
import templateRoutes from './routes/template.routes';
import documentRoutes from './routes/document.routes';
import clientRoutes from './routes/client.routes';
import payrollRoutes from './routes/payroll.routes';
import performanceRoutes from './routes/performance.routes';
import sessionRoutes from './routes/session.routes';
import activityTrackingRoutes from './routes/activityTracking.routes';
import onboardingRoutes from './routes/onboarding.routes';
import companyRoutes from './routes/company.routes';
import monitoringRoutes from './routes/monitoring.routes';
import workflowRoutes from './routes/workflow.routes';
import customFieldRoutes from './routes/customField.routes';
import dataRoutes from './routes/data.routes';
import tenantRoutes from './routes/tenant.routes';
import { initCronJobs } from './services/cron.service';
import { authLimiter, mutationLimiter, sensitiveLimiter } from './middleware/rateLimit.middleware';

const app = express();

// TRUST PROXY (required for Render/Heroku/Vercel load balancers to see correct IP)
// Must be set BEFORE rate limiters or other IP-dependent middleware
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.set('trust proxy', 1);
}

const server = createServer(app);

// Initialize Socket.io
initSocket(server);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", CLIENT_URL],
    },
  } : false, // Disabled in development for hot-reload compatibility
}));
app.use(morgan('short'));

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Debugging Middleware (Only in Production to see what's reaching Render)
if (process.env.NODE_ENV === 'production' || true) {
  app.use((req, _res, next) => {
    if (req.path.includes('/api/auth') || req.path.includes('/api/tenant')) {
      console.log(`[Debug] ${req.method} ${req.path}`);
      console.log(`[Debug] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Debug] Body Keys:`, Object.keys(req.body || {}));
    }
    next();
  });
}

// Global rate limiting for mutation requests (POST/PUT/DELETE)
app.use('/api', mutationLimiter);

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
// app.use('/uploads', express.static(path.resolve(uploadDir)));

// API Routes
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error: any) {
    dbStatus = `error: ${error.message}`;
    console.error('[Health] DB Connection failed:', error);
  }
  
  res.json({ 
    status: 'ok', 
    database: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Tenant branding resolution (Public)
app.use('/api/tenant', tenantRoutes);

app.use('/api/auth', authRoutes);


app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes); // task routes have both /projects/:id/tasks and /tasks/:id
app.use('/api', commentRoutes);
// app.use('/api', attachmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects/:projectId/milestones', milestoneRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api/leaves', leaveRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api', documentRoutes); // handles /api/projects/:id/documents and /api/documents/:id
app.use('/api/clients', clientRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/activity-tracking', activityTrackingRoutes);
import roleRoutes from './routes/role.routes';
import settingsRoutes from './routes/settings.routes';

// Start app routes definitions here...
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/data', dataRoutes);

import { errorHandler } from './middleware/errorHandler.middleware';

// Centralized error handling
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

// Start background jobs
initCronJobs();

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
