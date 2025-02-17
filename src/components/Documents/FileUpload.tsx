'use client';

import { useState, useCallback } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  allowedTypes: string[];
  maxSize: number;
  documentType: string;
}

export default function FileUpload({
  onUpload,
  allowedTypes,
  maxSize,
  documentType
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Nur ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} Dateien sind erlaubt.`;
    }

    if (file.size > maxSize) {
      return `Die Datei darf nicht größer als ${Math.round(maxSize / 1024 / 1024)}MB sein.`;
    }

    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }, [allowedTypes, maxSize]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }, [allowedTypes, maxSize]);

  const handleUploadClick = useCallback(async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, isUploading, onUpload]);

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
          ${error ? 'border-red-500 bg-red-50' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id={`fileInput-${documentType}`}
          disabled={isUploading}
        />
        <label 
          htmlFor={`fileInput-${documentType}`} 
          className={`cursor-pointer ${isUploading ? 'cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-gray-600">Wird hochgeladen...</p>
            </div>
          ) : (
            <>
              <svg 
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} bis {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {selectedFile && !error && !isUploading && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Ausgewählte Datei: {selectedFile.name}
          </p>
          <button
            onClick={handleUploadClick}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
          >
            Hochladen
          </button>
        </div>
      )}
    </div>
  );
} 