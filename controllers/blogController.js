import blogService from '../services/blogService.js';

class BlogController {
    // Create a new blog
    async createBlog(req, res) {
        try {
            const { course_id } = req.params;
            const teacherId = req.user.id;

            const { content, status, title } = req.body;

            // Validate required fields
            if (!course_id) {
                return res.status(400).json({ error: 'Course ID is required' });
            }

            if (!content) {
                return res.status(400).json({ error: 'Content is required' });
            }

            // Validate status if provided
            if (status && !['draft', 'published', 'archived'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            const blog = await blogService.createBlog({ course_id, content, status, title, teacherId });
            res.status(201).json(blog);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getBlogByTeacherId(req, res) {
        try {
            const teacherId = req.user.id;
            const exams = await blogService.getBlogByTeacherId(teacherId);

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


    // Get all blogs for a course
    async getBlogsByCourseId(req, res) {
        try {
            const { courseId } = req.params;
            const blogs = await blogService.getBlogsByCourseId(courseId);
            res.json(blogs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get blog by ID
    async getBlogById(req, res) {
        try {
            const { id } = req.params;
            const blog = await blogService.getBlogById(id);
            
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            
            res.json(blog);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update blog
    async updateBlog(req, res) {
        try {
            const { id } = req.params;
            const { content, status } = req.body;

            // Validate status if provided
            if (status && !['draft', 'published', 'archived'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            const blog = await blogService.updateBlog(id, { content, status });
            
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            
            res.json(blog);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete blog
    async deleteBlog(req, res) {
        try {
            const { id } = req.params;
            const blog = await blogService.deleteBlog(id);
            
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            
            res.json({ message: 'Blog deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get blogs by teacher ID
    async getBlogsByTeacherId(req, res) {
        try {
            const { teacherId } = req.params;
            const blogs = await blogService.getBlogsByTeacherId(teacherId);
            res.json(blogs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new BlogController(); 