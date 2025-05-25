import express from 'express';
import studentController from '../controllers/studentController.js';
import { verifyToken } from '../middleware/auth.js';
import { getPublishedLessons, getLessonsWithDetails } from '../controllers/studentController.js';

const router = express.Router();

// Enroll in course
router.post('/enroll', verifyToken, studentController.enrollInCourse);

router.put('/setReminder', verifyToken, studentController.setReminder);

router.get('/recent-enrolled-course', verifyToken, studentController.getRecentEnrolledCourse);

// Get top-rated blogs
router.get('/top-rated-blogs', verifyToken, studentController.getTopRatedBlogs);

router.get('/all-blogs', verifyToken, studentController.getAllBlogs);

router.get('/winning-questions', verifyToken, studentController.getAllWinningQuestions);

router.get('/progress', verifyToken, studentController.getStudentProgress);

// Get questions for a course by courseId
router.get('/course-questions', verifyToken, studentController.getCourseQuestionsByCourseId);

router.get('/get-all-questions', verifyToken, studentController.getQuestionsWithTeacherDetails);

router.get('/get-exams', verifyToken, studentController.getPublishedExamsByCourseId);

router.get('/get-all-exams', verifyToken, studentController.getExamsWithTeacherDetails);

router.get('/get-top-lessons', verifyToken, getPublishedLessons);

router.get('/get-all-lessons', verifyToken, getLessonsWithDetails);

router.get('/teacher-profile', verifyToken, studentController.getTeacherProfile);

// Route to rate an exam
router.post('/rate-exam', verifyToken, studentController.rateExam);

// Route to rate a lesson
router.post('/rate-lesson', verifyToken, studentController.rateLesson);

// Route to rate a blog
router.post('/rate-blog', verifyToken, studentController.rateBlog);

router.post('/support', verifyToken, studentController.createSupportRequest);

router.get('/support', verifyToken, studentController.getSupportRequests);

export default router; 