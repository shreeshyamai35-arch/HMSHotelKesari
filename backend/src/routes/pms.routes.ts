import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { syncPms } from '../services/pms.service';
import { parseDate, addDays } from '../lib/dates';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.REVENUE));

const syncSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

router.post(
  '/sync',
  asyncHandler(async (req, res) => {
    const { from, to } = syncSchema.parse(req.body ?? {});
    const toDate = to ? parseDate(to) : new Date();
    const fromDate = from ? parseDate(from) : addDays(toDate, -30);
    const result = await syncPms(fromDate, toDate);
    res.json({ success: true, ...result });
  })
);

export default router;
