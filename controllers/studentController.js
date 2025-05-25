import studentService from '../services/studentService.js';

const enrollInCourse = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId } = req.body;
        const result = await studentService.enrollInCourse(studentId, courseId);
        res.status(200).json({
            message: "Course enrolled successfully",
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const setReminder = async (req, res) => {
    try {
        const studentId = req.user.id; // Assuming verifyToken middleware adds user info to req
        const { courseId, remindTime, remindDate, examPlane, level, duration, targetScore } = req.body;
        const result = await studentService.setReminder(studentId, courseId, remindTime, remindDate, examPlane, level, duration, targetScore);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRecentEnrolledCourse = async (req, res) => {
    try {
        const studentId = req.user.id; // Assuming verifyToken middleware adds user info to req
        const result = await studentService.getRecentEnrolledCourse(studentId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTopRatedBlogs = async (req, res) => {
    try {
        const { courseId } = req.query;
        const result = await studentService.getTopRatedBlogs(courseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllBlogs = async (req, res) => {
    try {
        const { courseId } = req.query; // Assuming courseId is passed as a query parameter
        const result = await studentService.getAllBlogs(courseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllWinningQuestions = async (req, res) => {
    try {
        const questions = await studentService.getAllWinningQuestions();

        res.status(200).json({
            success: true,
            message: 'Winning questions fetched successfully',
            data: questions
        });
    } catch (error) {
        console.error('Error fetching winning questions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching winning questions',
            error: error.message
        });
    }
};

const getStudentProgress = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId } = req.query;
        const result = await studentService.getStudentProgress(studentId, courseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCourseQuestionsByCourseId = async (req, res) => {
    try {
        const { courseId } = req.query; // Assuming courseId is passed as a query parameter
        const result = await studentService.getCourseQuestionsByCourseId(courseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getQuestionsWithTeacherDetails = async (req, res) => {
    try {
        const result = await studentService.getQuestionsWithTeacherDetails();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getExamsWithTeacherDetails = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId } = req.query;

        const result = await studentService.getExamsWithTeacherDetails(studentId, courseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPublishedExamsByCourseId = async (req, res) => {
    try {
        const { courseId } = req.query;
        const studentId = req.user.id;
        const result = await studentService.getPublishedExamsByCourseId(courseId, studentId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPublishedLessons = async (req, res) => {
    const { courseId } = req.query;
    const studentId = req.user.id;
    try {
        const lessons = await studentService.getPublishedLessonsByCourseId(courseId, studentId);
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLessonsWithDetails = async (req, res) => {
    const { courseId } = req.query;
    const studentId = req.user.id;
    try {
        const lessons = await studentService.getLessonsWithTeacherDetails(courseId, studentId);
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getTeacherProfile = async (req, res) => {
    const { user_id } = req.query;
    try {
        const profile = await studentService.getTeacherProfile(user_id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rateExam = async (req, res) => {
    const { examId, rating } = req.body;
    try {
        const result = await studentService.rateExam(examId, rating);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rateLesson = async (req, res) => {
    const { lessonId, rating } = req.body;
    try {
        const result = await studentService.rateLesson(lessonId, rating);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rateBlog = async (req, res) => {
    const { blogId, rating } = req.body;
    try {
        const result = await studentService.rateBlog(blogId, rating);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createSupportRequest = async (req, res) => {
    const { title, issue } = req.body;
    try {
        const result = await studentService.createSupportRequest(title, issue);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSupportRequests = async (req, res) => {
    try {
        const result = await studentService.getSupportRequests();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
    getPublishedLessons,
    getLessonsWithDetails,
    getTeacherProfile,
    rateExam,
    rateLesson,
    rateBlog,
    createSupportRequest,
    getSupportRequests,
}; 