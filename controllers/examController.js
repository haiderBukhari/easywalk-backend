import examService from '../services/examService.js';
import courseService from '../services/courseService.js';

class ExamController {
    // Create a new exam
    async createExam(req, res) {
        try {
            const { courseId } = req.params;
            const { title, description, questions } = req.body;
            const teacherId = req.user.id;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }

            if (!Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Questions array is required and must not be empty'
                });
            }

            for (const question of questions) {
                if (!question.text || !Array.isArray(question.options) || question.options.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each question must have text and at least one option'
                    });
                }

                const correctOptions = question.options.filter(opt => opt.correct);
                if (correctOptions.length !== 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each question must have exactly one correct option'
                    });
                }
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
                description,
                questions
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
            const { title, description, questions, status } = req.body;

            // Validate required fields
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }

            if (!Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Questions array is required and must not be empty'
                });
            }

            // Validate each question
            for (const question of questions) {
                if (!question.text || !Array.isArray(question.options) || question.options.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each question must have text and at least one option'
                    });
                }

                // Validate that exactly one option is correct
                const correctOptions = question.options.filter(opt => opt.correct);
                if (correctOptions.length !== 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each question must have exactly one correct option'
                    });
                }
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
            if (!(course.teacher_id === req.user.id || req.user.role === 'admin')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this exam'
                });
            }

            const updatedExam = await examService.updateExam(id, {
                title,
                description,
                questions,
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
            if (!(course.teacher_id === req.user.id || req.user.role === 'admin')) {
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
}

export default new ExamController(); 