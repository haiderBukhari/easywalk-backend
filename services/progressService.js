import supabase from "../config/supabaseClient.js";

class ProgressService {
    // Create a new progress entry
    async createProgress(userId, progressData) {
        try {
            const { progress_name, lessonId, examId, blogId } = progressData;

            // Check if progress already exists for the given IDs
            let query = supabase
                .from('progress')
                .select('*')
                .eq('user_id', userId);

            // A progress item should be tied to one entity. Prioritize lesson, then exam, then blog.
            if (lessonId) {
                query = query.eq('lessonId', lessonId);
            } else if (examId) {
                query = query.eq('examId', examId);
            } else if (blogId) {
                query = query.eq('blogId', blogId);
            }

            const { data: existingProgress, error: findError } = await query.maybeSingle();

            if (findError) {
                console.error('Error finding existing progress:', findError);
                throw findError;
            }

            if (existingProgress) {
                // Progress exists, update updated_at and progress_name
                const { data, error: updateError } = await supabase
                    .from('progress')
                    .update({
                        updated_at: new Date().toISOString(),
                        progress_name: progress_name
                    })
                    .eq('id', existingProgress.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating progress:', updateError);
                    throw updateError;
                }
                return data;
            }

            // Progress does not exist, create a new one
            const progressObject = {
                user_id: userId,
                progress_name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString() // Set updated_at on creation as well
            };

            // Add optional fields if they exist.
            if (lessonId) progressObject.lessonId = lessonId;
            if (examId) progressObject.examId = examId;
            if (blogId) progressObject.blogId = blogId;

            const { data, error: insertError } = await supabase
                .from('progress')
                .insert([progressObject])
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting progress:', insertError);
                throw insertError;
            }
            return data;
        } catch (error) {
            console.error('Error in createProgress:', error);
            throw error;
        }
    }

    // Get all progress entries for a user
    async getUserProgress(userId) {
        try {
            const { data, error } = await supabase
                .from('progress')
                .select(`
                    *,
                    lesson:lessonId (
                        id,
                        title
                    ),
                    exam:examId (
                        id,
                        title
                    ),
                    blog:blogId (
                        id,
                        title
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in getUserProgress:', error);
            throw error;
        }
    }

    // Delete a progress entry
    async deleteProgress(progressId, userId) {
        try {
            const { data, error } = await supabase
                .from('progress')
                .delete()
                .eq('id', progressId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in deleteProgress:', error);
            throw error;
        }
    }

    // Get detailed progress information
    async getDetailedProgress(userId, timeFrame) {
        try {
            let startDate;
            const endDate = new Date();
            
            // Calculate start date based on timeFrame
            if (timeFrame === 'week') {
                startDate = new Date();
                startDate.setDate(endDate.getDate() - 7);
            } else if (timeFrame === 'month') {
                startDate = new Date();
                startDate.setMonth(endDate.getMonth() - 1);
            } else {
                throw new Error('Invalid timeFrame. Use "week" or "month"');
            }

            // Get all progress entries for the user within the time frame
            const { data: progressEntries, error: progressError } = await supabase
                .from('progress')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false });

            if (progressError) throw progressError;

            const lessonIds = [...new Set(progressEntries.filter(entry => entry.lessonId).map(entry => entry.lessonId))];
            const examIds = [...new Set(progressEntries.filter(entry => entry.examId).map(entry => entry.examId))];
            const blogIds = [...new Set(progressEntries.filter(entry => entry.blogId).map(entry => entry.blogId))];

            // Fetch lessons data
            let lessonsData = {};
            if (lessonIds.length > 0) {
                const { data: lessons, error: lessonsError } = await supabase
                    .from('lessons')
                    .select('id, title, description, video_link, category')
                    .in('id', lessonIds);
                
                if (lessonsError) throw lessonsError;
                lessonsData = lessons.reduce((acc, lesson) => {
                    acc[lesson.id] = lesson;
                    return acc;
                }, {});
            }

            // Fetch exams data
            let examsData = {};
            if (examIds.length > 0) {
                const { data: exams, error: examsError } = await supabase
                    .from('exams')
                    .select('id, title, description, category, questions')
                    .in('id', examIds);
                
                if (examsError) throw examsError;
                examsData = exams.reduce((acc, exam) => {
                    acc[exam.id] = exam;
                    return acc;
                }, {});
            }

            // Fetch blogs data
            let blogsData = {};
            if (blogIds.length > 0) {
                const { data: blogs, error: blogsError } = await supabase
                    .from('blogs')
                    .select('id, title, content, status')
                    .in('id', blogIds);
                
                if (blogsError) throw blogsError;
                blogsData = blogs.reduce((acc, blog) => {
                    acc[blog.id] = blog;
                    return acc;
                }, {});
            }

            // Initialize activity counts
            const activityCounts = {
                byDate: {},
                byDay: {},
                byActivity: {
                    lessons: 0,
                    exams: 0,
                    blogs: 0,
                    others: 0
                }
            };

            // Group progress by date
            const progressByDate = {};
            progressEntries.forEach(entry => {
                const date = new Date(entry.created_at).toISOString().split('T')[0];
                const day = new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long' });

                // Initialize date in activityCounts if not exists
                if (!activityCounts.byDate[date]) {
                    activityCounts.byDate[date] = {
                        lessons: 0,
                        exams: 0,
                        blogs: 0,
                        others: 0,
                        total: 0
                    };
                }

                // Initialize day in activityCounts if not exists
                if (!activityCounts.byDay[day]) {
                    activityCounts.byDay[day] = {
                        lessons: 0,
                        exams: 0,
                        blogs: 0,
                        others: 0,
                        total: 0
                    };
                }

                // Initialize progressByDate if not exists
                if (!progressByDate[date]) {
                    progressByDate[date] = {
                        date,
                        count: 0,
                        lessons: [],
                        exams: [],
                        blogs: [],
                        others: []
                    };
                }
                progressByDate[date].count++;

                // Categorize the entry and update counts
                if (entry.lessonId && lessonsData[entry.lessonId]) {
                    progressByDate[date].lessons.push({
                        id: entry.id,
                        progress_name: entry.progress_name,
                        created_at: entry.created_at,
                        lesson: lessonsData[entry.lessonId]
                    });
                    activityCounts.byDate[date].lessons++;
                    activityCounts.byDay[day].lessons++;
                    activityCounts.byActivity.lessons++;
                } else if (entry.examId && examsData[entry.examId]) {
                    progressByDate[date].exams.push({
                        id: entry.id,
                        progress_name: entry.progress_name,
                        created_at: entry.created_at,
                        exam: examsData[entry.examId]
                    });
                    activityCounts.byDate[date].exams++;
                    activityCounts.byDay[day].exams++;
                    activityCounts.byActivity.exams++;
                } else if (entry.blogId && blogsData[entry.blogId]) {
                    progressByDate[date].blogs.push({
                        id: entry.id,
                        progress_name: entry.progress_name,
                        created_at: entry.created_at,
                        blog: blogsData[entry.blogId]
                    });
                    activityCounts.byDate[date].blogs++;
                    activityCounts.byDay[day].blogs++;
                    activityCounts.byActivity.blogs++;
                } else {
                    progressByDate[date].others.push({
                        id: entry.id,
                        progress_name: entry.progress_name,
                        created_at: entry.created_at
                    });
                    activityCounts.byDate[date].others++;
                    activityCounts.byDay[day].others++;
                    activityCounts.byActivity.others++;
                }

                // Update total counts
                activityCounts.byDate[date].total++;
                activityCounts.byDay[day].total++;
            });

            // Convert to array and sort by date
            const progressArray = Object.values(progressByDate).sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );

            // Calculate total counts
            const totalCounts = {
                lessons: progressEntries.filter(entry => entry.lessonId).length,
                exams: progressEntries.filter(entry => entry.examId).length,
                blogs: progressEntries.filter(entry => entry.blogId).length,
                others: progressEntries.filter(entry => !entry.lessonId && !entry.examId && !entry.blogId).length
            };

            return {
                timeFrame,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalCounts,
                activityCounts,
                progressByDate: progressArray
            };
        } catch (error) {
            console.error('Error in getDetailedProgress:', error);
            throw error;
        }
    }
}

export default new ProgressService(); 