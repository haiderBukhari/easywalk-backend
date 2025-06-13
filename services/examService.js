import supabase from "../config/supabaseClient.js";

class ExamService {
    // Create a new exam
    async createExam(examData) {
        const { course_id, title, description, questions, teacherId, category, status } = examData;
        const { data, error } = await supabase
            .from('exams')
            .insert([{
                course_id,
                title,
                description,
                user_id: teacherId,
                questions,
                category,
                status,
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

        console.log(data);

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

    // Submit exam and save result
    async submitExam(examId, userId, answers) {
        // Fetch the exam
        const exam = await this.getExamById(examId);
        if (!exam) throw new Error('Exam not found');
        if (!Array.isArray(exam.questions)) throw new Error('Exam questions are not properly set');
        if (answers.length > exam.questions.length) {
            throw new Error('Submitted answers exceed the number of questions in the exam');
        }

        const totalScore = exam.questions.reduce((sum, q) => sum + (q.weightage || 1), 0);
        
        // Evaluate answers
        let obtainedScore = 0;
        let results = [];

        for (let i = 0; i < exam.questions.length; i++) {
            const question = exam.questions[i];
            const answer = answers[i];
            const selectedOption = Object.values(answer)[0] - 1;
            const correctOption = question.options.findIndex(opt => opt.correct);
            
            const isCorrect = selectedOption === correctOption;
            if (isCorrect) {
                obtainedScore += question.weightage || 1;
            }

            results.push({
                question: question.text,
                selected: selectedOption + 1,
                correct: correctOption + 1,
                isCorrect,
                weightage: question.weightage || 1
            });
        }

        // Save submission
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .insert([
                {
                    examID: examId,
                    userID: userId,
                    results,
                    obtainedScore,
                    totalScore,
                    submitted_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (submissionError) throw submissionError;

        // Update attempted array in exams
        const attempted = Array.isArray(exam.attempted) ? exam.attempted : [];
        if (!attempted.includes(userId)) {
            attempted.push(userId);
            await supabase
                .from('exams')
                .update({ attempted })
                .eq('id', examId);
        }

        return { 
            results, 
            obtainedScore,
            totalScore,
            percentage: (obtainedScore / totalScore) * 100
        };
    }

    // Get exam result for a user
    async getExamResult(examId, userId) {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('examID', examId)
            .eq('userID', userId)
            .order('submitted_at', { ascending: false })
            .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) return null;
        return data[0];
    }

    async getUserSubmissions(userId) {
        try {
            const { data: submissions, error: submissionsError } = await supabase
                .from('submissions')
                .select(`
                    *,
                    exam:examID (
                        id,
                        title,
                        description,
                        category,
                        created_at
                    )
                `)
                .eq('userID', userId)
                .order('submitted_at', { ascending: false });

            if (submissionsError) throw submissionsError;

            return submissions.map(submission => ({
                id: submission.id,
                exam: submission.exam,
                obtainedScore: submission.obtainedScore,
                totalScore: submission.totalScore,
                results: submission.results,
                submitted_at: submission.submitted_at
            }));
        } catch (error) {
            console.error('Error in getUserSubmissions:', error);
            throw error;
        }
    }
}

export default new ExamService(); 