import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  // Read all .env files content
  const envFiles = fs.readdirSync('.').filter(f => f.startsWith('.env'));
  const envContents: Record<string, string> = {};
  
  for (const file of envFiles) {
    try {
      envContents[file] = fs.readFileSync(file, 'utf-8');
    } catch (error) {
      envContents[file] = `Error reading file: ${error}`;
    }
  }

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    },
    openai: {
      keyExists: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7),
      keyLength: process.env.OPENAI_API_KEY?.length,
    },
    envFiles,
    envContents,
    processEnvKeys: Object.keys(process.env),
  });
} 