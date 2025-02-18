import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DocumentUpload from '../DocumentUpload';
import { MAX_FILE_SIZE } from '../../../types/constants';

describe('DocumentUpload', () => {
  const mockUserData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+41791234567',
  };

  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const mockLargeFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'large.pdf', {
    type: 'application/pdf',
  });
  const mockInvalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders upload component correctly', () => {
    render(<DocumentUpload userData={mockUserData} />);
    expect(screen.getByRole('button', { name: /Datei hochladen/i })).toBeInTheDocument();
    expect(screen.getByText(/oder hierher ziehen/i)).toBeInTheDocument();
  });

  it('handles successful file upload', async () => {
    const onUploadComplete = jest.fn();
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              processedImage: 'base64...',
              metadata: { width: 800, height: 600 },
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              documentId: '123',
            }),
        })
      );

    render(<DocumentUpload userData={mockUserData} onUploadComplete={onUploadComplete} />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      await fireEvent.change(input, { target: { files: [mockFile] } });
    });

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles file size validation error', async () => {
    const onUploadError = jest.fn();
    render(<DocumentUpload userData={mockUserData} onUploadError={onUploadError} />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      await fireEvent.change(input, { target: { files: [mockLargeFile] } });
    });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FILE_TOO_LARGE',
          message: expect.any(String),
        })
      );
    });

    expect(screen.getByText(/Fehler/i)).toBeInTheDocument();
  });

  it('handles file type validation error', async () => {
    const onUploadError = jest.fn();
    render(<DocumentUpload userData={mockUserData} onUploadError={onUploadError} />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      await fireEvent.change(input, { target: { files: [mockInvalidFile] } });
    });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_FILE_TYPE',
          message: expect.any(String),
        })
      );
    });

    expect(screen.getByText(/Fehler/i)).toBeInTheDocument();
  });

  it('handles server error during upload', async () => {
    const onUploadError = jest.fn();
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            message: 'Server Error',
            code: 'PROCESSING_ERROR',
          }),
      })
    );

    render(<DocumentUpload userData={mockUserData} onUploadError={onUploadError} />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      await fireEvent.change(input, { target: { files: [mockFile] } });
    });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PROCESSING_ERROR',
          message: expect.any(String),
        })
      );
    });

    expect(screen.getByText(/Fehler/i)).toBeInTheDocument();
  });

  it('shows upload progress', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      processedImage: 'base64...',
                      metadata: { width: 800, height: 600 },
                    }),
                }),
              100
            )
          )
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      documentId: '123',
                    }),
                }),
              100
            )
          )
      );

    render(<DocumentUpload userData={mockUserData} />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      await fireEvent.change(input, { target: { files: [mockFile] } });
    });

    // Prüfe, ob die Fortschrittsanzeige erscheint
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    // Warte auf den Abschluss des Uploads
    await waitFor(
      () => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('disables upload during processing', async () => {
    render(<DocumentUpload userData={mockUserData} />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      await fireEvent.change(input, { target: { files: [mockFile] } });
    });

    // Prüfe, ob der Upload-Button deaktiviert ist
    expect(input).toBeDisabled();

    // Warte auf den Abschluss des Uploads
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });
});
