import express from 'express';
import blogController from '../controllers/blogController.js';
import { verifyToken, verifyTeacher } from '../middleware/auth.js';

const router = express.Router();

// Create a new blog
router.get('/', verifyToken, verifyTeacher, blogController.getBlogByTeacherId);

router.post('/courses/:course_id', verifyToken, blogController.createBlog);

// Get all blogs for a course
router.get('/course/:courseId', blogController.getBlogsByCourseId);

// Get blog by ID
router.get('/:id', blogController.getBlogById);

// Update blog
router.put('/:id', verifyToken, blogController.updateBlog);

// Delete blog
router.delete('/:id', verifyToken, blogController.deleteBlog);

// Get blogs by teacher ID
router.get('/teacher/:teacherId', blogController.getBlogsByTeacherId);

export default router; 