import questionService from '../services/questionService.js';
import courseService from '../services/courseService.js';

class QuestionController {
    // Create a new question
    async createQuestion(req, res) {
        try {
            const { courseId } = req.params;
            const teacherId = req.user.id;
            const { category, question, options, correct, hint, video, exam_id } = req.body;

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

            if (!category || !question || !options || !correct) {
                return res.status(400).json({
                    success: false,
                    message: 'Category, question, options, and correct answer are required'
                });
            }

            const questionData = await questionService.createQuestion({
                course_id: courseId,
                category,
                question,
                options,
                correct,
                hint,
                video,
                user_id: teacherId,
                exam_id
            });

            res.status(201).json({
                success: true,
                message: 'Question created successfully',
                data: questionData
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

    // Create multiple questions
    async createMultipleQuestions(req, res) {
        try {
            const { courseId } = req.params;
            const teacherId = req.user.id;
            const { category, questions, exam_id } = req.body;

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

            if (!category || !questions || !Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Category and questions array are required'
                });
            }

            // Validate each question
            for (const q of questions) {
                if (!q.text || !q.options || !q.correct) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each question must have text, options, and correct answer'
                    });
                }
            }

            const questionsData = await questionService.createMultipleQuestions({
                course_id: courseId,
                category,
                questions,
                user_id: teacherId,
                exam_id
            });

            res.status(201).json({
                success: true,
                message: 'Questions created successfully',
                data: questionsData
            });
        } catch (error) {
            console.error('Error creating questions:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating questions',
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
            const { category, question, options, correct, hint, video } = req.body;

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
                question,
                options,
                correct,
                hint,
                video
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

    // Delete questions by category
    async deleteQuestionsByCategory(req, res) {
        try {
            const { courseId } = req.params;
            const { category } = req.body;
            const teacherId = req.user.id;

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
                    message: 'You are not authorized to delete questions from this course'
                });
            }

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Category is required'
                });
            }

            const deletedQuestions = await questionService.deleteQuestionsByCategory(courseId, category, teacherId);

            res.status(200).json({
                success: true,
                message: 'Questions deleted successfully',
                data: deletedQuestions
            });
        } catch (error) {
            console.error('Error deleting questions by category:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting questions by category',
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
            res.status(500).json({
                success: false,
                message: 'Error fetching questions by category',
                error: error.message
            });
        }
    }

    // Get questions by exam ID
    async getQuestionsByExamId(req, res) {
        try {
            const { examId } = req.params;
            const questions = await questionService.getQuestionsByExamId(examId);

            res.status(200).json({
                success: true,
                message: 'Exam questions fetched successfully',
                data: questions
            });
        } catch (error) {
            console.error('Error fetching exam questions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching exam questions',
                error: error.message
            });
        }
    }

    // Rate a question
    async rateQuestion(req, res) {
        try {
            const { id } = req.params;
            const { rating } = req.body;

            if (rating === undefined || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            const question = await questionService.rateQuestion(id, rating);

            res.status(200).json({
                success: true,
                message: 'Question rated successfully',
                data: question
            });
        } catch (error) {
            console.error('Error rating question:', error);
            res.status(500).json({
                success: false,
                message: 'Error rating question',
                error: error.message
            });
        }
    }
}

export default new QuestionController(); 