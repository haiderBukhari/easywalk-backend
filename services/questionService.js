import supabase from "../config/supabaseClient.js";

class QuestionService {
    // Create a new question
    async createQuestion(questionData) {
        const { course_id, category, question, options, correct, hint, video, image, user_id, exam_id } = questionData;

        const { data, error } = await supabase
            .from('questions')
            .insert([{
                course_id,
                category,
                question,
                options,
                correct,
                hint,
                video,
                image,
                user_id,
                exam_id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Create multiple questions
    async createMultipleQuestions(questionsData) {
        const { course_id, category, questions, user_id, exam_id } = questionsData;

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Questions array is required and must not be empty');
        }

        // Transform the questions array to match the new schema
        const questionsToInsert = questions.map(q => ({
            course_id,
            category,
            question: q.text,
            options: q.options,
            correct: q.correct,
            hint: q.hint || null,
            video: q.video || null,
            image: q.image || null,
            user_id,
            exam_id
        }));

        const { data, error } = await supabase
            .from('questions')
            .insert(questionsToInsert)
            .select();

        if (error) throw error;
        return data;
    }

    async getQuestionsByCourseId(courseId, category = null) {

        let query = supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                question,
                options,
                correct,
                hint,
                video,
                image,
                rating,
                created_at,
                updated_at
            `)
            .eq('course_id', courseId);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Get course information
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, title')
            .eq('id', courseId)
            .single();

        if (courseError) throw courseError;

        // Add course name to each question
        const questionsWithCourseInfo = data.map(question => ({
            ...question,
            course_name: course?.title || 'Unknown Course'
        }));

        return questionsWithCourseInfo;
    }

    async getQuestionsByCourseIdAndUserId(userId, courseId, category = null) {
        let query = supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                question,
                options,
                correct,
                hint,
                video,
                image,
                rating,
                created_at,
                updated_at
            `)
            .eq('course_id', courseId)
            .eq('user_id', userId);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Get course information
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, title')
            .eq('id', courseId)
            .single();

        if (courseError) throw courseError;

        // Add course name to each question
        const questionsWithCourseInfo = data.map(question => ({
            ...question,
            course_name: course?.title || 'Unknown Course'
        }));

        return questionsWithCourseInfo;
    }

    // Get question by ID
    async getQuestionById(id) {
        const { data, error } = await supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                question,
                options,
                correct,
                hint,
                video,
                image,
                rating,
                created_at,
                updated_at
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Get course information
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, title')
            .eq('id', data.course_id)
            .single();

        if (courseError) throw courseError;

        // Add course name to the question
        return {
            ...data,
            course_name: course?.title || 'Unknown Course'
        };
    }

    // Update question
    async updateQuestion(id, questionData) {
        const { category, question, options, correct, hint, video, image } = questionData;

        const { data, error } = await supabase
            .from('questions')
            .update({
                category,
                question,
                options,
                correct,
                hint,
                video,
                image,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete question
    async deleteQuestion(id) {
        const { data, error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete questions by category and course
    async deleteQuestionsByCategory(courseId, category, userId) {
        const { data, error } = await supabase
            .from('questions')
            .delete()
            .eq('course_id', courseId)
            .eq('category', category)
            .eq('user_id', userId)
            .select();

        if (error) throw error;
        return data;
    }

    // Get questions by teacher ID
    async getQuestionsByTeacherId(teacherId) {
        const batchSize = 1000;
        let offset = 0;
        let allQuestions = [];
        let keepFetching = true;

        while (keepFetching) {
            const { data, error } = await supabase
                .from('questions')
                .select(`
                    id,
                    course_id,
                    category,
                    question,
                    options,
                    correct,
                    hint,
                    video,
                    image,
                    rating,
                    created_at,
                    updated_at
                `)
                .eq('user_id', teacherId)
                .order('created_at', { ascending: false })
                .range(offset, offset + batchSize - 1);

            if (error) throw error;

            allQuestions = allQuestions.concat(data);

            if (!data || data.length < batchSize) {
                keepFetching = false;
            } else {
                offset += batchSize;
            }
        }

        // Get unique course IDs
        const courseIds = [...new Set(allQuestions.map(question => question.course_id))];

        // Fetch course information for all unique course IDs
        let courseMap = {};
        if (courseIds.length > 0) {
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .in('id', courseIds);

            if (coursesError) throw coursesError;

            // Create a map for quick lookup
            courseMap = courses.reduce((acc, course) => {
                acc[course.id] = course.title;
                return acc;
            }, {});
        }

        // Add course name to each question
        const questionsWithCourseInfo = allQuestions.map(question => ({
            ...question,
            course_name: courseMap[question.course_id] || 'Unknown Course'
        }));

        return questionsWithCourseInfo;
    }

    async getQuestionCountByTeacherId(teacherId) {
        const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', teacherId);
        if (error) throw error;
        return count;
    }

    async getQuestionsByCategory(category) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get unique course IDs
        const courseIds = [...new Set(data.map(question => question.course_id))];

        // Fetch course information for all unique course IDs
        let courseMap = {};
        if (courseIds.length > 0) {
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .in('id', courseIds);

            if (coursesError) throw coursesError;

            // Create a map for quick lookup
            courseMap = courses.reduce((acc, course) => {
                acc[course.id] = course.title;
                return acc;
            }, {});
        }

        // Add course name to each question
        const questionsWithCourseInfo = data.map(question => ({
            ...question,
            course_name: courseMap[question.course_id] || 'Unknown Course'
        }));

        return questionsWithCourseInfo;
    }

    async getQuestionsByCategoryAndUser(category, userId) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get unique course IDs
        const courseIds = [...new Set(data.map(question => question.course_id))];

        // Fetch course information for all unique course IDs
        let courseMap = {};
        if (courseIds.length > 0) {
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .in('id', courseIds);

            if (coursesError) throw coursesError;

            // Create a map for quick lookup
            courseMap = courses.reduce((acc, course) => {
                acc[course.id] = course.title;
                return acc;
            }, {});
        }

        // Add course name to each question
        const questionsWithCourseInfo = data.map(question => ({
            ...question,
            course_name: courseMap[question.course_id] || 'Unknown Course'
        }));

        return questionsWithCourseInfo;
    }

    // Get questions by exam ID
    async getQuestionsByExamId(examId) {
        const { data, error } = await supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                question,
                options,
                correct,
                hint,
                video,
                image,
                rating,
                created_at,
                updated_at
            `)
            .eq('exam_id', examId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get unique course IDs
        const courseIds = [...new Set(data.map(question => question.course_id))];

        // Fetch course information for all unique course IDs
        let courseMap = {};
        if (courseIds.length > 0) {
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .in('id', courseIds);

            if (coursesError) throw coursesError;

            // Create a map for quick lookup
            courseMap = courses.reduce((acc, course) => {
                acc[course.id] = course.title;
                return acc;
            }, {});
        }

        // Add course name to each question
        const questionsWithCourseInfo = data.map(question => ({
            ...question,
            course_name: courseMap[question.course_id] || 'Unknown Course'
        }));

        return questionsWithCourseInfo;
    }

    // Rate a question
    async rateQuestion(id, rating) {
        const { data, error } = await supabase
            .from('questions')
            .update({ rating })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export default new QuestionService(); 