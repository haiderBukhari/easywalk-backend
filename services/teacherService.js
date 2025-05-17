import supabase from "../config/supabaseClient.js";

const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // Set to same day of previous week
    startOfWeek.setDate(today.getDate() + 1 - 7);
    const dates = [];

    // Get dates from same day of previous week up to today
    for (let i = 0; i <= 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
};

const getMonthDates = () => {
    const today = new Date();
    const queryEndDate = new Date(today); // Keep original date for query
    const displayEndDate = new Date(today);
    displayEndDate.setDate(today.getDate() + 1);
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dates = [];
    
    // Get dates from same day of previous month to today
    const startDate = new Date(currentYear, currentMonth - 1, today.getDate());
    
    while (startDate <= displayEndDate) {
        dates.push(startDate.toISOString().split('T')[0]);
        startDate.setDate(startDate.getDate() + 1);
    }
    
    return { dates, queryEndDate: queryEndDate.toISOString().split('T')[0] };
};

const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
};

export const getTeacherPerformance = async (teacherId, timeRange) => {
    const dateInfo = timeRange === 'week' ? { dates: getWeekDates() } : getMonthDates();
    const dates = dateInfo.dates;
    const performance = {};

    // Get lesson creation activities
    const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('created_at')
        .eq('user_id', teacherId)
        .gte('created_at', dates[0])
        .lte('created_at', timeRange === 'week' ? dates[dates.length - 1] : dateInfo.queryEndDate);

    if (lessonsError) throw new Error(lessonsError.message);

    // Get blog activities
    const { data: blogs, error: blogsError } = await supabase
        .from('blogs')
        .select('created_at, updated_at')
        .eq('user_id', teacherId)
        .gte('created_at', dates[0])
        .lte('created_at', timeRange === 'week' ? dates[dates.length - 1] : dateInfo.queryEndDate);

    if (blogsError) throw new Error(blogsError.message);

    // Get exam activities
    const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('created_at, updated_at')
        .eq('user_id', teacherId)
        .gte('created_at', dates[0])
        .lte('created_at', timeRange === 'week' ? dates[dates.length - 1] : dateInfo.queryEndDate);

    if (examsError) throw new Error(examsError.message);

    // Initialize performance object with actual dates
    dates.forEach(date => {
        if (timeRange === 'week') {
            const dayName = getDayName(date);
            if (!performance[dayName]) {
                performance[dayName] = 0;
            }
        } else {
            performance[date] = 0;
        }
    });

    // Process lesson activities
    lessons?.forEach(lesson => {
        const date = lesson.created_at.split('T')[0];
        if (timeRange === 'week') {
            performance[getDayName(date)]++;
        } else {
            performance[date]++;
        }
    });

    // Process blog activities
    blogs?.forEach(blog => {
        const createdDate = blog.created_at.split('T')[0];
        const updatedDate = blog.updated_at.split('T')[0];
        
        if (timeRange === 'week') {
            performance[getDayName(createdDate)]++;
            if (updatedDate !== createdDate) {
                performance[getDayName(updatedDate)]++;
            }
        } else {
            performance[createdDate]++;
            if (updatedDate !== createdDate) {
                performance[updatedDate]++;
            }
        }
    });

    // Process exam activities
    exams?.forEach(exam => {
        const createdDate = exam.created_at.split('T')[0];
        const updatedDate = exam.updated_at.split('T')[0];
        
        if (timeRange === 'week') {
            performance[getDayName(createdDate)]++;
            if (updatedDate !== createdDate) {
                performance[getDayName(updatedDate)]++;
            }
        } else {
            performance[createdDate]++;
            if (updatedDate !== createdDate) {
                performance[updatedDate]++;
            }
        }
    });

    return performance;
}; 