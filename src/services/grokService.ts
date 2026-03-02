import { AppSpecs, GeneratedApp } from '../types';

export async function generateWithGrok(
  specs: AppSpecs,
  onProgress?: (msg: string) => void
): Promise<GeneratedApp> {
  onProgress?.(`> Initializing Grok architect via server...`);
  
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ specs }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    onProgress?.(`> Generation successful! Received ${result.files?.length || 0} files.`);
    return result;
  } catch (error) {
    onProgress?.(`> Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
