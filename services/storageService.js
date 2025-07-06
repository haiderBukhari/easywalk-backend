import supabase from "../config/supabaseClient.js";

class StorageService {
    // Upload a file to Supabase storage
    async uploadFile(file, folder = 'general', metadata = {}) {
        try {
            // Validate file
            if (!file || !file.buffer || !file.originalname) {
                throw new Error('Invalid file provided');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${timestamp}_${randomString}.${fileExtension}`;
            const filePath = `${folder}/${fileName}`;

            // Upload file to Supabase storage
            const { data, error } = await supabase.storage
                .from('storage')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('storage')
                .getPublicUrl(filePath);

            return {
                success: true,
                file_name: file.originalname,
                file_path: filePath,
                file_size: file.size,
                mime_type: file.mimetype,
                file_type: this.getFileType(file.mimetype),
                public_url: urlData.publicUrl,
                folder: folder,
                metadata: metadata
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    // Get file type from MIME type
    getFileType(mimeType) {
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('image/')) return 'image';
        return 'document';
    }

    // Delete file by path
    async deleteFileByPath(filePath) {
        try {
            const { error } = await supabase.storage
                .from('storage')
                .remove([filePath]);

            if (error) throw error;

            return { success: true, message: 'File deleted successfully' };
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // Get file download URL by path
    async getDownloadUrlByPath(filePath) {
        try {
            const { data, error } = await supabase.storage
                .from('storage')
                .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (error) throw error;

            return {
                download_url: data.signedUrl
            };
        } catch (error) {
            console.error('Error getting download URL:', error);
            throw error;
        }
    }

    // Validate file type
    validateFileType(mimeType, allowedTypes = ['video', 'audio', 'image']) {
        const fileType = this.getFileType(mimeType);
        return allowedTypes.includes(fileType);
    }

    // Validate file size
    validateFileSize(fileSize, maxSize = 100 * 1024 * 1024) { // 100MB default
        return fileSize <= maxSize;
    }
}

export default new StorageService(); 