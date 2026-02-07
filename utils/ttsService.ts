import { base64ToBytes, decodeAudioData } from "./audioUtils";

export class TTSService {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }

  updateKey(_apiKey: string) {
    // intentionally empty (Gemini removed)
  }

  async speak(_text: string): Promise<void> {
    throw new Error("No TTS engine configured");
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
