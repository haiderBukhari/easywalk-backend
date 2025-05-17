import express from 'express';
import courseController from '../controllers/courseController.js';
import lessonController from '../controllers/lessonController.js';
import { verifyToken, verifyTeacher } from '../middleware/auth.js';

const router = express.Router();

// Course routes
router.post('/', verifyToken, verifyTeacher, courseController.createCourse);
router.get('/teacher', verifyToken, verifyTeacher, courseController.getCoursesByTeacherId);
router.get('/titles', verifyToken, courseController.getCourseTitles);
router.get('/', verifyToken, courseController.getAllCourses);
router.get('/:id', verifyToken, courseController.getCourseById);
router.get('/:id/categories', verifyToken, courseController.getCourseCategoriesById);
router.put('/:id', verifyToken, verifyTeacher, courseController.updateCourse);
router.delete('/:id', verifyToken, verifyTeacher, courseController.deleteCourse);

// Lesson routes
router.get('/lessons/teacher', verifyToken, verifyTeacher, lessonController.getLessonsByTeacherId);
router.delete('/lessons/:id', verifyToken, verifyTeacher, lessonController.deleteIndividualLesson);

router.post('/:courseId/lessons', verifyToken, verifyTeacher, lessonController.createLesson);
router.get('/:courseId/lessons', verifyToken, lessonController.getLessonsByCourseId);
router.get('/:courseId/lessons/:id', verifyToken, lessonController.getLessonById);
router.put('/:courseId/lessons/:id', verifyToken, verifyTeacher, lessonController.updateLesson);
router.delete('/:courseId/lessons/:id', verifyToken, verifyTeacher, lessonController.deleteLesson);
router.post('/:courseId/lessons/reorder', verifyToken, verifyTeacher, lessonController.reorderLessons);

export default router; 