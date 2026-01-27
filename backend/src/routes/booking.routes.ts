import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /bookings - Get user's bookings (or cleaner's bookings)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, upcoming } = req.query;

    let whereClause: any = {};

    // If user is a cleaner, show bookings where they are the cleaner
    // Otherwise show bookings where they are the customer
    if (userRole === 'CLEANER') {
      whereClause.cleanerId = userId;
    } else {
      whereClause.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter for upcoming bookings
    if (upcoming === 'true') {
      whereClause.scheduledDate = { gte: new Date() };
      whereClause.status = { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'] };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id - Get single booking
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only allow access to booking participants
    if (booking.userId !== userId && booking.cleanerId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// POST /bookings - Create a new booking
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      cleanerId,
      scheduledDate,
      scheduledTime,
      duration,
      cleaningType,
      address,
      city,
      state,
      zipCode,
      instructions,
    } = req.body;

    // Validate required fields
    if (!cleanerId || !scheduledDate || !scheduledTime || !duration || !cleaningType || !address || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get cleaner profile to get hourly rate
    // Accept both profile ID and user ID for flexibility
    const cleanerProfile = await prisma.cleanerProfile.findFirst({
      where: {
        OR: [
          { id: cleanerId },
          { userId: cleanerId },
        ],
      },
    });

    if (!cleanerProfile) {
      return res.status(404).json({ success: false, message: 'Cleaner not found' });
    }

    // Calculate pricing
    const hourlyRate = cleanerProfile.hourlyRate;
    const totalHours = duration;
    const subtotal = hourlyRate * totalHours;
    const serviceFee = subtotal * 0.15; // 15% platform fee
    const tax = subtotal * 0.08; // 8% tax (adjust as needed)
    const totalAmount = subtotal + serviceFee + tax;

    // Convert time string (e.g., "10:00") to DateTime for Prisma Time field
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const timeDate = new Date(1970, 0, 1, hours, minutes, 0);

    // Create the booking (use cleanerProfile.userId to ensure we store the user ID)
    const booking = await prisma.booking.create({
      data: {
        userId,
        cleanerId: cleanerProfile.userId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: timeDate,
        duration,
        cleaningType,
        address,
        city,
        state,
        zipCode,
        instructions: instructions || null,
        hourlyRate,
        totalHours,
        subtotal,
        serviceFee,
        tax,
        totalAmount,
        status: 'PENDING',
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
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for cleaner
    await prisma.notification.create({
      data: {
        userId: cleanerProfile.userId,
        type: 'BOOKING_REQUEST',
        title: 'New Booking Request',
        message: `${booking.user.firstName} ${booking.user.lastName} has requested a booking for ${new Date(scheduledDate).toLocaleDateString()}`,
      },
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// POST /bookings/:id/confirm - Cleaner confirms the booking
router.post('/:id/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the cleaner can confirm
    if (booking.cleanerId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the cleaner can confirm this booking' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot confirm booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Notify the customer
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your booking for ${new Date(booking.scheduledDate).toLocaleDateString()} has been confirmed!`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm booking' });
  }
});

// POST /bookings/:id/decline - Cleaner declines the booking
router.post('/:id/decline', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the cleaner can decline
    if (booking.cleanerId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the cleaner can decline this booking' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot decline booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Declined by cleaner',
      },
    });

    // Notify the customer
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Declined',
        message: `Unfortunately, your booking request for ${new Date(booking.scheduledDate).toLocaleDateString()} was declined.`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error declining booking:', error);
    res.status(500).json({ success: false, message: 'Failed to decline booking' });
  }
});

// POST /bookings/:id/start - Cleaner starts the job
router.post('/:id/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the cleaner can start
    if (booking.cleanerId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the cleaner can start this job' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: `Cannot start booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    // Notify the customer
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_STARTED',
        title: 'Cleaning Started',
        message: `Your cleaner has started the cleaning job!`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error starting booking:', error);
    res.status(500).json({ success: false, message: 'Failed to start booking' });
  }
});

// POST /bookings/:id/complete - Cleaner completes the job
router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { cleaner: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the cleaner can complete
    if (booking.cleanerId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the cleaner can complete this job' });
    }

    if (booking.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: `Cannot complete booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'AWAITING_CONFIRMATION',
      },
    });

    // Notify the customer to confirm completion
    const notification = await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_AWAITING_CONFIRMATION',
        title: 'Please Confirm Cleaning Completion',
        message: `Your cleaner has marked the job as complete. Please confirm the cleaning has been completed to your satisfaction.`,
      },
    });

    // Send real-time notification to customer
    const io = req.app.get('io');
    io.to(`user:${booking.userId}`).emit('booking-status-changed', {
      bookingId: id,
      status: 'AWAITING_CONFIRMATION',
      notification,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ success: false, message: 'Failed to complete booking' });
  }
});

// POST /bookings/:id/confirm-completion - Customer confirms the job is complete
router.post('/:id/confirm-completion', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the customer can confirm completion
    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can confirm completion' });
    }

    if (booking.status !== 'AWAITING_CONFIRMATION') {
      return res.status(400).json({ success: false, message: `Cannot confirm completion for booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update cleaner's total bookings
    await prisma.cleanerProfile.update({
      where: { userId: booking.cleanerId },
      data: {
        totalBookings: { increment: 1 },
      },
    });

    // Notify the cleaner
    const notification = await prisma.notification.create({
      data: {
        userId: booking.cleanerId,
        type: 'BOOKING_COMPLETED',
        title: 'Job Confirmed Complete',
        message: `The customer has confirmed the cleaning job is complete. Great work!`,
      },
    });

    const io = req.app.get('io');
    io.to(`user:${booking.cleanerId}`).emit('booking-status-changed', {
      bookingId: id,
      status: 'COMPLETED',
      notification,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error confirming completion:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm completion' });
  }
});

// POST /bookings/:id/dispute - Customer disputes the completion
router.post('/:id/dispute', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the customer can dispute
    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can dispute completion' });
    }

    if (booking.status !== 'AWAITING_CONFIRMATION') {
      return res.status(400).json({ success: false, message: `Cannot dispute booking with status: ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    // Notify the cleaner
    const notification = await prisma.notification.create({
      data: {
        userId: booking.cleanerId,
        type: 'BOOKING_DISPUTED',
        title: 'Completion Disputed',
        message: `The customer has disputed the completion of the job.${reason ? ` Reason: ${reason}` : ''} Please review and address their concerns.`,
      },
    });

    const io = req.app.get('io');
    io.to(`user:${booking.cleanerId}`).emit('booking-status-changed', {
      bookingId: id,
      status: 'IN_PROGRESS',
      notification,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error disputing booking:', error);
    res.status(500).json({ success: false, message: 'Failed to dispute booking' });
  }
});

// POST /bookings/:id/cancel - Cancel booking (by customer or cleaner)
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, cleaner: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only participants can cancel
    if (booking.userId !== userId && booking.cleanerId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Can only cancel pending or confirmed bookings
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel booking with status: ${booking.status}` });
    }

    const cancelledBy = userId === booking.userId ? 'customer' : 'cleaner';

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || `Cancelled by ${cancelledBy}`,
      },
    });

    // Notify the other party
    const notifyUserId = userId === booking.userId ? booking.cleanerId : booking.userId;
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `The booking for ${new Date(booking.scheduledDate).toLocaleDateString()} has been cancelled.`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

// PATCH /bookings/:id - Update booking details (reschedule)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { scheduledDate, scheduledTime, duration, instructions } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the customer can reschedule
    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the customer can reschedule' });
    }

    // Can only reschedule pending or confirmed bookings
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot reschedule booking with status: ${booking.status}` });
    }

    // Convert time string to DateTime if provided
    let timeDate: Date | undefined;
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      timeDate = new Date(1970, 0, 1, hours, minutes, 0);
    }

    // Recalculate if duration changed
    let updateData: any = {
      ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
      ...(timeDate && { scheduledTime: timeDate }),
      ...(instructions !== undefined && { instructions }),
    };

    if (duration && duration !== booking.duration) {
      const totalHours = duration;
      const subtotal = booking.hourlyRate * totalHours;
      const serviceFee = subtotal * 0.15;
      const tax = subtotal * 0.08;
      const totalAmount = subtotal + serviceFee + tax;

      updateData = {
        ...updateData,
        duration,
        totalHours,
        subtotal,
        serviceFee,
        tax,
        totalAmount,
      };
    }

    // If confirmed, set back to pending for cleaner re-approval
    if (booking.status === 'CONFIRMED' && (scheduledDate || scheduledTime)) {
      updateData.status = 'PENDING';
      updateData.confirmedAt = null;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    // Notify cleaner of changes
    if (scheduledDate || scheduledTime) {
      await prisma.notification.create({
        data: {
          userId: booking.cleanerId,
          type: 'BOOKING_UPDATED',
          title: 'Booking Rescheduled',
          message: `A booking has been rescheduled. Please review and confirm.`,
        },
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

export default router;
