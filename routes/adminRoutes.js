import express from 'express';
import { getAllTeachers, toggleTeacherStatus, getTeacherDetails, getFullDetails } from '../services/adminService.js';
import { verifySameUser, verifyToken } from '../middleware/auth.js';
import * as winningQuestionController from '../controllers/winningQuestionController.js';
import * as userService from '../services/userService.js';
import * as promoController from '../controllers/promoController.js';
import * as privacyPolicyController from '../controllers/privacyPolicyController.js';
import * as termsConditionsController from '../controllers/termsConditionsController.js';

const router = express.Router();

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

router.post('/privacy-policy', verifyToken, isAdmin, privacyPolicyController.createPrivacyPolicy);
router.get('/privacy-policy', privacyPolicyController.getAllPrivacyPolicies);

// Terms and Conditions routes
router.post('/terms-conditions', verifyToken, isAdmin, termsConditionsController.createTermsConditions);
router.get('/terms-conditions', termsConditionsController.getAllTermsConditions);


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

router.post('/winningquestion', verifyToken, winningQuestionController.createWinningQuestion);
router.get('/winningquestion/teacher', verifyToken, winningQuestionController.getWinningQuestionsByTeacher);

router.get('/students', verifyToken, isAdmin, async (req, res) => {
    try {
        const students = await userService.getUsersByRole('student');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/student/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const student = await userService.getUserByIdAndRole(id, 'student');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/student/status/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userService.toggleUserStatus(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/student/:id', verifyToken, verifySameUser, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userService.deleteUser(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/promo', verifyToken, isAdmin, promoController.createPromo);
router.get('/promo', verifyToken, promoController.getAllPromos);
router.get('/promo/:id', verifyToken, isAdmin, promoController.getPromoById);
router.put('/promo/:id', verifyToken, isAdmin, promoController.updatePromo);
router.delete('/promo/:id', verifyToken, isAdmin, promoController.deletePromo);

// Privacy Policy routes

export default router; 