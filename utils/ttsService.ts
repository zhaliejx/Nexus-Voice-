import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToBytes, decodeAudioData } from "./audioUtils";

export class TTSService {
  private ai: GoogleGenAI | null = null;
  private audioContext: AudioContext;

  constructor(apiKey?: string) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  updateKey(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async speak(text: string): Promise<void> {
    // If no API key configured, throw error to fallback
    if (!this.ai) {
      throw new Error("No Google API Key for TTS");
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!base64Audio) {
        throw new Error("No audio data returned");
      }

      await this.playBuffer(base64Audio);

    } catch (error) {
      console.error("Gemini TTS Failed:", error);
      throw error; // Let caller handle fallback
    }
  }

  private async playBuffer(base64: string): Promise<void> {
    const bytes = base64ToBytes(base64);
    const audioBuffer = await decodeAudioData(bytes, this.audioContext, 24000);
    
    return new Promise((resolve) => {
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.onended = () => resolve();
      source.start();
    });
  }
}