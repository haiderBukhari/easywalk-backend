import supabase from "../config/supabaseClient.js";
import courseService from "./courseService.js";

class LessonService {
    // Create a new lesson
    async createLesson(lessonData) {
        const { course_id, title, description, video_link, arrangement_no, category, user_id } = lessonData;
        const { data, error } = await supabase
            .from('lessons')
            .insert([{
                course_id,
                title,
                description,
                video_link,
                arrangement_no,
                category,
                user_id
            }])
            .select()
            .single();

        if (error) throw error;

        // Update course lesson count
        await courseService.updateLessonCount(course_id);

        return data;
    }

    // Get all lessons for a course
    async getLessonsByCourseId(courseId, category) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .eq('category', category)
            .order('arrangement_no', { ascending: true });

        if (error) throw error;
        return data;
    }

    // Get lesson by ID
    async getLessonById(id) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // Update lesson
    async updateLesson(id, lessonData) {
        const { title, description, video_link, arrangement_no } = lessonData;
        const { data, error } = await supabase
            .from('lessons')
            .update({
                title,
                description,
                video_link,
                arrangement_no,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete lesson
    async deleteLesson(id) {

        const lesson = await this.getLessonById(id);
        if (!lesson) return null;

        const { data, error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            await courseService.updateLessonCount(lesson.course_id);
        }

        return data;
    }

    // Reorder lessons
    async reorderLessons(courseId, lessonIds) {
        if (lessonIds.length !== 2) {
            throw new Error("Exactly 2 lesson IDs must be provided to swap");
        }

        const [id1, id2] = lessonIds;

        // Fetch both lessons and their arrangement_no
        const { data: lessons, error: fetchError } = await supabase
            .from('lessons')
            .select('id, arrangement_no')
            .in('id', [id1, id2])
            .eq('course_id', courseId);

        if (fetchError) throw fetchError;
        if (lessons.length !== 2) throw new Error("One or both lessons not found");

        const lesson1 = lessons.find(l => l.id === id1);
        const lesson2 = lessons.find(l => l.id === id2);

        // Swap arrangement_no
        const { error: error1 } = await supabase
            .from('lessons')
            .update({ arrangement_no: lesson2.arrangement_no })
            .eq('id', id1)
            .eq('course_id', courseId);

        if (error1) throw error1;

        const { error: error2 } = await supabase
            .from('lessons')
            .update({ arrangement_no: lesson1.arrangement_no })
            .eq('id', id2)
            .eq('course_id', courseId);

        if (error2) throw error2;

        return { success: true, message: "Arrangement numbers swapped successfully" };
    }

    // Get all lessons by teacher ID
    async getLessonsByTeacherId(teacherId) {
        try {
            const { data: lessons, error } = await supabase
                .from('lessons')
                .select(`
                    id,
                    title,
                    description,
                    video_link,
                    category,
                    created_at,
                    updated_at,
                    course_id,
                    courses (
                        id,
                        title
                    )
                `)
                .eq('user_id', teacherId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);

            // Transform the data to include course information
            const formattedLessons = lessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                video_link: lesson.video_link,
                category: lesson.category,
                created_at: lesson.created_at,
                updated_at: lesson.updated_at,
                course_id: lesson.course_id,
                course_title: lesson.courses?.title || 'No Course'
            }));

            return formattedLessons;
        } catch (error) {
            throw new Error(`Error fetching teacher lessons: ${error.message}`);
        }
    }
}

export default new LessonService(); 