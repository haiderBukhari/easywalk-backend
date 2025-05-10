import supabase from "../config/supabaseClient.js";
import courseService from "./courseService.js";

class LessonService {
    // Create a new lesson
    async createLesson(lessonData) {
        const { course_id, title, description, video_link, arrangement_no } = lessonData;
        const { data, error } = await supabase
            .from('lessons')
            .insert([{
                course_id,
                title,
                description,
                video_link,
                arrangement_no
            }])
            .select()
            .single();

        if (error) throw error;

        // Update course lesson count
        await courseService.updateLessonCount(course_id);

        return data;
    }

    // Get all lessons for a course
    async getLessonsByCourseId(courseId) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
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
        // First get the course_id before deleting
        const lesson = await this.getLessonById(id);
        if (!lesson) return null;

        const { data, error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update course lesson count
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
}

export default new LessonService(); 