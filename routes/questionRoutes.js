import express from 'express';
import questionController from '../controllers/questionController.js';
import { verifyToken, verifyTeacher } from '../middleware/auth.js';

const router = express.Router();

// Question routes
router.post('/courses/:courseId/questions', verifyToken, verifyTeacher, questionController.createQuestion);
router.post('/courses/:courseId/questions/bulk', verifyToken, verifyTeacher, questionController.createMultipleQuestions);
router.get('/courses/:courseId/questions', verifyToken, questionController.getQuestionsByCourseId);
router.get('/teacher', verifyToken, verifyTeacher, questionController.getQuestionsByTeacherId);
router.get('/teacher/count', verifyToken, verifyTeacher, questionController.getQuestionCountByTeacherId);
router.get('/category', verifyToken, questionController.getQuestionsByCategory);
router.get('/exam/:examId', verifyToken, questionController.getQuestionsByExamId);
router.get('/:id', verifyToken, questionController.getQuestionById);
router.put('/:id', verifyToken, verifyTeacher, questionController.updateQuestion);
router.delete('/:id', verifyToken, verifyTeacher, questionController.deleteQuestion);
router.delete('/courses/:courseId/category', verifyToken, verifyTeacher, questionController.deleteQuestionsByCategory);
router.post('/:id/rate', verifyToken, questionController.rateQuestion);

export default router; 