'use client';

import { useState, useCallback } from 'react';
import { UserContactData } from '../../types';
import FileUpload from '../Documents/FileUpload';

interface DocumentUploadProps {
  userData: UserContactData;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

export default function DocumentUpload({
  userData,
  onUploadComplete,
  onUploadError
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Process image on server
      const processResponse = await fetch('/api/image-processing', {
        method: 'POST',
        body: formData
      });

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.message || 'Image processing failed');
      }

      const processResult = await processResponse.json();

      // Create document with processed image
      const documentData = {
        file: processResult.processedImage,
        fileName: file.name,
        fileType: file.type,
        metadata: {
          ...processResult.metadata,
          originalSize: file.size,
          uploadedBy: userData.email
        }
      };

      // Upload to document service
      const uploadResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData)
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Document upload failed');
      }

      const result = await uploadResponse.json();
      
      if (result.success) {
        onUploadComplete?.();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsUploading(false);
    }
  }, [userData, onUploadComplete, onUploadError]);

  return (
    <div className="w-full max-w-md mx-auto">
      <FileUpload
        onUpload={handleUpload}
        allowedTypes={['application/pdf', 'image/jpeg', 'image/png']}
        maxSize={5 * 1024 * 1024}
        documentType="other"
      />
    </div>
  );
} 