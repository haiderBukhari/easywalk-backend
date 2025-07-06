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

// Exam questions management
router.get('/:id/questions', verifyToken, examController.getExamQuestions);
router.post('/:id/questions', verifyToken, verifyTeacher, examController.addQuestionsToExam);
router.delete('/:id/questions', verifyToken, verifyTeacher, examController.removeQuestionsFromExam);

// Exam submission and results
router.post('/:id/submit', verifyToken, examController.submitExam);
router.get('/:id/result', verifyToken, examController.getExamResult);
router.get('/submissions/exam', verifyToken, examController.getUserSubmissions);

export default router; 