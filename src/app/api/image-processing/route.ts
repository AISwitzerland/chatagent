import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Verarbeite basierend auf dem Dateityp
    if (file.type === 'application/pdf') {
      // PDF verarbeiten
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();

      return NextResponse.json({
        success: true,
        metadata: {
          format: 'pdf',
          pageCount: pages.length,
          quality: 1.0,
        },
        processedImage: buffer.toString('base64'),
      });
    } else if (file.type.startsWith('image/')) {
      // Bild verarbeiten
      const metadata = await sharp(buffer).metadata();

      const processedImage = await sharp(buffer)
        .resize({
          width: metadata.width && metadata.width > 2000 ? 2000 : metadata.width,
          height: metadata.height && metadata.height > 2000 ? 2000 : metadata.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .normalize()
        .sharpen()
        .gamma(1.1)
        .toBuffer();

      const processedMetadata = await sharp(processedImage).metadata();

      return NextResponse.json({
        success: true,
        metadata: {
          format: processedMetadata.format || 'unknown',
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          quality: 1.0,
          enhancementApplied: true,
        },
        processedImage: processedImage.toString('base64'),
      });
    } else {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Document processing failed' },
      { status: 500 }
    );
  }
}
