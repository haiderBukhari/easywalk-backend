import * as adminService from '../services/adminService.js';

export const createWinningQuestion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { question, answer } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Question is required'
            });
        }

        const winningQuestion = await adminService.createWinningQuestion(userId, {
            question,
            answer
        });

        res.status(201).json({
            success: true,
            message: 'Winning question created successfully',
            data: winningQuestion
        });
    } catch (error) {
        console.error('Error creating winning question:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating winning question',
            error: error.message
        });
    }
}; 