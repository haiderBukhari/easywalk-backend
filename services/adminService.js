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
                status
            `)
            .eq('role', 'teacher')
            .order('created_at', { ascending: false });

        if (teachersError) throw new Error(teachersError.message);

        // Get course counts for each teacher
        const teachersWithCourseCounts = await Promise.all(
            teachers.map(async (teacher) => {
                const { count, error: countError } = await supabase
                    .from('courses')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', teacher.id);

                if (countError) {
                    console.error(`Error counting courses for teacher ${teacher.id}:`, countError);
                    return {
                        id: teacher.id,
                        full_name: teacher.full_name,
                        email: teacher.email,
                        contact_number: teacher.contact_number,
                        joined_date: teacher.created_at,
                        profile_image: teacher.profile_image,
                        status: teacher.status,
                        total_courses: 0
                    };
                }

                return {
                    id: teacher.id,
                    full_name: teacher.full_name,
                    email: teacher.email,
                    contact_number: teacher.contact_number,
                    joined_date: teacher.created_at,
                    profile_image: teacher.profile_image,
                    status: teacher.status,
                    total_courses: count || 0
                };
            })
        );

        return teachersWithCourseCounts;
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
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select(`
            id,
            title,
            description,
            created_at,
            updated_at,
            course_id,
            courses (
                title
            ),
            category
        `)
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (lessonsError) throw new Error(lessonsError.message);

        // Get teacher's exams
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select(`
                id,
                title,
                course_id,
                created_at,
                status,
                category,
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
                total_lessons: lessons.length,
                total_exams: exams.length,
                total_blogs: blogs.length
            },
            lessons: lessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                date_created: lesson.created_at,
                course_title: lesson.courses?.title || 'No Course',
                category: lesson.category,
                course_id: lesson.course_id
            })),
            exams: exams.map(exam => ({
                id: exam.id,
                course_name: exam.courses?.title || 'No Course',
                title: exam.title,
                category: exam.category,
                date_created: exam.created_at,
                status: exam.status,
                course_id: exam.course_id
            })),
            blogs: blogs.map(blog => ({
                id: blog.id,
                course_name: blog.courses?.title || 'No Course',
                title: blog.title,
                date_created: blog.created_at,
                status: blog.status,
                course_id: blog.course_id
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

export const getWinningQuestionsByTeacher = async (teacherId) => {
    try {
        const { data: winningQuestions, error } = await supabase
            .from('winning_questions')
            .select(`
                id,
                question,
                answer,
                created_at,
                updated_at,
                user_id
            `)
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return winningQuestions;
    } catch (error) {
        throw new Error(`Error fetching winning questions: ${error.message}`);
    }
};

export const getCourseCategoriesById = async (courseId) => {
    try {

        const { data: course, error } = await supabase
            .from('courses')
            .select(`
                title,
                category
            `)
            .eq('id', courseId)
            .single();

        if (error) throw new Error(error.message);
        if (!course) throw new Error('Course not found');

        return {
            courseId: course.id,
            courseTitle: course.title,
            category: course.category || null
        };
    } catch (error) {
        throw new Error(`Error fetching course categories: ${error.message}`);
    }
};


export const getFullDetails = async () => {
    try {

        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('count')
            .not('user_id', 'is', null)
            .single();

        if (lessonsError) throw new Error(lessonsError.message);

        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select('count')
            .not('user_id', 'is', null)
            .single();

        if (examsError) throw new Error(examsError.message);

        const { data: blogs, error: blogsError } = await supabase
            .from('blogs')
            .select('count')
            .not('user_id', 'is', null)
            .single();

        if (blogsError) throw new Error(blogsError.message);
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('count')
            .single();

        if (coursesError) throw new Error(coursesError.message);

        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('count')
            .eq('role', 'student')
            .single();

        if (studentsError) throw new Error(studentsError.message);
        const { data: teachers, error: teachersError } = await supabase
            .from('users')
            .select('count')
            .eq('role', 'teacher')
            .single();

        if (teachersError) throw new Error(teachersError.message);
        const fullDetails = {
            total_lessons: lessons.count,
            total_exams: exams.count,
            total_blogs: blogs.count,
            total_courses: courses.count,
            total_students: students.count,
            total_teachers: teachers.count
        }


        return fullDetails;

    } catch (error) {
        throw new Error(`Error fetching full details: ${error.message}`);
    }
}
