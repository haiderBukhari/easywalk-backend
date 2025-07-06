import supabase from "../config/supabaseClient.js";

class BlogService {
    // Create a new blog
    async createBlog(blogData) {
        const { course_id, content, status, title, teacherId } = blogData;

        // Validate content array has at least one item
        if (!Array.isArray(content) || content.length === 0) {
            throw new Error('Content must be a non-empty array');
        }

        const { data, error } = await supabase
            .from('blogs')
            .insert([{
                course_id,
                user_id: teacherId,
                content,
                status: status || 'draft',
                title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getBlogByTeacherId(teacherId) {

        const { data: blogs, error: blogsError } = await supabase
            .from('blogs')
            .select('*')
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (blogsError) throw blogsError;

        // Get course information for each blog
        const blogsWithCourseInfo = await Promise.all(
            blogs.map(async (blog) => {
                try {
                    const { data: course, error: courseError } = await supabase
                        .from('courses')
                        .select('id, title')
                        .eq('id', blog.course_id)
                        .single();

                    return {
                        ...blog,
                        course_name: course?.title || 'Unknown Course'
                    };
                } catch (courseError) {
                    console.error(`Error fetching course for blog ${blog.id}:`, courseError);
                    return {
                        ...blog,
                        course_name: 'Unknown Course'
                    };
                }
            })
        );

        return blogsWithCourseInfo;
    }


    async getBlogsByCourseId(courseId) {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // Get blog by ID
    async getBlogById(id) {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // Update blog
    async updateBlog(id, blogData) {
        const { content, status } = blogData;

        // Validate content array has at least one item if provided
        if (content && (!Array.isArray(content) || content.length === 0)) {
            throw new Error('Content must be a non-empty array');
        }

        const { data, error } = await supabase
            .from('blogs')
            .update({
                content,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete blog
    async deleteBlog(id) {
        const { data, error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Get blogs by teacher ID (through courses)
    async getBlogsByTeacherId(teacherId) {
        // First get all courses for the teacher
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, title')
            .eq('teacher_id', teacherId);

        if (coursesError) throw coursesError;
        
        if (!courses || courses.length === 0) {
            return [];
        }

        const courseIds = courses.map(course => course.id);

        const { data: blogs, error: blogsError } = await supabase
            .from('blogs')
            .select('*')
            .in('course_id', courseIds)
            .order('created_at', { ascending: false });

        if (blogsError) throw blogsError;

        // Get course information for each blog
        const blogsWithCourseInfo = await Promise.all(
            blogs.map(async (blog) => {
                try {
                    const { data: course, error: courseError } = await supabase
                        .from('courses')
                        .select('id, title')
                        .eq('id', blog.course_id)
                        .single();

                    return {
                        ...blog,
                        course_name: course?.title || 'Unknown Course'
                    };
                } catch (courseError) {
                    console.error(`Error fetching course for blog ${blog.id}:`, courseError);
                    return {
                        ...blog,
                        course_name: 'Unknown Course'
                    };
                }
            })
        );

        return blogsWithCourseInfo;
    }
}

export default new BlogService(); 