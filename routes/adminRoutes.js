import express from 'express';
import { getAllTeachers, toggleTeacherStatus, getTeacherDetails, getFullDetails } from '../services/adminService.js';
import { verifyToken } from '../middleware/auth.js';
import * as winningQuestionController from '../controllers/winningQuestionController.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all teachers
router.get('/teachers', verifyToken, isAdmin, async (req, res) => {
    try {
        const teachers = await getAllTeachers();
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/teacher/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const teacherDetails = await getTeacherDetails(id);
        res.json(teacherDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/full-details', verifyToken, isAdmin, async (req, res) => {
    try {
        const fullDetails = await getFullDetails();
        res.json(fullDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle teacher status
router.put('/teacher/status/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await toggleTeacherStatus(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Winning Questions routes
router.post('/winningquestion', verifyToken, winningQuestionController.createWinningQuestion);
router.get('/winningquestion/teacher', verifyToken, winningQuestionController.getWinningQuestionsByTeacher);

export default router; 