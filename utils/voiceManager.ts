export class VoiceManager {
  private recognition: any;
  private isListening: boolean = false;
  private wakeWordCallback: (() => void) | null = null;
  private commandCallback: ((text: string) => void) | null = null;
  private synth: SpeechSynthesis;
  private wakeWords = ['nexus', 'hey nexus', 'ok nexus'];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  
  // Configuration for the Local Piper Model
  private piperConfig = {
    modelPath: '/voices/en_US-amy-medium.onnx',
    configPath: '/voices/en_US-amy-medium.onnx.json'
  };

  private mode: 'WAITING_FOR_WAKE' | 'LISTENING_FOR_COMMAND' | 'SLEEPING' = 'WAITING_FOR_WAKE';

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
    this.synth = window.speechSynthesis;
    
    // Aggressive Voice Loading
    this.loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
    // Retry a few times in case of mobile browser delay
    setTimeout(() => this.loadVoices(), 1000);
    setTimeout(() => this.loadVoices(), 3000);
  }

  private loadVoices() {
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      // Priority List for "Amy" like voices
      const preferredNames = [
        "Amy", 
        "Microsoft Zira", 
        "Google US English", 
        "Samantha"
      ];

      // 1. Exact Match from Priority List
      this.selectedVoice = voices.find(v => preferredNames.some(name => v.name.includes(name))) || null;

      // 2. Any Female US English Voice
      if (!this.selectedVoice) {
        this.selectedVoice = voices.find(v => 
          (v.name.includes("Female") || v.name.includes("Woman")) && 
          v.lang.startsWith("en")
        ) || null;
      }

      // 3. Any US English Voice
      if (!this.selectedVoice) {
        this.selectedVoice = voices.find(v => v.lang === "en-US") || null;
      }

      // 4. Fallback to first available
      if (!this.selectedVoice) {
        this.selectedVoice = voices[0];
      }
      
      // console.log("Voice Active:", this.selectedVoice?.name);
    }
  }

  init(onWake: () => void, onCommand: (text: string) => void) {
    this.wakeWordCallback = onWake;
    this.commandCallback = onCommand;

    if (this.recognition) {
      this.recognition.onresult = (event: any) => {
        const results = event.results;
        const transcript = results[results.length - 1][0].transcript.toLowerCase().trim();
        const isFinal = results[results.length - 1].isFinal;

        if (this.mode === 'WAITING_FOR_WAKE' || this.mode === 'SLEEPING') {
          if (this.wakeWords.some(w => transcript.includes(w))) {
            this.recognition.stop(); 
            this.mode = 'LISTENING_FOR_COMMAND';
            if (this.wakeWordCallback) this.wakeWordCallback();
          }
        } else if (this.mode === 'LISTENING_FOR_COMMAND') {
          if (isFinal) {
            if (this.commandCallback) this.commandCallback(transcript);
            this.mode = 'WAITING_FOR_WAKE';
          }
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch(e) { /* ignore */ }
        }
      };
    }
  }

  setSleepMode(sleeping: boolean) {
    this.mode = sleeping ? 'SLEEPING' : 'WAITING_FOR_WAKE';
  }

  start() {
    if (!this.recognition) return;
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      console.error("Mic start failed", e);
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) this.recognition.stop();
    this.synth.cancel();
  }

  /**
   * TTS Handler
   * Note: In a full local setup, this would fetch the .onnx file from 
   * /voices/en_US-amy-medium.onnx and process it via onnxruntime-web.
   * Since we are in a static context without the WASM runtime configured, 
   * this defaults to the best browser fallback found.
   */
  speak(text: string, onEnd?: () => void) {
    this.synth.cancel();

    if (!this.selectedVoice) {
        this.loadVoices(); 
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
    }

    // Tweak properties to sound more like Piper's Amy (Clearer, slightly fast)
    utterance.pitch = 1.05; 
    utterance.rate = 1.15; 
    utterance.volume = 1.0;
    
    utterance.onend = () => {
        if (onEnd) onEnd();
    };
    
    this.synth.speak(utterance);
  }
}