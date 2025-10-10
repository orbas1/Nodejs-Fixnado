import { Router } from 'express';
import { search, searchTalent } from '../controllers/searchController.js';

const router = Router();

router.get('/', search);
router.get('/talent', searchTalent);

export default router;
