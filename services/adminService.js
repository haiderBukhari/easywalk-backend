import supabase from "../config/supabaseClient.js";

export const getAllTeachers = async () => {
    try {
        // Get all users with teacher status
        const { data: teachers, error: teachersError } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                contact_number,
                created_at,
                profile_image,
                status,
                courses: courses(count)
            `)
            .eq('role', 'teacher')
            .order('created_at', { ascending: false });

        if (teachersError) throw new Error(teachersError.message);

        // Transform the data to match the required format
        const formattedTeachers = teachers.map(teacher => ({
            id: teacher.id,
            full_name: teacher.full_name,
            email: teacher.email,
            contact_number: teacher.contact_number,
            joined_date: teacher.created_at,
            profile_image: teacher.profile_image,
            status: teacher.status,
            total_courses: teacher.courses[0].count
        }));

        return formattedTeachers;
    } catch (error) {
        throw new Error(`Error fetching teachers: ${error.message}`);
    }
};

export const getTeacherDetails = async (teacherId) => {
    try {

        const { data: teacher, error: teacherError } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                contact_number,
                created_at,
                profile_image,
                status
            `)
            .eq('id', teacherId)
            .eq('role', 'teacher')
            .single();

        if (teacherError) throw new Error(teacherError.message);
        if (!teacher) throw new Error('Teacher not found');

        // Get teacher's courses
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select(`
                id,
                title,
                created_at,
                status,
                category
            `)
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (coursesError) throw new Error(coursesError.message);

        // Get teacher's exams
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select(`
                id,
                title,
                course_id,
                created_at,
                status,
                courses (
                    title
                )
            `)
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (examsError) throw new Error(examsError.message);

        // Get teacher's blogs
        const { data: blogs, error: blogsError } = await supabase
            .from('blogs')
            .select(`
                id,
                title,
                course_id,
                created_at,
                status,
                courses (
                    title
                )
            `)
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (blogsError) throw new Error(blogsError.message);

        // Format the response
        return {
            id: teacher.id,
            full_name: teacher.full_name,
            email: teacher.email,
            contact_number: teacher.contact_number,
            joined_date: teacher.created_at,
            profile_image: teacher.profile_image,
            status: teacher.status,
            statistics: {
                total_courses: courses.length,
                total_exams: exams.length,
                total_blogs: blogs.length
            },
            courses: courses.map(course => ({
                id: course.id,
                course_name: course.title,
                category: course.category,
                date_created: course.created_at,
                status: course.status
            })),
            exams: exams.map(exam => ({
                id: exam.id,
                course_name: exam.courses?.title || 'No Course',
                title: exam.title,
                date_created: exam.created_at,
                status: exam.status
            })),
            blogs: blogs.map(blog => ({
                id: blog.id,
                course_name: blog.courses?.title || 'No Course',
                title: blog.title,
                date_created: blog.created_at,
                status: blog.status
            }))
        };
    } catch (error) {
        throw new Error(`Error fetching teacher details: ${error.message}`);
    }
};

export const toggleTeacherStatus = async (teacherId) => {
    try {
        // First get the current status
        const { data: teacher, error: fetchError } = await supabase
            .from('users')
            .select('status')
            .eq('id', teacherId)
            .single();

        if (fetchError) throw new Error(fetchError.message);
        if (!teacher) throw new Error('Teacher not found');

        // Toggle the status
        const newStatus = teacher.status === 'active' ? 'inactive' : 'active';

        // Update the status
        const { data: updatedTeacher, error: updateError } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', teacherId)
            .select()
            .single();

        if (updateError) throw new Error(updateError.message);

        return {
            id: updatedTeacher.id,
            status: updatedTeacher.status
        };
    } catch (error) {
        throw new Error(`Error toggling teacher status: ${error.message}`);
    }
};

export const createWinningQuestion = async (userId, questionData) => {
    try {
        const { data: winningQuestion, error } = await supabase
            .from('winning_questions')
            .insert([
                {
                    question: questionData.question,
                    answer: questionData.answer,
                    user_id: userId
                }
            ])
            .select()
            .single();

        if (error) throw new Error(error.message);

        return winningQuestion;
    } catch (error) {
        throw new Error(`Error creating winning question: ${error.message}`);
    }
}; 