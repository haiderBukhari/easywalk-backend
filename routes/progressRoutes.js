import express from 'express';
import progressController from '../controllers/progressController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, progressController.createProgress);

router.get('/', verifyToken, progressController.getDetailedProgress);

router.delete('/:progressId', verifyToken, progressController.deleteProgress);

export default router; 