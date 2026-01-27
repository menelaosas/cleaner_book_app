import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /cleaners - List all cleaners with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, tags, minRating, maxRate } = req.query;

    const cleaners = await prisma.cleanerProfile.findMany({
      where: {
        isVerified: true,
        ...(minRating && { averageRating: { gte: parseFloat(minRating as string) } }),
        ...(maxRate && { hourlyRate: { lte: parseFloat(maxRate as string) } }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { averageRating: 'desc' },
    });

    // Filter by search term if provided
    let filteredCleaners = cleaners;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredCleaners = cleaners.filter(
        (c) =>
          c.user.firstName.toLowerCase().includes(searchLower) ||
          c.user.lastName.toLowerCase().includes(searchLower) ||
          c.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tags if provided
    if (tags) {
      const tagList = (tags as string).split(',');
      filteredCleaners = filteredCleaners.filter((c) =>
        tagList.some((tag) => c.tags.includes(tag))
      );
    }

    res.json({ success: true, data: filteredCleaners });
  } catch (error) {
    console.error('Error fetching cleaners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cleaners' });
  }
});

// GET /cleaners/me - Get current user's cleaner profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.cleanerProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        availabilities: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching cleaner profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PATCH /cleaners/me - Update current user's cleaner profile
router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bio, yearsExperience, hourlyRate, specialties, tags, serviceAreas, maxTravelDistance, availabilities } = req.body;

    const profile = await prisma.cleanerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }

    // Update profile data
    const updated = await prisma.cleanerProfile.update({
      where: { userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(specialties !== undefined && { specialties }),
        ...(tags !== undefined && { tags }),
        ...(serviceAreas !== undefined && { serviceAreas }),
        ...(maxTravelDistance !== undefined && { maxTravelDistance }),
      },
    });

    // Update availabilities if provided
    if (availabilities && Array.isArray(availabilities)) {
      // Delete existing availabilities
      await prisma.availability.deleteMany({
        where: { cleanerId: profile.id },
      });

      // Create new availabilities
      if (availabilities.length > 0) {
        await prisma.availability.createMany({
          data: availabilities.map((a: any) => ({
            cleanerId: profile.id,
            dayOfWeek: a.dayOfWeek,
            timeSlot: a.timeSlot,
            isAvailable: a.isAvailable ?? true,
          })),
        });
      }
    }

    // Fetch updated profile with availabilities
    const result = await prisma.cleanerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        availabilities: true,
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating cleaner profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// GET /cleaners/me/bookings - Get cleaner's bookings
router.get('/me/bookings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { cleanerId: req.user!.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /cleaners/me/stats - Get cleaner's stats
router.get('/me/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.cleanerProfile.findUnique({
      where: { userId: req.user!.id },
    });

    const completedBookings = await prisma.booking.count({
      where: { cleanerId: req.user!.id, status: 'COMPLETED' },
    });

    const upcomingBookings = await prisma.booking.count({
      where: {
        cleanerId: req.user!.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const earnings = await prisma.payment.aggregate({
      where: {
        booking: { cleanerId: req.user!.id },
        status: 'COMPLETED',
      },
      _sum: { cleanerPayout: true },
    });

    res.json({
      success: true,
      data: {
        totalEarnings: earnings._sum.cleanerPayout || 0,
        completedJobs: completedBookings,
        upcomingJobs: upcomingBookings,
        rating: profile?.averageRating || 0,
        reviewCount: profile?.totalReviews || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /cleaners/:id - Get cleaner by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.cleanerProfile.findFirst({
      where: {
        OR: [
          { id },
          { userId: id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
        availabilities: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Cleaner not found' });
    }

    // Get reviews for this cleaner
    const reviews = await prisma.review.findMany({
      where: { cleanerId: profile.userId },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ success: true, data: { ...profile, reviews } });
  } catch (error) {
    console.error('Error fetching cleaner:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cleaner' });
  }
});

// POST /cleaners - Create cleaner profile
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { bio, yearsExperience, hourlyRate, specialties, tags, serviceAreas, availabilities } = req.body;

    // Check if profile already exists
    const existing = await prisma.cleanerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Cleaner profile already exists' });
    }

    // Create the cleaner profile
    const profile = await prisma.cleanerProfile.create({
      data: {
        userId,
        bio: bio || '',
        yearsExperience: yearsExperience || 0,
        hourlyRate: hourlyRate || 35,
        specialties: specialties || [],
        tags: tags || [],
        serviceAreas: serviceAreas || [],
      },
    });

    // Update user role to CLEANER
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'CLEANER' },
    });

    // Create availabilities if provided
    if (availabilities && Array.isArray(availabilities)) {
      await prisma.availability.createMany({
        data: availabilities.map((a: any) => ({
          cleanerId: profile.id,
          dayOfWeek: a.dayOfWeek,
          timeSlot: a.timeSlot,
          isAvailable: a.isAvailable ?? true,
        })),
      });
    }

    const fullProfile = await prisma.cleanerProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        availabilities: true,
      },
    });

    res.status(201).json({ success: true, data: fullProfile });
  } catch (error) {
    console.error('Error creating cleaner profile:', error);
    res.status(500).json({ success: false, message: 'Failed to create profile' });
  }
});

// PATCH /cleaners/:id - Update cleaner profile
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { bio, yearsExperience, hourlyRate, specialties, tags, serviceAreas } = req.body;

    // Verify ownership
    const profile = await prisma.cleanerProfile.findFirst({
      where: {
        OR: [
          { id, userId },
          { userId: id },
        ],
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found or unauthorized' });
    }

    const updated = await prisma.cleanerProfile.update({
      where: { id: profile.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(specialties !== undefined && { specialties }),
        ...(tags !== undefined && { tags }),
        ...(serviceAreas !== undefined && { serviceAreas }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        availabilities: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// PUT /cleaners/:id/availability - Update availability
router.put('/:id/availability', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { availabilities } = req.body;

    const profile = await prisma.cleanerProfile.findFirst({
      where: {
        OR: [
          { id, userId },
          { userId: id },
        ],
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found or unauthorized' });
    }

    // Delete existing and create new
    await prisma.availability.deleteMany({
      where: { cleanerId: profile.id },
    });

    if (availabilities && Array.isArray(availabilities)) {
      await prisma.availability.createMany({
        data: availabilities.map((a: any) => ({
          cleanerId: profile.id,
          dayOfWeek: a.dayOfWeek,
          timeSlot: a.timeSlot,
          isAvailable: a.isAvailable ?? true,
        })),
      });
    }

    const updated = await prisma.cleanerProfile.findUnique({
      where: { id: profile.id },
      include: { availabilities: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
});

export default router;
