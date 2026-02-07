import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToBytes, bytesToBase64, decodeAudioData, float32ToInt16 } from './audioUtils';

interface LiveClientCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onVolume: (level: number) => void;
  onError: (error: Error) => void;
}

export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private activeSession: any = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private outputGain: GainNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private volumeInterval: any = null;
  private currentInputVolume = 0;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'audioinput');
  }

  async connect(callbacks: LiveClientCallbacks, config?: { deviceId?: string }) {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Setup Audio Graph for Output
    this.outputGain = this.outputAudioContext.createGain();
    this.outputAnalyser = this.outputAudioContext.createAnalyser();
    this.outputAnalyser.fftSize = 256;
    this.outputAnalyser.smoothingTimeConstant = 0.5;
    
    // Connect: Gain -> Analyser -> Speaker
    this.outputGain.connect(this.outputAnalyser);
    this.outputAnalyser.connect(this.outputAudioContext.destination);

    // Start Volume Monitoring Loop (Combines Input and Output energy)
    this.startVolumeLoop(callbacks.onVolume);

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
            deviceId: config?.deviceId ? { exact: config.deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            callbacks.onOpen();
            this.startAudioInputStream(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.playAudioChunk(base64Audio);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              this.stopAudioOutput();
            }
          },
          onclose: () => {
            callbacks.onClose();
            this.cleanup();
          },
          onerror: (e: any) => {
            console.error("Gemini Error:", e);
            callbacks.onError(new Error(e.message || "Connection failed"));
            this.cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are Nexus, a futuristic, helpful AI. Speak concisely and clearly.",
        },
      });
      
      // Store session for cleanup
      sessionPromise.then(session => {
        this.activeSession = session;
      });
      
    } catch (error) {
      callbacks.onError(error as Error);
      this.cleanup();
    }
  }

  private startVolumeLoop(onVolume: (level: number) => void) {
    this.volumeInterval = setInterval(() => {
        let outputVol = 0;
        
        // Calculate Output Volume (AI Speaking)
        if (this.outputAnalyser) {
            const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
            this.outputAnalyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
            outputVol = (sum / dataArray.length) / 255;
        }

        // Decay input volume slightly
        this.currentInputVolume *= 0.95;

        // Use the louder of the two
        const combinedVol = Math.max(this.currentInputVolume, outputVol);
        onVolume(combinedVol);
    }, 50);
  }

  async setInputDevice(deviceId: string) {
    if (!this.inputAudioContext || !this.processor) return;
    
    if (this.sourceNode) {
        this.sourceNode.disconnect();
    }
    if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
    }

    try {
        const constraints = {
            audio: {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.stream);
        this.sourceNode.connect(this.processor);
    } catch (e) {
        console.error("Failed to switch device", e);
        throw e;
    }
  }

  private startAudioInputStream(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate Input Volume (User Speaking)
      let sum = 0;
      for(let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      // Boost it a bit for visualization
      this.currentInputVolume = Math.min(1.0, rms * 3);

      const pcmInt16 = float32ToInt16(inputData);
      const pcmUint8 = new Uint8Array(pcmInt16.buffer);
      const base64 = bytesToBase64(pcmUint8);

      sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64
          }
        });
      });
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async playAudioChunk(base64Audio: string) {
    if (!this.outputAudioContext || !this.outputGain) return;

    const audioBytes = base64ToBytes(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, this.outputAudioContext, 24000);

    this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputGain); // Connect to Gain (which goes to Analyser)
    
    source.addEventListener('ended', () => {
      this.sources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  private stopAudioOutput() {
    this.sources.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    this.sources.clear();
    if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
    }
  }

  disconnect() {
    if (this.activeSession) {
      try {
        this.activeSession.close();
      } catch (e) {
        console.error("Error closing session", e);
      }
      this.activeSession = null;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.volumeInterval) clearInterval(this.volumeInterval);
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.sourceNode) this.sourceNode.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.stream = null;
    this.processor = null;
    this.sources.clear();
  }
}