import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder routes - implement later
router.post('/create-intent', authenticate, (req, res) => {
  res.json({ success: true, message: 'Payment routes - coming soon' });
});

export default router;
