import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /reviews - Create a review for a completed booking
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user!.id;
    const { bookingId, rating, comment, punctuality, professionalism, quality } = req.body;

    // Validate required fields
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the customer can leave a review
    if (booking.userId !== reviewerId) {
      return res.status(403).json({ success: false, message: 'Only the customer can leave a review' });
    }

    // Booking must be completed
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    if (booking.review) {
      return res.status(400).json({ success: false, message: 'Review already exists for this booking' });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId,
        cleanerId: booking.cleanerId,
        rating,
        comment: comment || null,
        punctuality: punctuality || null,
        professionalism: professionalism || null,
        quality: quality || null,
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update cleaner's average rating
    const allReviews = await prisma.review.findMany({
      where: { cleanerId: booking.cleanerId },
      select: { rating: true },
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.cleanerProfile.update({
      where: { userId: booking.cleanerId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    });

    // Notify the cleaner
    await prisma.notification.create({
      data: {
        userId: booking.cleanerId,
        type: 'NEW_REVIEW',
        title: 'New Review',
        message: `You received a ${rating}-star review!`,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Failed to create review' });
  }
});

// GET /reviews/cleaner/:cleanerId - Get reviews for a cleaner
router.get('/cleaner/:cleanerId', async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    const reviews = await prisma.review.findMany({
      where: {
        cleanerId,
        isPublic: true,
      },
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
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.review.count({
      where: { cleanerId, isPublic: true },
    });

    // Calculate rating breakdown
    const ratingBreakdown = await prisma.review.groupBy({
      by: ['rating'],
      where: { cleanerId },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        reviews,
        total,
        ratingBreakdown: ratingBreakdown.map(r => ({ rating: r.rating, count: r._count })),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// GET /reviews/:id - Get single review
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        cleaner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch review' });
  }
});

// PATCH /reviews/:id - Update review (only by reviewer)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { rating, comment, punctuality, professionalism, quality } = req.body;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only the reviewer can update
    if (review.reviewerId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
        ...(punctuality !== undefined && { punctuality }),
        ...(professionalism !== undefined && { professionalism }),
        ...(quality !== undefined && { quality }),
      },
    });

    // Recalculate cleaner's average rating if rating changed
    if (rating !== undefined) {
      const allReviews = await prisma.review.findMany({
        where: { cleanerId: review.cleanerId },
        select: { rating: true },
      });

      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.cleanerProfile.update({
        where: { userId: review.cleanerId },
        data: {
          averageRating: Math.round(averageRating * 10) / 10,
        },
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Failed to update review' });
  }
});

// DELETE /reviews/:id - Delete review (only by reviewer or admin)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only the reviewer or admin can delete
    if (review.reviewerId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.review.delete({ where: { id } });

    // Recalculate cleaner's average rating
    const allReviews = await prisma.review.findMany({
      where: { cleanerId: review.cleanerId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.cleanerProfile.update({
        where: { userId: review.cleanerId },
        data: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: allReviews.length,
        },
      });
    } else {
      await prisma.cleanerProfile.update({
        where: { userId: review.cleanerId },
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });
    }

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
});

// GET /reviews/my-reviews - Get reviews left by the current user
router.get('/my-reviews', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const reviews = await prisma.review.findMany({
      where: { reviewerId: userId },
      include: {
        cleaner: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            scheduledDate: true,
            cleaningType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

export default router;
