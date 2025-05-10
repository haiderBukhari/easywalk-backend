import lessonService from '../services/lessonService.js';
import courseService from '../services/courseService.js';

class LessonController {
    async createLesson(req, res) {
        try {
            const { courseId } = req.params;
            const { title, description, video_link, arrangement_no, category, ...otherFields } = req.body;

            // Verify course ownership
            const course = await courseService.getCourseById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (course.teacher_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to add lessons to this course'
                });
            }

            // Only validate essential fields
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }

            const lesson = await lessonService.createLesson({
                course_id: courseId,
                title,
                description,
                video_link,
                arrangement_no,
                category,
                ...otherFields
            });

            res.status(201).json({
                success: true,
                data: lesson
            });
        } catch (error) {
            console.error('Error creating lesson:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating lesson',
                error: error.message
            });
        }
    }

    // Get lessons by course ID
    async getLessonsByCourseId(req, res) {
        try {
            const { courseId } = req.params;
            const lessons = await lessonService.getLessonsByCourseId(courseId);

            res.status(200).json({
                success: true,
                data: lessons
            });
        } catch (error) {
            console.error('Error fetching lessons:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching lessons',
                error: error.message
            });
        }
    }

    // Get lesson by ID
    async getLessonById(req, res) {
        try {
            const { id } = req.params;
            const lesson = await lessonService.getLessonById(id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            res.status(200).json({
                success: true,
                data: lesson
            });
        } catch (error) {
            console.error('Error fetching lesson:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching lesson',
                error: error.message
            });
        }
    }

    // Update lesson
    async updateLesson(req, res) {
        try {
            const { courseId, id } = req.params;
            const updateData = req.body;

            // Verify course ownership
            const course = await courseService.getCourseById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (course.teacher_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update lessons in this course'
                });
            }

            const lesson = await lessonService.updateLesson(id, updateData);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            res.status(200).json({
                success: true,
                data: lesson
            });
        } catch (error) {
            console.error('Error updating lesson:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating lesson',
                error: error.message
            });
        }
    }

    async deleteLesson(req, res) {
        try {
            const { courseId, id } = req.params;

            // Verify course ownership
            const course = await courseService.getCourseById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (course.teacher_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to delete lessons from this course'
                });
            }

            const lesson = await lessonService.deleteLesson(id);

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Lesson deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting lesson:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting lesson',
                error: error.message
            });
        }
    }

    // Reorder lessons
    async reorderLessons(req, res) {
        try {
            const { courseId } = req.params;
            const { lessonIds } = req.body;

            // Verify course ownership
            const course = await courseService.getCourseById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (course.teacher_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to reorder lessons in this course'
                });
            }

            if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lesson IDs array'
                });
            }

            await lessonService.reorderLessons(courseId, lessonIds);

            res.status(200).json({
                success: true,
                message: 'Lessons reordered successfully'
            });
        } catch (error) {
            console.error('Error reordering lessons:', error);
            res.status(500).json({
                success: false,
                message: 'Error reordering lessons',
                error: error.message
            });
        }
    }
}

export default new LessonController(); 