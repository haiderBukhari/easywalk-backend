import supabase from '../config/supabaseClient.js';

const enrollInCourse = async (studentId, courseId) => {
    // Check if the student is already enrolled in the course
    const { data: existingData, error: existingError } = await supabase
        .from('exam_plans')
        .select('*')
        .eq('student_id', studentId)
        .eq('enrolled_course', courseId);

    if (existingError) throw new Error(existingError.message);
    if (existingData.length > 0) throw new Error('Student is already enrolled in this course.');

    // Proceed with enrollment if not already enrolled
    const { data: data1, error: error } = await supabase
        .from('exam_plans')
        .insert({
            student_id: studentId,
            enrolled_course: courseId,
        })
        .select();

    if (error) throw new Error(error.message);
    return data1;
};

const setReminder = async (studentId, courseId, remindTime, remindDate, examPlane, level, duration, targetScore, remind_days) => {
    const { data, error } = await supabase
        .from('exam_plans')
        .update({
            remind_time: remindTime,
            remind_date: remindDate,
            exam_plane: examPlane,
            level: level,
            duration: duration,
            remind_days: remind_days,
            target_score: targetScore,
            updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId)
        .eq('enrolled_course', courseId)
        .select();

    if (error) throw new Error(error.message);
    return data;
};

const getRecentEnrolledCourse = async (studentId) => {
    const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('exam_plans')
        .select('enrolled_course')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (enrollmentError) throw new Error(enrollmentError.message);
    if (!enrollmentData || enrollmentData.length === 0) throw new Error('No courses found for this student.');

    // Get all unique course IDs
    const courseIds = [...new Set(enrollmentData.map(item => item.enrolled_course))];

    // Fetch all course titles in one query
    const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

    if (courseError) throw new Error(courseError.message);

    // Map courseId to title for quick lookup
    const courseMap = {};
    courseData.forEach(course => {
        courseMap[course.id] = course.title;
    });

    // Build the result array
    return courseIds.map(courseId => ({
        courseId,
        courseTitle: courseMap[courseId] || 'Unknown Title'
    }));
};

const getTopRatedBlogs = async (courseId) => {
    // Get top-rated blogs for the course
    const { data: blogData, error: blogError } = await supabase
        .from('blogs')
        .select('id, title, content, created_at, rating, user_id')
        .eq('course_id', courseId)
        .eq('status', 'published')
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false });

    if (blogError) throw new Error(blogError.message);

    // If all ratings are null, get the most recent blog
    if (blogData.every(blog => blog.rating === null)) {
        return blogData[0]; // Return the most recent blog
    }

    // Get user details for each blog
    const userIds = blogData.map(blog => blog.user_id);
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, profile_image')
        .in('id', userIds);

    if (userError) throw new Error(userError.message);

    // Merge blog and user data
    const blogsWithUserDetails = blogData.map(blog => {
        const user = userData.find(user => user.id === blog.user_id);
        return {
            ...blog,
            full_name: user ? user.full_name : null,
            profile_image: user ? user.profile_image : null,
        };
    });

    return blogsWithUserDetails;
};

const getAllBlogs = async (courseId) => {
    // Get all blogs for the course
    const { data: blogData, error: blogError } = await supabase
        .from('blogs')
        .select('id, title, content, created_at, rating, user_id')
        .eq('course_id', courseId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (blogError) throw new Error(blogError.message);

    // Get user details for each blog
    const userIds = blogData.map(blog => blog.user_id);
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, profile_image')
        .in('id', userIds);

    if (userError) throw new Error(userError.message);

    // Merge blog and user data
    const blogsWithUserDetails = blogData.map(blog => {
        const user = userData.find(user => user.id === blog.user_id);
        return {
            ...blog,
            full_name: user ? user.full_name : null,
            profile_image: user ? user.profile_image : null,
        };
    });

    return blogsWithUserDetails;
};

const getAllWinningQuestions = async () => {
    const { data: questions, error } = await supabase
        .from('winning_questions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return questions;
};

const getStudentProgress = async (studentId, courseId) => {
    const { data: progressData, error } = await supabase
        .from('exam_plans')
        .select('id, enrolled_course, updated_at, exam_plane')
        .eq('student_id', studentId)
        .eq('enrolled_course', courseId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message);

    // Calculate exam date
    const progressWithExamDate = progressData.map(progress => {
        const startDate = new Date(progress.updated_at);
        const examDate = new Date(startDate);
        examDate.setDate(startDate.getDate() + progress.exam_plane);
        return {
            enrolled_in: startDate,
            exam_date: examDate.toISOString()
        };
    });

    return progressWithExamDate.length ? progressWithExamDate[0] : {};
};

const getCourseQuestionsByCourseId = async (courseId) => {
    const { data: questionsData, error } = await supabase
        .from('questions')
        .select('id, category, questions, rating, created_at')
        .eq('course_id', courseId)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const categoryMap = new Map();

    questionsData.forEach(question => {
        const existingQuestion = categoryMap.get(question.category);
        if (!existingQuestion || 
            (question.rating > existingQuestion.rating) || 
            (question.rating === existingQuestion.rating && new Date(question.created_at) > new Date(existingQuestion.created_at))) {
            categoryMap.set(question.category, question);
        }
    });

    // Process questions to exclude options, video, hint, and weightage
    const processedQuestions = Array.from(categoryMap.values()).map(question => {
        const simplifiedQuestions = question.questions.map(q => ({
            text: q.text
        }));
        return {
            id: question.id,
            category: question.category,
            questions: simplifiedQuestions,
            number_of_questions: simplifiedQuestions.length,
            rating: question.rating,
            created_at: question.created_at
        };
    });

    return processedQuestions;
};

const getQuestionsWithTeacherDetails = async () => {
    const { data: questionsData, error } = await supabase
        .from('questions')
        .select('id, category, questions, rating, created_at, user_id')
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Get unique user_ids from questions
    const userIds = [...new Set(questionsData.map(question => question.user_id))];

    // Get teacher details from users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, profile_image')
        .in('id', userIds);

    if (userError) throw new Error(userError.message);

    // Group questions by teacher
    const questionsByTeacher = userData.map(user => {
        const teacherQuestions = questionsData.filter(question => question.user_id === user.id);
        const simplifiedQuestions = teacherQuestions.map(question => ({
            id: question.id,
            category: question.category,
            questions: question.questions.map(q => ({ text: q.text })),
            number_of_questions: question.questions.length,
            rating: question.rating,
            created_at: question.created_at
        }));
        return {
            user_id: user.id,
            full_name: user.full_name,
            profile_image: user.profile_image,
            all_questions: simplifiedQuestions
        };
    });

    return questionsByTeacher;
};

const getExamsWithTeacherDetails = async (studentId, courseId) => {
    const { data: examsData, error } = await supabase
        .from('exams')
        .select('id, status, user_id, attempted, rating, category, questions')
        .eq('course_id', courseId)
        .eq('status', 'published')
        .order('rating', { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = [...new Set(examsData.map(exam => exam.user_id))];

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, profile_image')
        .in('id', userIds);

    if (userError) throw new Error(userError.message);

    const examsByTeacher = userData.map(user => {
        const teacherExams = examsData.filter(exam => exam.user_id === user.id);
        return {
            user_id: user.id,
            full_name: user.full_name,
            profile_image: user.profile_image,
            exams: teacherExams.map(exam => {
                const hasAttempted = exam.attempted.includes(studentId);
                return {
                    id: exam.id,
                    hasAttempted: hasAttempted,
                    rating: exam.rating,
                    category: exam.category,
                    total_questions: exam.questions.length
                };
            })
        };
    });

    return examsByTeacher;
};

const getPublishedExamsByCourseId = async (courseId, studentId) => {
    const { data: examsData, error } = await supabase
        .from('exams')
        .select('id, status, attempted, rating, category, questions, created_at')
        .eq('course_id', courseId)
        .eq('status', 'published')
        .order('rating', { ascending: false });

    if (error) throw new Error(error.message);

    const categoryMap = new Map();

    examsData.forEach(exam => {
        const existingExam = categoryMap.get(exam.category);
        if (!existingExam || 
            (exam.rating > existingExam.rating) || 
            (exam.rating === existingExam.rating && new Date(exam.created_at) > new Date(existingExam.created_at))) {
            categoryMap.set(exam.category, exam);
        }
    });

    return Array.from(categoryMap.values()).map(exam => {
        const hasAttempted = exam.attempted.includes(studentId);
        return {
            id: exam.id,
            category: exam.category,
            rating: exam.rating,
            total_questions: exam.questions.length,
            hasAttempted: hasAttempted
        };
    });
};

const getPublishedLessonsByCourseId = async (courseId, studentId) => {
    const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('id, title, created_at, updated_at, category, user_id')
        .eq('course_id', courseId)
        .order('rating', { ascending: false });

    if (error) throw new Error(error.message);

    // Count lessons by user_id
    const userLessonCount = lessonsData.reduce((acc, lesson) => {
        acc[lesson.user_id] = (acc[lesson.user_id] || 0) + 1;
        return acc;
    }, {});

    // Find the user_id with the highest lesson count
    const maxUserId = Object.keys(userLessonCount).reduce((a, b) => userLessonCount[a] > userLessonCount[b] ? a : b);

    // Return all lessons for the user with the highest lesson count
    return lessonsData.filter(lesson => lesson.user_id === maxUserId).map(lesson => {
        return {
            id: lesson.id,
            title: lesson.title,
            category: lesson.category,
            created_at: lesson.created_at,
            updated_at: lesson.updated_at,
            user_id: lesson.user_id
        };
    });
};

const getLessonsWithTeacherDetails = async (courseId, studentId) => {
    const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('id, title, created_at, updated_at, category, user_id, arrangement_no')
        .eq('course_id', courseId)
        .order('rating', { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = [...new Set(lessonsData.map(lesson => lesson.user_id))];

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, profile_image')
        .in('id', userIds);

    if (userError) throw new Error(userError.message);

    // Group lessons by user_id
    const lessonsByUser = userData.map(user => {
        const userLessons = lessonsData.filter(lesson => lesson.user_id === user.id);
        return {
            user_id: user.id,
            full_name: user.full_name,
            profile_image: user.profile_image,
            lessons: userLessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                category: lesson.category,
                created_at: lesson.created_at,
                updated_at: lesson.updated_at,
                arrangement_no: lesson.arrangement_no
            }))
        };
    });

    return lessonsByUser;
};

const getTeacherProfile = async (userId) => {
    // Get teacher details
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, profile_image')
        .eq('id', userId);

    if (userError) throw new Error(userError.message);
    if (!userData.length) throw new Error('User not found.');

    // Get lessons created by the teacher
    const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, created_at, updated_at, category, arrangement_no')
        .eq('user_id', userId);

    if (lessonsError) throw new Error(lessonsError.message);

    const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('id, title, created_at, updated_at, category')
        .eq('user_id', userId);

    if (examsError) throw new Error(examsError.message);

    // Get blogs created by the teacher
    const { data: blogsData, error: blogsError } = await supabase
        .from('blogs')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId);

    if (blogsError) throw new Error(blogsError.message);

    return {
        full_name: userData[0].full_name,
        profile_image: userData[0].profile_image,
        lessons: lessonsData,
        exams: examsData,
        blogs: blogsData
    };
};

const rateExam = async (examId, newRating) => {
    const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('rating')
        .eq('id', examId);

    if (examError) throw new Error(examError.message);
    if (!examData.length) throw new Error('Exam not found.');

    const { rating } = examData[0];
    const updatedRating = rating ? (rating + newRating) / 2 : newRating;

    const { data, error } = await supabase
        .from('exams')
        .update({ rating: updatedRating })
        .eq('id', examId);

    if (error) throw new Error(error.message);
    return {
        success: true,
        message: 'Exam rating updated successfully',
    }
};

const rateLesson = async (lessonId, newRating) => {
    const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('rating')
        .eq('id', lessonId);

    if (lessonError) throw new Error(lessonError.message);
    if (!lessonData.length) throw new Error('Lesson not found.');

    const { rating } = lessonData[0];
    const updatedRating = rating ? (rating + newRating) / 2 : newRating;

    const { data, error } = await supabase
        .from('lessons')
        .update({ rating: updatedRating })
        .eq('id', lessonId);

    if (error) throw new Error(error.message);
    return {
        success: true,
        message: 'Lesson rating updated successfully',
    };
};

const rateBlog = async (blogId, newRating) => {
    const { data: blogData, error: blogError } = await supabase
        .from('blogs')
        .select('rating')
        .eq('id', blogId);

    if (blogError) throw new Error(blogError.message);
    if (!blogData.length) throw new Error('Blog not found.');

    const { rating } = blogData[0];
    const updatedRating = rating ? (rating + newRating) / 2 : newRating;

    const { data, error } = await supabase
        .from('blogs')
        .update({ rating: updatedRating })
        .eq('id', blogId);

    if (error) throw new Error(error.message);
    return {
        success: true,
        message: 'Blog rating updated successfully',
    };
};

const createSupportRequest = async (title, issue) => {
    const { data, error } = await supabase
        .from('support')
        .insert({ title, issue })
        .select();

    if (error) throw new Error(error.message);
    return {
        success: true,
        message: 'Support request created successfully',
        data
    };
};

const getSupportRequests = async () => {
    const { data, error } = await supabase
        .from('support')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

export default {
    enrollInCourse,
    setReminder,
    getRecentEnrolledCourse,
    getTopRatedBlogs,
    getAllBlogs,
    getAllWinningQuestions,
    getStudentProgress,
    getCourseQuestionsByCourseId,
    getQuestionsWithTeacherDetails,
    getExamsWithTeacherDetails,
    getPublishedExamsByCourseId,
    getPublishedLessonsByCourseId,
    getLessonsWithTeacherDetails,
    getTeacherProfile,
    rateExam,
    rateLesson,
    rateBlog,
    createSupportRequest,
    getSupportRequests,
}; 