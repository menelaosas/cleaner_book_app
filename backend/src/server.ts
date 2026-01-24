// backend/src/server.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import cleanerRoutes from './routes/cleaner.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import messageRoutes from './routes/message.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

// Config
import { config } from './config/config';
import { prisma } from './config/database';
import { redisClient } from './config/redis';

class App {
  public app: Application;
  public httpServer;
  public io: SocketServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/api/', limiter);

    // Stricter rate limit for auth routes
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many authentication attempts, please try again later.',
    });
    this.app.use('/api/auth/login', authLimiter);
    this.app.use('/api/auth/register', authLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
      });
    });
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    // API Routes
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/cleaners', cleanerRoutes);
    apiRouter.use('/bookings', bookingRoutes);
    apiRouter.use('/payments', paymentRoutes);
    apiRouter.use('/reviews', reviewRoutes);
    apiRouter.use('/messages', messageRoutes);

    this.app.use('/api', apiRouter);
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join user-specific room
      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join booking-specific room for messaging
      socket.on('join-booking', (bookingId: string) => {
        socket.join(`booking:${bookingId}`);
        console.log(`User joined booking room: ${bookingId}`);
      });

      // Handle new messages
      socket.on('send-message', async (data) => {
        const { bookingId, senderId, content } = data;
        
        // Emit to all users in the booking room
        this.io.to(`booking:${bookingId}`).emit('new-message', {
          bookingId,
          senderId,
          content,
          timestamp: new Date(),
        });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connected');

      // Test Redis connection
      await redisClient.ping();
      console.log('✅ Redis connected');

      // Start server
      const port = config.port || 5000;
      this.httpServer.listen(port, () => {
        console.log(`🚀 Server running on port ${port} in ${config.nodeEnv} mode`);
        console.log(`📝 API documentation: http://localhost:${port}/api-docs`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down gracefully...');
    
    await prisma.$disconnect();
    await redisClient.quit();
    
    this.httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
}

// Create and start server
const app = new App();

// Graceful shutdown
process.on('SIGTERM', () => app.shutdown());
process.on('SIGINT', () => app.shutdown());

// Start server
app.start();

export default app;
