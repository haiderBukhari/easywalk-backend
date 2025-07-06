import storageService from '../services/storageService.js';

class StorageController {
    // Upload a file
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            const { folder = 'general' } = req.body;
            const metadata = {
                userId: req.user?.id || null,
                userRole: req.user?.role || null,
                ...req.body
            };

            // Validate file type
            if (!storageService.validateFileType(req.file.mimetype, ['video', 'audio', 'image'])) {
                return res.status(400).json({
                    success: false,
                    message: 'Only video, audio, and image files are allowed'
                });
            }

            // Validate file size (100MB limit)
            if (!storageService.validateFileSize(req.file.size, 100 * 1024 * 1024)) {
                return res.status(400).json({
                    success: false,
                    message: 'File size must be less than 100MB'
                });
            }

            const fileData = await storageService.uploadFile(req.file, folder, metadata);

            res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                data: fileData
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading file',
                error: error.message
            });
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files provided'
                });
            }

            const { folder = 'general' } = req.body;
            const uploadedFiles = [];

            for (const file of req.files) {
                try {
                    // Validate file type
                    if (!storageService.validateFileType(file.mimetype, ['video', 'audio', 'image'])) {
                        uploadedFiles.push({
                            originalName: file.originalname,
                            success: false,
                            error: 'Only video, audio, and image files are allowed'
                        });
                        continue;
                    }

                    // Validate file size
                    if (!storageService.validateFileSize(file.size, 100 * 1024 * 1024)) {
                        uploadedFiles.push({
                            originalName: file.originalname,
                            success: false,
                            error: 'File size must be less than 100MB'
                        });
                        continue;
                    }

                    const metadata = {
                        userId: req.user?.id || null,
                        userRole: req.user?.role || null
                    };

                    const fileData = await storageService.uploadFile(file, folder, metadata);
                    uploadedFiles.push({
                        originalName: file.originalname,
                        success: true,
                        data: fileData
                    });
                } catch (error) {
                    uploadedFiles.push({
                        originalName: file.originalname,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successCount = uploadedFiles.filter(f => f.success).length;
            const failureCount = uploadedFiles.filter(f => !f.success).length;

            res.status(200).json({
                success: true,
                message: `Uploaded ${successCount} files successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                data: uploadedFiles
            });
        } catch (error) {
            console.error('Error uploading multiple files:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading files',
                error: error.message
            });
        }
    }
}

export default new StorageController(); 