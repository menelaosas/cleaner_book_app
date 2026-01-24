import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder routes - implement later
router.get('/', authenticate, (req, res) => {
  res.json({ success: true, message: 'Message routes - coming soon' });
});

export default router;
