import express from 'express';
import examController from '../controllers/examController.js';
import { verifyToken, verifyTeacher } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, verifyTeacher, examController.getExamsByTeacherId);
router.post('/courses/:courseId', verifyToken, verifyTeacher, examController.createExam);
router.get('/courses/:courseId', verifyToken, examController.getExamsByCourseId);
router.get('/:id', verifyToken, examController.getExamById);
router.put('/:id', verifyToken, verifyTeacher, examController.updateExam);
router.delete('/:id', verifyToken, verifyTeacher, examController.deleteExam);

export default router; 