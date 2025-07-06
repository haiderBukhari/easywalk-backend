import supabase from "../config/supabaseClient.js";

class ExamService {
    // Create a new exam
    async createExam(examData) {
        const { course_id, title, description, questionIds, teacherId, category, status, complexity, estimated_time_to_complete } = examData;
        
        // Create the exam first
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .insert([{
                course_id,
                title,
                description,
                user_id: teacherId,
                category,
                status,
                complexity,
                estimated_time_to_complete,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (examError) throw examError;

        // If question IDs are provided, create exam_questions entries
        if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
            const examQuestions = questionIds.map((questionId, index) => ({
                exam_id: exam.id,
                course_id,
                question_id: questionId,
                position: index + 1
            }));

            const { error: examQuestionsError } = await supabase
                .from('exam_questions')
                .insert(examQuestions);

            if (examQuestionsError) throw examQuestionsError;
        }

        return exam;
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

    // Get exam by ID with questions
    async getExamById(id) {
        // Get exam details
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', id)
            .single();

        if (examError) throw examError;
        if (!exam) return null;

        // Get exam questions with question details
        const { data: examQuestions, error: examQuestionsError } = await supabase
            .from('exam_questions')
            .select(`
                id,
                position,
                questions (
                    id,
                    question,
                    options,
                    correct,
                    hint,
                    video,
                    category
                )
            `)
            .eq('exam_id', id)
            .order('position', { ascending: true });

        if (examQuestionsError) throw examQuestionsError;

        // Format the questions
        const questions = examQuestions.map(eq => ({
            id: eq.questions.id,
            text: eq.questions.question,
            options: eq.questions.options,
            correct: eq.questions.correct,
            hint: eq.questions.hint,
            video: eq.questions.video,
            category: eq.questions.category,
            position: eq.position
        }));

        return {
            ...exam,
            questions
        };
    }

    // Update exam
    async updateExam(id, examData) {
        const { title, description, questionIds, status, complexity, estimated_time_to_complete } = examData;
        
        // Update exam details
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .update({
                title,
                description,
                status,
                complexity,
                estimated_time_to_complete,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (examError) throw examError;

        // If question IDs are provided, update exam questions
        if (questionIds && Array.isArray(questionIds)) {
            // Delete existing exam questions
            const { error: deleteError } = await supabase
                .from('exam_questions')
                .delete()
                .eq('exam_id', id);

            if (deleteError) throw deleteError;

            // Insert new exam questions if provided
            if (questionIds.length > 0) {
                const examQuestions = questionIds.map((questionId, index) => ({
                    exam_id: id,
                    course_id: exam.course_id,
                    question_id: questionId,
                    position: index + 1
                }));

                const { error: insertError } = await supabase
                    .from('exam_questions')
                    .insert(examQuestions);

                if (insertError) throw insertError;
            }
        }

        return exam;
    }

    // Delete exam
    async deleteExam(id) {
        // Delete exam questions first (cascade should handle this, but being explicit)
        const { error: examQuestionsError } = await supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', id);

        if (examQuestionsError) throw examQuestionsError;

        // Delete the exam
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
        // Get all exams for the teacher
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select('*')
            .eq('user_id', teacherId)
            .order('created_at', { ascending: false });

        if (examsError) throw examsError;

        // Get course information for each exam
        const examsWithCourseInfo = await Promise.all(
            exams.map(async (exam) => {
                try {
                    const { data: course, error: courseError } = await supabase
                        .from('courses')
                        .select('id, title')
                        .eq('id', exam.course_id)
                        .single();

                    return {
                        ...exam,
                        course_name: course?.title || 'Unknown Course'
                    };
                } catch (courseError) {
                    console.error(`Error fetching course for exam ${exam.id}:`, courseError);
                    return {
                        ...exam,
                        course_name: 'Unknown Course'
                    };
                }
            })
        );

        return examsWithCourseInfo;
    }

    // Add questions to exam
    async addQuestionsToExam(examId, questionIds) {
        // Get exam to get course_id
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('course_id')
            .eq('id', examId)
            .single();

        if (examError) throw examError;
        if (!exam) throw new Error('Exam not found');

        // Get current max position
        const { data: currentQuestions, error: positionError } = await supabase
            .from('exam_questions')
            .select('position')
            .eq('exam_id', examId)
            .order('position', { ascending: false })
            .limit(1);

        let startPosition = 1;
        if (currentQuestions && currentQuestions.length > 0) {
            startPosition = currentQuestions[0].position + 1;
        }

        // Create exam questions
        const examQuestions = questionIds.map((questionId, index) => ({
            exam_id: examId,
            course_id: exam.course_id,
            question_id: questionId,
            position: startPosition + index
        }));

        const { error: insertError } = await supabase
            .from('exam_questions')
            .insert(examQuestions);

        if (insertError) throw insertError;

        return { success: true, message: 'Questions added to exam successfully' };
    }

    // Remove questions from exam
    async removeQuestionsFromExam(examId, questionIds) {
        const { error } = await supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', examId)
            .in('question_id', questionIds);

        if (error) throw error;

        return { success: true, message: 'Questions removed from exam successfully' };
    }

    // Get exam questions
    async getExamQuestions(examId) {
        const { data, error } = await supabase
            .from('exam_questions')
            .select(`
                id,
                position,
                questions (
                    id,
                    question,
                    options,
                    correct,
                    hint,
                    video,
                    category
                )
            `)
            .eq('exam_id', examId)
            .order('position', { ascending: true });

        if (error) throw error;

        return data.map(eq => ({
            id: eq.questions.id,
            text: eq.questions.question,
            options: eq.questions.options,
            correct: eq.questions.correct,
            hint: eq.questions.hint,
            video: eq.questions.video,
            category: eq.questions.category,
            position: eq.position
        }));
    }

    // Submit exam and save result
    async submitExam(examId, userId, answers) {
        // Get exam questions
        const questions = await this.getExamQuestions(examId);
        if (!questions || questions.length === 0) throw new Error('No questions found for this exam');
        
        if (answers.length > questions.length) {
            throw new Error('Submitted answers exceed the number of questions in the exam');
        }

        const totalScore = questions.length;
        
        // Evaluate answers
        let obtainedScore = 0;
        let results = [];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const answer = answers[i];
            const selectedOption = Object.values(answer)[0];
            const correctOption = question.correct;
            
            const isCorrect = selectedOption === correctOption;
            if (isCorrect) {
                obtainedScore += 1;
            }

            results.push({
                question: question.text,
                selected: selectedOption,
                correct: correctOption,
                isCorrect
            });
        }

        // Delete any existing submission for this user and exam
        const { error: deleteError } = await supabase
            .from('submissions')
            .delete()
            .eq('examID', examId)
            .eq('userID', userId);

        if (deleteError) {
            console.error('Error deleting previous submission:', deleteError);
            throw deleteError;
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
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('attempted')
            .eq('id', examId)
            .single();

        if (examError) throw examError;

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
                .select('*')
                .eq('userID', userId)
                .order('submitted_at', { ascending: false });

            if (submissionsError) throw submissionsError;

            // Get exam details for each submission
            const submissionsWithExamDetails = await Promise.all(
                submissions.map(async (submission) => {
                    try {
                        const { data: exam, error: examError } = await supabase
                            .from('exams')
                            .select('id, title, description, category, created_at')
                            .eq('id', submission.examID)
                            .single();

                        return {
                            id: submission.id,
                            exam: exam || null,
                            obtainedScore: submission.obtainedScore,
                            totalScore: submission.totalScore,
                            results: submission.results,
                            submitted_at: submission.submitted_at
                        };
                    } catch (examError) {
                        console.error(`Error fetching exam for submission ${submission.id}:`, examError);
                        return {
                            id: submission.id,
                            exam: null,
                            obtainedScore: submission.obtainedScore,
                            totalScore: submission.totalScore,
                            results: submission.results,
                            submitted_at: submission.submitted_at
                        };
                    }
                })
            );

            return submissionsWithExamDetails;
        } catch (error) {
            console.error('Error in getUserSubmissions:', error);
            throw error;
        }
    }
}

export default new ExamService(); 