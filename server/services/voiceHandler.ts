/**
 * Voice Handler Service
 * Handle voice messages, transcription, and TTS
 */

import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export interface VoiceMessageInfo {
  isVoice: boolean;
  duration?: number;
  mimetype?: string;
  fileSize?: number;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  error?: string;
}

/**
 * Detect if message contains voice/audio
 */
export function detectVoiceMessage(msg: any): VoiceMessageInfo {
  const audioMessage = msg.message?.audioMessage;
  
  if (!audioMessage) {
    return { isVoice: false };
  }

  return {
    isVoice: true,
    duration: audioMessage.seconds,
    mimetype: audioMessage.mimetype,
    fileSize: audioMessage.fileLength,
  };
}

/**
 * Download voice message
 */
export async function downloadVoiceMessage(msg: any): Promise<Buffer | null> {
  try {
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: console,
        reuploadRequest: () => Promise.resolve({} as any)
      }
    );
    
    return buffer as Buffer;
  } catch (error) {
    console.error("[Voice] Download error:", error);
    return null;
  }
}

/**
 * Save voice message to file
 */
export async function saveVoiceMessage(buffer: Buffer, filename: string): Promise<string> {
  const voiceDir = "./server/uploads/voice";
  
  // Create directory if it doesn't exist
  if (!existsSync(voiceDir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(voiceDir, { recursive: true });
  }

  const filePath = path.join(voiceDir, filename);
  await writeFile(filePath, buffer);
  
  return filePath;
}

/**
 * Transcribe voice message (placeholder - requires Whisper integration)
 */
export async function transcribeVoice(audioPath: string): Promise<TranscriptionResult> {
  // TODO: Integrate Whisper.cpp or external API
  // For now, return placeholder
  
  console.log("[Voice] Transcription requested for:", audioPath);
  
  return {
    success: false,
    error: "Transcription not yet implemented. Requires Whisper integration.",
  };
}

/**
 * Generate voice response (placeholder - requires TTS integration)
 */
export async function generateVoiceResponse(text: string, language: string = "ar"): Promise<Buffer | null> {
  // TODO: Integrate gTTS, ElevenLabs, or Azure TTS
  // For now, return null
  
  console.log("[Voice] TTS requested for:", text.substring(0, 50));
  
  return null;
}

/**
 * Check if transcription is available
 */
export function isTranscriptionAvailable(): boolean {
  // Check if Whisper or transcription service is configured
  return process.env.WHISPER_ENABLED === "true" || 
         process.env.TRANSCRIPTION_API_KEY !== undefined;
}

/**
 * Check if TTS is available
 */
export function isTTSAvailable(): boolean {
  // Check if TTS service is configured
  return process.env.TTS_ENABLED === "true" ||
         process.env.ELEVENLABS_API_KEY !== undefined ||
         process.env.AZURE_TTS_KEY !== undefined;
}

/**
 * Get voice capabilities status
 */
export function getVoiceCapabilities() {
  return {
    voiceDetection: true, // Always available with Baileys
    voiceDownload: true, // Always available with Baileys
    transcription: isTranscriptionAvailable(),
    textToSpeech: isTTSAvailable(),
    supportedLanguages: {
      transcription: isTranscriptionAvailable() ? ["ar", "en"] : [],
      tts: isTTSAvailable() ? ["ar", "en"] : [],
    },
  };
}
