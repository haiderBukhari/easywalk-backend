import jwt from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
configDotenv();
export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in authentication'
        });
    }
};

export const verifyTeacher = (req, res, next) => {

    if (!(req.user.role === 'teacher' || req.user.role === 'admin')) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only teachers can perform this action.'
        });
    }
    next();
};

export const verifySameUser = (req, res, next) => {
    const userIdFromToken = req.user && req.user.id;
    const userIdFromParams = req.params && req.params.id;
    if (!userIdFromToken || !userIdFromParams || userIdFromToken !== userIdFromParams) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only perform this action on your own account.'
        });
    }
    next();
}; 