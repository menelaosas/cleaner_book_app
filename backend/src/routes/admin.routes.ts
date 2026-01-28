import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ============================================
// DASHBOARD STATISTICS
// ============================================

// GET /api/admin/stats/overview - Get dashboard overview statistics
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Parallel queries for better performance
    const [
      totalUsers,
      totalCleaners,
      activeCleaners,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalReviews,
      revenueData,
      usersThisMonth,
      usersLastMonth,
      bookingsThisMonth,
      bookingsLastMonth,
      bookingsThisWeek,
      recentUsers,
      recentBookings,
      topCleaners,
      averageRating,
    ] = await Promise.all([
      // User counts
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'CLEANER' } }),
      prisma.cleanerProfile.count({ where: { isAvailable: true } }),

      // Booking counts
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),

      // Review count
      prisma.review.count(),

      // Revenue (completed payments)
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true, platformFee: true },
      }),

      // Users this month vs last month
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Bookings this month vs last month
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Bookings this week
      prisma.booking.count({
        where: { createdAt: { gte: startOfWeek } },
      }),

      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),

      // Recent bookings (last 5)
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          cleaner: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),

      // Top cleaners by completed bookings
      prisma.cleanerProfile.findMany({
        take: 5,
        orderBy: { completedJobs: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),

      // Average rating
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : 100;
    const bookingGrowth = bookingsLastMonth > 0
      ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100
      : 100;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCleaners,
          activeCleaners,
          totalBookings,
          completedBookings,
          pendingBookings,
          cancelledBookings,
          totalReviews,
          averageRating: averageRating._avg.rating || 0,
        },
        revenue: {
          total: revenueData._sum.amount || 0,
          platformFees: revenueData._sum.platformFee || 0,
        },
        growth: {
          usersThisMonth,
          usersLastMonth,
          userGrowth: Math.round(userGrowth * 10) / 10,
          bookingsThisMonth,
          bookingsLastMonth,
          bookingGrowth: Math.round(bookingGrowth * 10) / 10,
          bookingsThisWeek,
        },
        recent: {
          users: recentUsers,
          bookings: recentBookings,
        },
        topCleaners,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
});

// GET /api/admin/stats/revenue - Get detailed revenue statistics
router.get('/stats/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily revenue for the period
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        platformFee: true,
        cleanerPayout: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyRevenue: Record<string, { total: number; fees: number; payouts: number; count: number }> = {};

    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { total: 0, fees: 0, payouts: 0, count: 0 };
      }
      dailyRevenue[date].total += payment.amount || 0;
      dailyRevenue[date].fees += payment.platformFee || 0;
      dailyRevenue[date].payouts += payment.cleanerPayout || 0;
      dailyRevenue[date].count += 1;
    });

    // Revenue by cleaning type
    const revenueByType = await prisma.booking.groupBy({
      by: ['cleaningType'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Total stats for period
    const periodStats = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      _sum: { amount: true, platformFee: true, cleanerPayout: true },
      _avg: { amount: true },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
          date,
          ...data,
        })),
        revenueByType,
        periodStats: {
          totalRevenue: periodStats._sum.amount || 0,
          platformFees: periodStats._sum.platformFee || 0,
          cleanerPayouts: periodStats._sum.cleanerPayout || 0,
          averageBookingValue: periodStats._avg.amount || 0,
          totalTransactions: periodStats._count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue statistics',
    });
  }
});

// GET /api/admin/stats/analytics - Get analytics data
router.get('/stats/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registrations over time
    const userRegistrations = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group registrations by date
    const registrationsByDate: Record<string, { users: number; cleaners: number }> = {};
    userRegistrations.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!registrationsByDate[date]) {
        registrationsByDate[date] = { users: 0, cleaners: 0 };
      }
      if (user.role === 'CLEANER') {
        registrationsByDate[date].cleaners += 1;
      } else {
        registrationsByDate[date].users += 1;
      }
    });

    // Bookings over time
    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, cleaningType: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group bookings by date
    const bookingsByDate: Record<string, { total: number; completed: number; cancelled: number }> = {};
    bookings.forEach((booking) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = { total: 0, completed: 0, cancelled: 0 };
      }
      bookingsByDate[date].total += 1;
      if (booking.status === 'COMPLETED') {
        bookingsByDate[date].completed += 1;
      } else if (booking.status === 'CANCELLED') {
        bookingsByDate[date].cancelled += 1;
      }
    });

    // Booking distribution by type
    const bookingsByType = await prisma.booking.groupBy({
      by: ['cleaningType'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // Booking distribution by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });

    // User status distribution
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: true,
    });

    // Average ratings over time
    const reviews = await prisma.review.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, rating: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group reviews by date
    const ratingsByDate: Record<string, { sum: number; count: number }> = {};
    reviews.forEach((review) => {
      const date = review.createdAt.toISOString().split('T')[0];
      if (!ratingsByDate[date]) {
        ratingsByDate[date] = { sum: 0, count: 0 };
      }
      ratingsByDate[date].sum += review.rating;
      ratingsByDate[date].count += 1;
    });

    // Popular hours for bookings
    const bookingHours = await prisma.booking.findMany({
      where: { status: { in: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'] } },
      select: { scheduledDate: true },
    });

    const hourDistribution: Record<number, number> = {};
    bookingHours.forEach((booking) => {
      const hour = new Date(booking.scheduledDate).getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        registrations: Object.entries(registrationsByDate).map(([date, data]) => ({
          date,
          ...data,
        })),
        bookings: Object.entries(bookingsByDate).map(([date, data]) => ({
          date,
          ...data,
        })),
        ratings: Object.entries(ratingsByDate).map(([date, data]) => ({
          date,
          average: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0,
          count: data.count,
        })),
        distributions: {
          bookingsByType,
          bookingsByStatus,
          usersByStatus,
          hourDistribution: Object.entries(hourDistribution)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => a.hour - b.hour),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
    });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - List all users with filters
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (role && role !== 'all') {
      where.role = role;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              reviewsGiven: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// GET /api/admin/users/:id - Get user details
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        cleanerProfile: true,
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            cleaner: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        reviewsGiven: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            bookings: true,
            reviewsGiven: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});

// PATCH /api/admin/users/:id/status - Update user status
router.patch('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
});

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['USER', 'CLEANER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // If changing to CLEANER, ensure cleaner profile exists
    if (role === 'CLEANER') {
      const existingProfile = await prisma.cleanerProfile.findUnique({
        where: { userId: id },
      });

      if (!existingProfile) {
        // Create a basic cleaner profile
        await prisma.cleanerProfile.create({
          data: {
            userId: id,
            bio: '',
            hourlyRate: 25,
            experienceYears: 0,
            serviceAreas: [],
            cleaningTypes: ['STANDARD'],
          },
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
    });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow deleting other admins
    if (user.role === 'ADMIN' && user.id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other admin users',
      });
    }

    // Delete user (cascades will handle related records based on schema)
    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

// ============================================
// CLEANER MANAGEMENT
// ============================================

// GET /api/admin/cleaners - List all cleaners with details
router.get('/cleaners', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      isAvailable,
      verified,
      search,
      sortBy = 'completedJobs',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }
    if (verified !== undefined) {
      where.verified = verified === 'true';
    }
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }
    if (status && status !== 'all') {
      where.user = {
        ...where.user,
        status,
      };
    }

    const [cleaners, total] = await Promise.all([
      prisma.cleanerProfile.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.cleanerProfile.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        cleaners,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching cleaners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cleaners',
    });
  }
});

// GET /api/admin/cleaners/:id - Get cleaner details
router.get('/cleaners/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const cleaner = await prisma.cleanerProfile.findUnique({
      where: { id },
      include: {
        user: true,
        bookings: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        reviews: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!cleaner) {
      return res.status(404).json({
        success: false,
        message: 'Cleaner not found',
      });
    }

    // Calculate earnings
    const earnings = await prisma.payment.aggregate({
      where: {
        booking: { cleanerId: id },
        status: 'COMPLETED',
      },
      _sum: { cleanerPayout: true },
    });

    res.json({
      success: true,
      data: {
        ...cleaner,
        totalEarnings: earnings._sum.cleanerPayout || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching cleaner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cleaner',
    });
  }
});

// PATCH /api/admin/cleaners/:id/verify - Toggle cleaner verification
router.patch('/cleaners/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const cleaner = await prisma.cleanerProfile.update({
      where: { id },
      data: { verified: Boolean(verified) },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json({
      success: true,
      message: `Cleaner ${verified ? 'verified' : 'unverified'} successfully`,
      data: cleaner,
    });
  } catch (error) {
    console.error('Error updating cleaner verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cleaner verification',
    });
  }
});

// PATCH /api/admin/cleaners/:id/availability - Toggle cleaner availability
router.patch('/cleaners/:id/availability', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const cleaner = await prisma.cleanerProfile.update({
      where: { id },
      data: { isAvailable: Boolean(isAvailable) },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json({
      success: true,
      message: `Cleaner availability updated`,
      data: cleaner,
    });
  } catch (error) {
    console.error('Error updating cleaner availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cleaner availability',
    });
  }
});

// ============================================
// BOOKING MANAGEMENT
// ============================================

// GET /api/admin/bookings - List all bookings with filters
router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      cleaningType,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (cleaningType && cleaningType !== 'all') {
      where.cleaningType = cleaningType;
    }
    if (dateFrom) {
      where.scheduledDate = {
        ...where.scheduledDate,
        gte: new Date(dateFrom as string),
      };
    }
    if (dateTo) {
      where.scheduledDate = {
        ...where.scheduledDate,
        lte: new Date(dateTo as string),
      };
    }
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { cleaner: { user: { firstName: { contains: search as string, mode: 'insensitive' } } } },
        { cleaner: { user: { lastName: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          cleaner: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          payment: true,
          review: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
});

// GET /api/admin/bookings/:id - Get booking details
router.get('/bookings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        cleaner: {
          include: {
            user: true,
          },
        },
        payment: true,
        review: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
    });
  }
});

// PATCH /api/admin/bookings/:id/status - Update booking status
router.patch('/bookings/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        cleaner: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
    });
  }
});

// ============================================
// REVIEW MANAGEMENT
// ============================================

// GET /api/admin/reviews - List all reviews
router.get('/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (rating) {
      where.rating = parseInt(rating as string, 10);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          cleaner: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          booking: {
            select: {
              id: true,
              cleaningType: true,
              scheduledDate: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
});

// DELETE /api/admin/reviews/:id - Delete a review
router.delete('/reviews/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { cleaner: true },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Delete the review
    await prisma.review.delete({ where: { id } });

    // Recalculate cleaner rating
    const ratings = await prisma.review.aggregate({
      where: { cleanerId: review.cleanerId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.cleanerProfile.update({
      where: { id: review.cleanerId },
      data: {
        rating: ratings._avg.rating || 0,
        totalReviews: ratings._count || 0,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
});

// ============================================
// PAYMENT MANAGEMENT
// ============================================

// GET /api/admin/payments - List all payments
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (dateFrom) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(dateFrom as string),
      };
    }
    if (dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(dateTo as string),
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          booking: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              cleaner: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
});

// ============================================
// SYSTEM / NOTIFICATIONS
// ============================================

// POST /api/admin/notifications/broadcast - Send notification to all users
router.post('/notifications/broadcast', async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, targetRole } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    // Get target users
    const where: any = { status: 'ACTIVE' };
    if (targetRole && targetRole !== 'all') {
      where.role = targetRole;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    // Create notifications for all users
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title,
        message,
        type: 'SYSTEM',
      })),
    });

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification',
    });
  }
});

export default router;
