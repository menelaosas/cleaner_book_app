import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /messages - Get all conversations (bookings with messages)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find all bookings where user is either customer or cleaner
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { userId },
          { cleanerId: userId },
        ],
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
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter to only bookings that have messages or are active
    const conversations = bookings
      .filter(b => b.messages.length > 0 || ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status))
      .map(booking => {
        const otherUser = booking.userId === userId ? booking.cleaner : booking.user;
        const lastMessage = booking.messages[0] || null;

        return {
          bookingId: booking.id,
          otherUser,
          lastMessage,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
        };
      });

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// GET /messages/booking/:bookingId - Get messages for a booking
router.get('/booking/:bookingId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user!.id;

    // Verify user is part of this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== userId && booking.cleanerId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        bookingId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// POST /messages - Send a message
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const { bookingId, content } = req.body;

    if (!bookingId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and content are required',
      });
    }

    // Verify user is part of this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, firstName: true } },
        cleaner: { select: { id: true, firstName: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== senderId && booking.cleanerId !== senderId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for the other party
    const recipientId = senderId === booking.userId ? booking.cleanerId : booking.userId;
    const senderName = senderId === booking.userId ? booking.user.firstName : booking.cleaner.firstName;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${senderName} sent you a message`,
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// PATCH /messages/:id/read - Mark message as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only the recipient can mark as read
    const isRecipient =
      (message.booking.userId === userId && message.senderId !== userId) ||
      (message.booking.cleanerId === userId && message.senderId !== userId);

    if (!isRecipient) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { readAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
  }
});

// GET /messages/unread-count - Get count of unread messages
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find bookings where user is participant
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { userId },
          { cleanerId: userId },
        ],
      },
      select: { id: true },
    });

    const bookingIds = bookings.map(b => b.id);

    const count = await prisma.message.count({
      where: {
        bookingId: { in: bookingIds },
        senderId: { not: userId },
        readAt: null,
      },
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

export default router;
