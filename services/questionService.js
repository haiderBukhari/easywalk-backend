import supabase from "../config/supabaseClient.js";

class QuestionService {
    // Create a new question
    async createQuestion(questionData) {
        const { course_id, category, questions, user_id } = questionData;

        const { data: existingQuestion, error: existingQuestionError } = await supabase
            .from('questions')
            .select('*')
            .eq('course_id', course_id)
            .eq('user_id', user_id)
            .eq('category', category)

        if (existingQuestion) {
            await supabase
                .from('questions')
                .delete()
                .eq('course_id', course_id)
                .eq('user_id', user_id)
                .eq('category', category)
        }
        
        const { data, error } = await supabase
            .from('questions')
            .insert([{
                course_id,
                category,
                questions,
                user_id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getQuestionsByCourseId(courseId, category = null) {

        console.log(courseId, category);
        
        let query = supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                questions,
                created_at,
                updated_at,
                courses (
                    id,
                    title
                )
            `)
            .eq('course_id', courseId);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // Get question by ID
    async getQuestionById(id) {
        const { data, error } = await supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                questions,
                created_at,
                updated_at,
                courses (
                    id,
                    title
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // Update question
    async updateQuestion(id, questionData) {
        const { category, questions } = questionData;
        
        const { data, error } = await supabase
            .from('questions')
            .update({
                category,
                questions,
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

    // Get questions by teacher ID
    async getQuestionsByTeacherId(teacherId) {
        const { data, error } = await supabase
            .from('questions')
            .select(`
                id,
                course_id,
                category,
                questions,
                created_at,
                updated_at,
                courses (
                    id,
                    title
                )
            `)
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getQuestionsByCategory(category) {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}

export default new QuestionService(); 