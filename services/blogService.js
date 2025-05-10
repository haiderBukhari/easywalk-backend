import supabase from "../config/supabaseClient.js";

class BlogService {
    // Create a new blog
    async createBlog(blogData) {
        const { course_id, content, status, title } = blogData;

        // Validate content array has at least one item
        if (!Array.isArray(content) || content.length === 0) {
            throw new Error('Content must be a non-empty array');
        }

        const { data, error } = await supabase
            .from('blogs')
            .insert([{
                course_id,
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
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, title')
            .eq('teacher_id', teacherId);

        if (coursesError) throw coursesError;
        
        if (!courses || courses.length === 0) {
            return [];
        }

        const courseIds = courses.map(course => course.id);

        const { data: exams, error: examsError } = await supabase
            .from('blogs')
            .select(`
                *,
                courses (
                    id,
                    title,
                    teacher_id
                )
            `)
            .in('course_id', courseIds)
            .order('created_at', { ascending: false });

        if (examsError) throw examsError;

        // Map the exams to include course name
        return exams.map(exam => ({
            ...exam,
            course_name: exam.courses?.title || 'Unknown Course'
        }));
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
            .select(`
                *,
                courses (
                    id,
                    title,
                    teacher_id
                )
            `)
            .in('course_id', courseIds)
            .order('created_at', { ascending: false });

        if (blogsError) throw blogsError;

        // Map the blogs to include course name
        return blogs.map(blog => ({
            ...blog,
            course_name: blog.courses?.title || 'Unknown Course'
        }));
    }
}

export default new BlogService(); 