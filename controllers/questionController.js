import questionService from '../services/questionService.js';
import courseService from '../services/courseService.js';

class QuestionController {
    // Create a new question
    async createQuestion(req, res) {
        try {
            const { courseId } = req.params;
            const teacherId = req.user.id;
            const { category, questions } = req.body;

            // Verify course ownership
            const course = await courseService.getCourseById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to add questions to this course'
                });
            }

            if (!category || !questions) {
                return res.status(400).json({
                    success: false,
                    message: 'Category and questions are required'
                });
            }

            const question = await questionService.createQuestion({
                course_id: courseId,
                category,
                questions,
                user_id: teacherId
            });

            res.status(201).json({
                success: true,
                message: 'Question created successfully',
                data: question
            });
        } catch (error) {
            console.error('Error creating question:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating question',
                error: error.message
            });
        }
    }

    // Get questions by course ID
    async getQuestionsByCourseId(req, res) {
        try {
            const { courseId } = req.params;
            const { category } = req.query;

            const questions = await questionService.getQuestionsByCourseId(courseId, category);

            res.status(200).json({
                success: true,
                message: 'Questions fetched successfully',
                data: questions
            });
        } catch (error) {
            console.error('Error fetching questions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching questions',
                error: error.message
            });
        }
    }

    // Get question by ID
    async getQuestionById(req, res) {
        try {
            const { id } = req.params;
            const question = await questionService.getQuestionById(id);

            if (!question) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Question fetched successfully',
                data: question
            });
        } catch (error) {
            console.error('Error fetching question:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching question',
                error: error.message
            });
        }
    }

    // Update question
    async updateQuestion(req, res) {
        try {
            const { id } = req.params;
            const { category, questions } = req.body;

            // Verify question exists and user has permission
            const existingQuestion = await questionService.getQuestionById(id);
            if (!existingQuestion) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this question'
                });
            }

            const updatedQuestion = await questionService.updateQuestion(id, {
                category,
                questions
            });

            res.status(200).json({
                success: true,
                message: 'Question updated successfully',
                data: updatedQuestion
            });
        } catch (error) {
            console.error('Error updating question:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating question',
                error: error.message
            });
        }
    }

    // Delete question
    async deleteQuestion(req, res) {
        try {
            const { id } = req.params;

            // Verify question exists and user has permission
            const existingQuestion = await questionService.getQuestionById(id);
            if (!existingQuestion) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to delete this question'
                });
            }

            await questionService.deleteQuestion(id);

            res.status(200).json({
                success: true,
                message: 'Question deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting question:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting question',
                error: error.message
            });
        }
    }

    // Get questions by teacher ID
    async getQuestionsByTeacherId(req, res) {
        try {
            const teacherId = req.user.id;
            const questions = await questionService.getQuestionsByTeacherId(teacherId);

            res.status(200).json({
                success: true,
                message: 'Teacher questions fetched successfully',
                data: questions
            });
        } catch (error) {
            console.error('Error fetching teacher questions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching teacher questions',
                error: error.message
            });
        }
    }

    // Get questions by category
    async getQuestionsByCategory(req, res) {
        try {
            const { category } = req.query;
            const questions = await questionService.getQuestionsByCategory(category);

            res.status(200).json({
                success: true,
                message: 'Questions fetched successfully',
                data: questions
            });
        } catch (error) {
            console.error('Error fetching questions by category:', error);
        }
    }
}

export default new QuestionController(); 