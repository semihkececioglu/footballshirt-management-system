import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';

import { errorHandler } from './src/middleware/error.middleware.js';
import authRoutes from './src/routes/auth.routes.js';
import jerseyRoutes from './src/routes/jersey.routes.js';
import saleRoutes from './src/routes/sale.routes.js';
import purchaseRoutes from './src/routes/purchase.routes.js';
import sellerRoutes from './src/routes/seller.routes.js';
import wishlistRoutes from './src/routes/wishlist.routes.js';
import reminderRoutes from './src/routes/reminder.routes.js';
import planItemRoutes from './src/routes/planItem.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
import statsRoutes from './src/routes/stats.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import publicRoutes from './src/routes/public.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jerseys', jerseyRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/planner', planItemRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadRoutes);

// Error handler (must be last)
app.use(errorHandler);

// DB + Start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB bağlandı');
    app.listen(PORT, () => console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    process.exit(1);
  });
