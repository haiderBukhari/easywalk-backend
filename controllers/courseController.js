import courseService from '../services/courseService.js';
import * as adminService from '../services/adminService.js';

class CourseController {
    // Create a new course
    async createCourse(req, res) {
        try {
            const { title, description, categories, cover_image, ...otherFields } = req.body;
            const teacher_id = req.user.id;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required'
                });
            }

            const course = await courseService.createCourse({
                title,
                description,
                category: categories,
                cover_image,
                teacher_id,
                ...otherFields
            });

            res.status(201).json({
                success: true,
                data: course
            });
        } catch (error) {
            console.error('Error creating course:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating course',
                error: error.message
            });
        }
    }

    // Get all courses
    async getAllCourses(req, res) {
        try {
            const courses = await courseService.getAllCourses();
            res.status(200).json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error fetching courses:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching courses',
                error: error.message
            });
        }
    }

    async getCourseById(req, res) {
        try {
            const { id } = req.params;
            const course = await courseService.getCourseById(id);

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            res.status(200).json({
                success: true,
                data: course
            });
        } catch (error) {
            console.error('Error fetching course:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching course',
                error: error.message
            });
        }
    }

    // Update course
    async updateCourse(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const course = await courseService.getCourseById(id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this course'
                });
            }

            const updatedCourse = await courseService.updateCourse(id, updateData);

            res.status(200).json({
                success: true,
                data: updatedCourse
            });
        } catch (error) {
            console.error('Error updating course:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating course',
                error: error.message
            });
        }
    }

    // Delete course
    async deleteCourse(req, res) {
        try {
            const { id } = req.params;

            // Check if the course belongs to the authenticated teacher
            const course = await courseService.getCourseById(id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to delete this course'
                });
            }

            await courseService.deleteCourse(id);

            res.status(200).json({
                success: true,
                message: 'Course deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting course:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting course',
                error: error.message
            });
        }
    }

    // Get courses by teacher ID
    async getCoursesByTeacherId(req, res) {
        try {
            const actualTeacherId = req.user.id;
            const courses = await courseService.getCoursesByTeacherId(actualTeacherId);

            res.status(200).json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error fetching teacher courses:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching teacher courses',
                error: error.message
            });
        }
    }

    // Get all course titles
    async getCourseTitles(req, res) {
        try {
            const courses = await courseService.getCourseTitles();
            res.status(200).json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error fetching course titles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching course titles',
                error: error.message
            });
        }
    }

    async getCourseCategoriesById(req, res) {
        try {
            const courseId = req.params.id;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required'
                });
            }

            const courseCategories = await adminService.getCourseCategoriesById(courseId);

            res.status(200).json({
                success: true,
                message: 'Course categories fetched successfully',
                data: courseCategories
            });
        } catch (error) {
            console.error('Error fetching course categories:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching course categories',
                error: error.message
            });
        }
    };

    async getCourseSummaries(req, res) {
        try {
            const courses = await courseService.getCourseSummaries();
            res.status(200).json({
                success: true,
                data: courses
            });
        } catch (error) {
            console.error('Error fetching course summaries:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching course summaries',
                error: error.message
            });
        }
    }
}

export default new CourseController(); 