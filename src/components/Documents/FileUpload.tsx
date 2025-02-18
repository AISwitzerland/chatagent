'use client';

import React, { useCallback, useState } from 'react';
import { ValidationError } from '../../types/utils';
import LoadingSpinner from '../ui/LoadingSpinner';

export interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  allowedTypes: string[];
  maxSize: number;
  disabled?: boolean;
  className?: string;
  documentType?: string;
}

export default function FileUpload({
  onUpload,
  allowedTypes,
  maxSize,
  disabled = false,
  className = '',
  documentType = 'default'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = useCallback((file: File) => {
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError(
        'Nicht unterstützter Dateityp',
        'file',
        'INVALID_FILE_TYPE'
      );
    }

    if (file.size > maxSize) {
      throw new ValidationError(
        'Datei ist zu groß',
        'file',
        'FILE_TOO_LARGE'
      );
    }
  }, [allowedTypes, maxSize]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (!file) return;

    try {
      validateFile(file);
      await onUpload(file);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Die Fehlerbehandlung wird von der übergeordneten Komponente übernommen
        throw error;
      }
      throw new Error('Fehler beim Datei-Upload');
    }
  }, [disabled, onUpload, validateFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFile(file);
      await onUpload(file);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Die Fehlerbehandlung wird von der übergeordneten Komponente übernommen
        throw error;
      }
      throw new Error('Fehler beim Datei-Upload');
    } finally {
      // Reset input
      e.target.value = '';
    }
  }, [disabled, onUpload, validateFile]);

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
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      aria-label="Datei hochladen"
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        disabled={disabled}
        aria-label="Datei hochladen"
        id={`fileInput-${documentType}`}
      />
      <div className="space-y-1 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-sm text-gray-600">
          <label
            htmlFor={`fileInput-${documentType}`}
            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <span>Datei hochladen</span>
          </label>
          <p className="pl-1">oder hierher ziehen</p>
        </div>
        <p className="text-xs text-gray-500">
          {allowedTypes.map(type => type.split('/')[1]).join(', ')} bis zu {(maxSize / (1024 * 1024)).toFixed(0)} MB
        </p>
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