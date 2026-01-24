import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder routes - implement later
router.get('/:id', authenticate, (req, res) => {
  res.json({ success: true, message: 'User route - coming soon' });
});

export default router;
