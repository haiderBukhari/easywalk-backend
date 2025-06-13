import progressService from '../services/progressService.js';

class ProgressController {
    // Create a new progress entry
    async createProgress(req, res) {
        try {
            const userId = req.user.id;
            const { progress_name, lessonId, examId, blogId } = req.body;

            if (!progress_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Progress name is required'
                });
            }

            // Validate that at least one of the optional IDs is provided
            if (!lessonId && !examId && !blogId) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one of lessonId, examId, or blogId must be provided'
                });
            }

            const progress = await progressService.createProgress(userId, {
                progress_name,
                lessonId,
                examId,
                blogId
            });
            
            res.status(201).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Error creating progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating progress',
                error: error.message
            });
        }
    }

    // Get all progress entries for a user
    async getUserProgress(req, res) {
        try {
            const userId = req.user.id;
            const progress = await progressService.getUserProgress(userId);
            
            res.status(200).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Error getting user progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting user progress',
                error: error.message
            });
        }
    }

    // Delete a progress entry
    async deleteProgress(req, res) {
        try {
            const userId = req.user.id;
            const { progressId } = req.params;

            if (!progressId) {
                return res.status(400).json({
                    success: false,
                    message: 'Progress ID is required'
                });
            }

            const progress = await progressService.deleteProgress(progressId, userId);
            
            res.status(200).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Error deleting progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting progress',
                error: error.message
            });
        }
    }

    // Get detailed progress information
    async getDetailedProgress(req, res) {
        try {
            const userId = req.user.id;
            const { timeFrame } = req.query;

            if (!timeFrame || !['week', 'month'].includes(timeFrame)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid timeFrame. Use "week" or "month"'
                });
            }

            const progress = await progressService.getDetailedProgress(userId, timeFrame);
            
            res.status(200).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Error getting detailed progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting detailed progress',
                error: error.message
            });
        }
    }
}

export default new ProgressController(); 