import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable, { File as FormidableFile, Files } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath as string);

async function parseForm(req: NextApiRequest): Promise<{ audio: FormidableFile }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err: any, fields: any, files: Files) => {
      if (err) return reject(err);
      const audio = (files as any).audio as FormidableFile | FormidableFile[];
      if (!audio) return reject(new Error('No audio file uploaded'));
      // If multiple files, take the first
      resolve({ audio: Array.isArray(audio) ? audio[0] : audio });
    });
  });
}

function convertWebmToWav(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { audio } = await parseForm(req);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No OpenAI API key' });
    // Convert webm to wav
    const wavPath = path.join(process.cwd(), 'tmp', `${Date.now()}_audio.wav`);
    await fs.promises.mkdir(path.dirname(wavPath), { recursive: true });
    await convertWebmToWav(audio.filepath, wavPath);
    const audioStream = fs.createReadStream(wavPath);
    // Whisper transcription
    const whisperForm = new FormData();
    whisperForm.append('file', audioStream, 'audio.wav');
    whisperForm.append('model', 'whisper-1');
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...whisperForm.getHeaders(),
      },
      body: whisperForm as any,
    } as any);
    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      return res.status(500).json({ error: 'Whisper error', details: err });
    }
    const whisperData = await whisperRes.json();
    const transcript = whisperData.text || '';
    // Clean up temp file
    fs.unlink(wavPath, () => {});
    // GPT feedback
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a speech coach. Give concise, actionable feedback on enunciation, pacing, and confidence based on the transcript.' },
          { role: 'user', content: `Transcript: ${transcript}` },
        ],
        max_tokens: 120,
      }),
    });
    if (!gptRes.ok) {
      const err = await gptRes.text();
      return res.status(500).json({ error: 'GPT error', details: err });
    }
    const gptData = await gptRes.json();
    const feedback = gptData.choices?.[0]?.message?.content || '';
    res.status(200).json({ transcript, feedback });
  } catch (err: any) {
    console.error('API /analyze error:', err);
    res.status(500).json({ error: 'Server error', details: err.message || err.toString(), stack: err.stack });
  }
} 