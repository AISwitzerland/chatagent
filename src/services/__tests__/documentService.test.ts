import { DocumentService } from '../documentService';
import { supabase } from '../supabaseClient';

describe('DocumentService', () => {
  let documentService: DocumentService;

  beforeEach(() => {
    documentService = DocumentService.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = DocumentService.getInstance();
    const instance2 = DocumentService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should upload a document successfully', async () => {
    // Mock File
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock user data
    const userData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const result = await documentService.uploadDocument(file, userData);

    expect(result.success).toBe(true);
    expect(result.documentId).toBeDefined();
    expect(result.path).toBeDefined();

    // Überprüfe, ob der Eintrag in der Datenbank existiert
    if (result.documentId) {
      const document = await documentService.getDocument(result.documentId);
      expect(document).toBeDefined();
      expect(document?.file_name).toBe('test.pdf');
      expect(document?.status).toBe('pending');
    }
  });

  it('should handle upload errors gracefully', async () => {
    // Mock File mit ungültigem Typ
    const file = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const result = await documentService.uploadDocument(file, userData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // Aufräumen nach den Tests
  afterAll(async () => {
    const { data: documents } = await supabase
      .from('documents')
      .select('file_path')
      .eq('file_name', 'test.pdf');

    if (documents) {
      // Lösche Dateien aus dem Storage
      for (const doc of documents) {
        await supabase.storage.from('documents').remove([doc.file_path]);
      }

      // Lösche Datenbankeinträge
      await supabase
        .from('documents')
        .delete()
        .eq('file_name', 'test.pdf');
    }
  });
}); 