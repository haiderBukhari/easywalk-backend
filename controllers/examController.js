import examService from '../services/examService.js';
import courseService from '../services/courseService.js';

class ExamController {
    // Create a new exam
    async createExam(req, res) {
        try {
            const { courseId } = req.params;
            const { title, description, questionIds, category, status, complexity, estimated_time_to_complete } = req.body;
            const teacherId = req.user.id;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }

            // Validate complexity if provided
            if (complexity && !['easy', 'medium', 'hard'].includes(complexity)) {
                return res.status(400).json({
                    success: false,
                    message: 'Complexity must be one of: easy, medium, hard'
                });
            }

            // Validate estimated_time_to_complete if provided
            if (estimated_time_to_complete && (typeof estimated_time_to_complete !== 'number' || estimated_time_to_complete <= 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estimated time to complete must be a positive number (in minutes)'
                });
            }

            const course = await courseService.getCourseById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            const exam = await examService.createExam({
                course_id: courseId,
                title,
                teacherId,
                category,
                status,
                description,
                questionIds,
                complexity,
                estimated_time_to_complete
            });

            res.status(201).json({
                success: true,
                data: exam
            });
        } catch (error) {
            console.error('Error creating exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating exam',
                error: error.message
            });
        }
    }

    // Get all exams for a course
    async getExamsByCourseId(req, res) {
        try {
            const { courseId } = req.params;
            const exams = await examService.getExamsByCourseId(courseId);

            res.status(200).json({
                success: true,
                data: exams
            });
        } catch (error) {
            console.error('Error fetching exams:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching exams',
                error: error.message
            });
        }
    }

    // Get exam by ID
    async getExamById(req, res) {
        try {
            const { id } = req.params;
            const exam = await examService.getExamById(id);

            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam not found'
                });
            }

            res.status(200).json({
                success: true,
                data: exam
            });
        } catch (error) {
            console.error('Error fetching exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching exam',
                error: error.message
            });
        }
    }

    // Update exam
    async updateExam(req, res) {
        try {
            const { id } = req.params;
            const { title, description, questionIds, status } = req.body;

            // Validate required fields
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }

            // Get the exam to check course ownership
            const exam = await examService.getExamById(id);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam not found'
                });
            }

            // Verify course ownership
            const course = await courseService.getCourseById(exam.course_id);
            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this exam'
                });
            }

            const updatedExam = await examService.updateExam(id, {
                title,
                description,
                questionIds,
                status
            });

            res.status(200).json({
                success: true,
                data: updatedExam
            });
        } catch (error) {
            console.error('Error updating exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating exam',
                error: error.message
            });
        }
    }

    // Delete exam
    async deleteExam(req, res) {
        try {
            const { id } = req.params;

            // Get the exam to check course ownership
            const exam = await examService.getExamById(id);
            if (!exam) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam not found'
                });
            }

            // Verify course ownership
            const course = await courseService.getCourseById(exam.course_id);
            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to delete this exam'
                });
            }

            await examService.deleteExam(id);

            res.status(200).json({
                success: true,
                message: 'Exam deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting exam',
                error: error.message
            });
        }
    }

    async getExamsByTeacherId(req, res) {
        try {
            const teacherId = req.user.id;
            const exams = await examService.getExamsByTeacherId(teacherId);

            res.status(200).json({
                success: true,
                data: exams
            });
        } catch (error) {
            console.error('Error fetching teacher exams:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching teacher exams',
                error: error.message
            });
        }
    }

    // Add questions to exam
    async addQuestionsToExam(req, res) {
        try {
            const { id } = req.params;
            const { questionIds } = req.body;

            if (!Array.isArray(questionIds) || questionIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Question IDs array is required and must not be empty'
                });
            }

            const result = await examService.addQuestionsToExam(id, questionIds);

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error adding questions to exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding questions to exam',
                error: error.message
            });
        }
    }

    // Remove questions from exam
    async removeQuestionsFromExam(req, res) {
        try {
            const { id } = req.params;
            const { questionIds } = req.body;

            if (!Array.isArray(questionIds) || questionIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Question IDs array is required and must not be empty'
                });
            }

            const result = await examService.removeQuestionsFromExam(id, questionIds);

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error removing questions from exam:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing questions from exam',
                error: error.message
            });
        }
    }

    // Get exam questions
    async getExamQuestions(req, res) {
        try {
            const { id } = req.params;
            const questions = await examService.getExamQuestions(id);

            res.status(200).json({
                success: true,
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

    // Submit exam
    async submitExam(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { questions } = req.body;
            if (!Array.isArray(questions)) {
                return res.status(400).json({ success: false, message: 'Questions array is required' });
            }
            const result = await examService.submitExam(id, userId, questions);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Error submitting exam:', error);
            res.status(500).json({ success: false, message: 'Error submitting exam', error: error.message });
        }
    }

    // Get exam result for user
    async getExamResult(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const result = await examService.getExamResult(id, userId);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Result not found' });
            }
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Error fetching exam result:', error);
            res.status(500).json({ success: false, message: 'Error fetching exam result', error: error.message });
        }
    }

    async getUserSubmissions(req, res) {
        try {
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const submissions = await examService.getUserSubmissions(userId);
            
            res.json({
                success: true,
                data: submissions
            });
        } catch (error) {
            console.error('Error getting user submissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting user submissions',
                error: error.message
            });
        }
    }
}

export default new ExamController(); 