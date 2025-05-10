import supabase from "../config/supabaseClient.js";

class CourseService {
    // Create a new course
    async createCourse(courseData) {
        const { title, description, category, cover_image, teacher_id } = courseData;
        const { data, error } = await supabase
            .from('courses')
            .insert([{
                title,
                description,
                category,
                cover_image,
                teacher_id,
                lesson_count: 0
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Get all courses
    async getAllCourses() {
        const { data, error } = await supabase
            .from('courses')
            .select(`*`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(course => ({
            ...course,
            teacher_name: course.users?.name
        }));
    }

    // Get course by ID
    async getCourseById(id) {
        const { data, error } = await supabase
            .from('courses')
            .select(`*`)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (data) {
            return {
                ...data,
                teacher_name: data.users?.name
            };
        }
        return null;
    }

    // Update course
    async updateCourse(id, courseData) {
        const { title, description, category, cover_image, status } = courseData;

        const { data, error } = await supabase
            .from('courses')
            .update({
                title,
                description,
                category,
                cover_image,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete course
    async deleteCourse(id) {
        const { data, error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Get courses by teacher ID
    async getCoursesByTeacherId(teacherId) {
        const { data, error } = await supabase
            .from('courses')
            .select(`*`)
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(course => ({
            ...course,
            teacher_name: course.users?.name
        }));
    }

    // Update lesson count
    async updateLessonCount(courseId) {
        // First get the count of lessons
        const { count, error: countError } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);

        if (countError) throw countError;

        // Update the course with the new count
        const { data, error } = await supabase
            .from('courses')
            .update({ lesson_count: count })
            .eq('id', courseId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export default new CourseService(); 