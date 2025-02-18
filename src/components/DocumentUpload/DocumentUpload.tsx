'use client';

import { useState, useCallback } from 'react';
import { UserContactData } from '../../types';
import FileUpload from '../Documents/FileUpload';
import { ValidationError, isErrorWithMessage } from '../../types/utils';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../../types/constants';

interface DocumentUploadProps {
  userData: UserContactData;
  onUploadComplete?: () => void;
  onUploadError?: (error: {
    code: string;
    message: string;
    field?: string;
  }) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: {
    code: string;
    message: string;
    field?: string;
  } | null;
}

interface UploadError {
  code: string;
  message: string;
  field?: string;
}

export default function DocumentUpload({
  userData,
  onUploadComplete,
  onUploadError
}: DocumentUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });

  const handleUpload = useCallback(async (file: File): Promise<void> => {
    if (uploadState.isUploading) return;
    
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      progress: 0
    }));
    
    try {
      // FormData für den Datei-Upload erstellen
      const formData = new FormData();
      formData.append('file', file);

      // Fortschritt auf 25% setzen - Start der Verarbeitung
      setUploadState(prev => ({ ...prev, progress: 25 }));

      // Bild auf dem Server verarbeiten
      const processResponse = await fetch('/api/image-processing', {
        method: 'POST',
        body: formData
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new ValidationError(
          errorData.message || 'Bildverarbeitung fehlgeschlagen',
          'processing',
          errorData.code || 'PROCESSING_ERROR'
        );
      }

      const processResult = await processResponse.json();

      // Fortschritt auf 50% setzen - Bildverarbeitung abgeschlossen
      setUploadState(prev => ({ ...prev, progress: 50 }));

      // Dokument mit verarbeitetem Bild erstellen
      const documentData = {
        file: processResult.processedImage,
        fileName: file.name,
        fileType: file.type,
        metadata: {
          ...processResult.metadata,
          originalSize: file.size,
          uploadedBy: userData.email,
          uploadTimestamp: new Date().toISOString()
        }
      };

      // Fortschritt auf 75% setzen - Start des Dokument-Uploads
      setUploadState(prev => ({ ...prev, progress: 75 }));

      // An Dokumenten-Service hochladen
      const uploadResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData)
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new ValidationError(
          errorData.message || 'Dokument-Upload fehlgeschlagen',
          'upload',
          errorData.code || 'UPLOAD_ERROR'
        );
      }

      const result = await uploadResponse.json();
      
      if (!result.success) {
        throw new ValidationError(
          result.error?.message || 'Upload fehlgeschlagen',
          'upload',
          result.error?.code || 'UPLOAD_ERROR'
        );
      }

      // Fortschritt auf 100% setzen - Upload abgeschlossen
      setUploadState(prev => ({ ...prev, progress: 100 }));

      onUploadComplete?.();
    } catch (error) {
      let errorInfo: UploadError = {
        code: 'UNKNOWN_ERROR',
        message: 'Ein unerwarteter Fehler ist aufgetreten'
      };

      if (error instanceof ValidationError) {
        errorInfo = {
          code: error.code,
          message: error.message,
          field: error.field
        };
      } else if (isErrorWithMessage(error)) {
        errorInfo = {
          code: 'UPLOAD_ERROR',
          message: error.message
        };
      }

      console.error('Upload-Fehler:', errorInfo);
      
      setUploadState(prev => ({
        ...prev,
        error: errorInfo
      }));

      onUploadError?.(errorInfo);
    } finally {
      setUploadState(prev => ({
        ...prev,
        isUploading: false
      }));
    }
  }, [userData.email, onUploadComplete, onUploadError, uploadState.isUploading]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        <FileUpload
          onUpload={handleUpload}
          allowedTypes={ALLOWED_FILE_TYPES.all}
          maxSize={MAX_FILE_SIZE}
          disabled={uploadState.isUploading}
          documentType="upload"
        />

        {/* Fortschrittsanzeige */}
        {uploadState.isUploading && (
          <div 
            className="w-full bg-gray-200 rounded-full h-2.5"
            role="progressbar"
            aria-valuenow={uploadState.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload-Fortschritt"
          >
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
        )}

        {/* Fehleranzeige */}
        {uploadState.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Fehler: </strong>
            <span className="block sm:inline">{uploadState.error.message}</span>
          </div>
        )}
      </div>
    </div>
  );
} 