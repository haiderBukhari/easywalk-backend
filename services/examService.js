import supabase from "../config/supabaseClient.js";

class ExamService {
    // Create a new exam
    async createExam(examData) {
        const { course_id, title, description, questions, teacherId } = examData;
        const { data, error } = await supabase
            .from('exams')
            .insert([{
                course_id,
                title,
                description,
                user_id: teacherId,
                questions,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Get all exams for a course
    async getExamsByCourseId(courseId) {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    // Get exam by ID
    async getExamById(id) {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // Update exam
    async updateExam(id, examData) {
        const { title, description, questions, status } = examData;
        const { data, error } = await supabase
            .from('exams')
            .update({
                title,
                description,
                questions,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete exam
    async deleteExam(id) {
        const { data, error } = await supabase
            .from('exams')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getExamsByTeacherId(teacherId) {
        // First get all courses for the teacher
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select(`
                *,
                courses (
                    id,
                    title,
                    teacher_id
                )
            `)
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (examsError) throw examsError;

        return exams.map(exam => ({
            ...exam,
            course_name: exam.courses?.title || 'Unknown Course'
        }));
    }
}

export default new ExamService(); 