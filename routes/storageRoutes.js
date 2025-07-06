import express from 'express';
import multer from 'multer';
import storageController from '../controllers/storageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files at once
    },
    fileFilter: (req, file, cb) => {
        // Allow video, audio, and image files
        if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video, audio, and image files are allowed'), false);
        }
    }
});

// File upload routes
router.post('/upload', upload.single('file'), storageController.uploadFile);
router.post('/upload/multiple', upload.array('files', 10), storageController.uploadMultipleFiles);

export default router; 