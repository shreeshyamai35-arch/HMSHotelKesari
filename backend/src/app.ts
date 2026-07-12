import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware/error';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import reportRoutes from './routes/reports.routes';
import issueRoutes from './routes/issues.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notifications.routes';
import reviewRoutes from './routes/reviews.routes';
import revenueRoutes from './routes/revenue.routes';
import bookingRoutes from './routes/bookings.routes';
import performanceRoutes from './routes/performance.routes';
import pdfRoutes from './routes/pdf.routes';
import aiRoutes from './routes/ai.routes';
import pmsRoutes from './routes/pms.routes';
import occupancyRoutes from './routes/occupancy.routes';
import settingsRoutes from './routes/settings.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin.split(',').map((s) => s.trim()), credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/revenue', revenueRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/performance', performanceRoutes);
  app.use('/api/pdf', pdfRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/pms', pmsRoutes);
  app.use('/api/occupancy', occupancyRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
