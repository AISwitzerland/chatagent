import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { gptVisionProcessor } from '../processors/gptVisionProcessor.js';
import { imagePreprocessor } from '../utils/imagePreprocessor.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 5960;
// Middleware
app.use(cors());
app.use(express.json());
// Multer Konfiguration für Datei-Upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB Limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Nicht unterstütztes Dateiformat'));
        }
    }
});
// Startseite mit Upload-Formular
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>OCR Test Interface</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .upload-form { border: 2px dashed #ccc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .response { background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 20px; }
          .warning { color: #856404; background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .error { color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>OCR Test Interface</h1>
        <div class="upload-form">
          <h2>Dokument hochladen</h2>
          <form id="uploadForm">
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required>
            <button type="submit">Hochladen und Analysieren</button>
          </form>
        </div>
        <div id="response" class="response" style="display: none;"></div>

        <script>
          document.getElementById('uploadForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const responseDiv = document.getElementById('response');
            responseDiv.style.display = 'block';
            responseDiv.innerHTML = 'Verarbeite Dokument... Dies kann einige Sekunden dauern.';
            
            try {
              const response = await fetch('/test/upload', {
                method: 'POST',
                body: formData
              });
              const result = await response.json();
              
              let html = '<h3>Verarbeitungsergebnis:</h3>';
              
              if (result.warnings && result.warnings.length > 0) {
                html += '<div class="warning"><strong>Warnungen:</strong><ul>';
                result.warnings.forEach(warning => {
                  html += '<li>' + warning + '</li>';
                });
                html += '</ul></div>';
              }
              
              if (result.error) {
                html += '<div class="error"><strong>Fehler:</strong> ' + result.error + '</div>';
              } else {
                html += '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
              }
              
              responseDiv.innerHTML = html;
            } catch (error) {
              responseDiv.innerHTML = '<div class="error">Fehler: ' + error.message + '</div>';
            }
          };
        </script>
      </body>
    </html>
  `);
});
// Test-Endpoint für Datei-Upload mit OCR
app.post('/test/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('Keine Datei hochgeladen');
        }
        const fileBuffer = req.file.buffer;
        const fileType = await fileTypeFromBuffer(fileBuffer);
        // Logging für Debugging
        console.log('Datei empfangen:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            detectedType: fileType
        });
        // Qualitätsprüfung
        const qualityCheck = await imagePreprocessor.checkImageQuality(fileBuffer);
        // Bildvorverarbeitung
        const processedBuffer = await imagePreprocessor.preprocessImage(fileBuffer, req.file.mimetype);
        // Konvertierung zu Base64
        const base64Image = await imagePreprocessor.convertToBase64(processedBuffer);
        // OCR mit GPT-Vision
        const ocrResult = await gptVisionProcessor.processImage(base64Image, req.file.originalname);
        // Antwort zusammenstellen
        res.json({
            message: 'Dokument erfolgreich verarbeitet',
            fileInfo: {
                name: req.file.originalname,
                type: fileType,
                size: req.file.size
            },
            qualityCheck,
            ocrResult: {
                text: ocrResult.text,
                confidence: ocrResult.confidence,
                processingTime: ocrResult.processingTime,
                method: ocrResult.method,
                language: ocrResult.language
            }
        });
    }
    catch (error) {
        console.error('Verarbeitungsfehler:', error);
        res.status(400).json({
            error: error.message || 'Fehler bei der Dokumentenverarbeitung',
            details: error.details || {}
        });
    }
});
// Basis-Endpoint für Gesundheitscheck
app.get('/health', (req, res) => {
    res.json({ status: 'OCR Test Server läuft' });
});
app.listen(port, () => {
    console.log(`OCR Test Server läuft auf http://localhost:${port}`);
    console.log('Endpoints:');
    console.log('- GET  /         - Test Interface');
    console.log('- GET  /health   - Server Status');
    console.log('- POST /test/upload - Datei-Upload Test');
});
