declare module 'pdf2pic' {
  export interface ConvertOptions {
    density?: number;
    format?: string;
    width?: number;
    height?: number;
    saveFilename?: string;
    savePath?: string;
  }

  export interface ConvertResult {
    name: string;
    size: number;
    path: string;
    page: number;
  }

  export type Convert = (pageNumber: number) => Promise<ConvertResult>;

  export function fromBuffer(buffer: Buffer, options?: ConvertOptions): Convert;
  export function fromPath(pdfPath: string, options?: ConvertOptions): Convert;
} 