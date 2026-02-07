export class VoiceManager {
  private recognition: any;
  private isListening: boolean = false;
  private isSpeaking: boolean = false; // Gate to prevent self-hearing loop
  private wakeWordCallback: (() => void) | null = null;
  private commandCallback: ((text: string) => void) | null = null;
  private synth: SpeechSynthesis;
  private wakeWords = ['nexus', 'hey nexus', 'ok nexus'];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  
  // Configuration for the requested Piper model
  public piperConfig = {
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
    setTimeout(() => this.loadVoices(), 1000);
    setTimeout(() => this.loadVoices(), 2500);
  }

  private loadVoices() {
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      // 1. Try to find the exact requested Piper voice if installed system-wide (unlikely but possible)
      // 2. Look for "Amy" specifically
      // 3. Look for "Samantha" or "Zira"
      // 4. Fallback to any Female US English voice
      
      const preferredNames = [
        "en_US-amy-medium",
        "Amy", 
        "Microsoft Zira", 
        "Google US English", 
        "Samantha"
      ];

      this.selectedVoice = voices.find(v => preferredNames.some(name => v.name.includes(name))) || null;

      if (!this.selectedVoice) {
        this.selectedVoice = voices.find(v => 
          (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("woman")) && 
          v.lang.startsWith("en")
        ) || null;
      }

      if (!this.selectedVoice) {
        this.selectedVoice = voices.find(v => v.lang === "en-US") || null;
      }

      if (!this.selectedVoice) {
        this.selectedVoice = voices[0];
      }
      
      // console.log("Voice selected:", this.selectedVoice?.name);
    }
  }

  init(onWake: () => void, onCommand: (text: string) => void) {
    this.wakeWordCallback = onWake;
    this.commandCallback = onCommand;

    if (this.recognition) {
      this.recognition.onresult = (event: any) => {
        // Critical: If speaking, ignore all input
        if (this.isSpeaking) return;

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
        // Only restart if we are NOT speaking and supposed to be active
        if (this.isListening && !this.isSpeaking && this.mode !== 'SLEEPING') {
          try {
            this.recognition.start();
          } catch(e) { /* ignore */ }
        }
      };
    }
  }

  setSleepMode(sleeping: boolean) {
    this.mode = sleeping ? 'SLEEPING' : 'WAITING_FOR_WAKE';
    if (sleeping) {
        this.stop();
    } else {
        this.start();
    }
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

  speak(text: string, onEnd?: () => void) {
    // 1. Cancel existing speech
    this.synth.cancel();

    // 2. Set Speaking Flag & Stop Mic (Prevents Feedback Loop)
    this.isSpeaking = true;
    if (this.recognition) {
        try { this.recognition.stop(); } catch(e) {}
    }

    if (!this.selectedVoice) this.loadVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
    }

    // Tune to match "Amy" characteristics
    utterance.pitch = 1.05; 
    utterance.rate = 1.15; 
    utterance.volume = 1.0;
    
    utterance.onend = () => {
        // 3. Reset Flag & Restart Mic
        this.isSpeaking = false;
        
        if (this.isListening && this.mode !== 'SLEEPING') {
            try { this.recognition.start(); } catch(e) {}
        }

        if (onEnd) onEnd();
    };

    // Failsafe for errors
    utterance.onerror = () => {
        this.isSpeaking = false;
        if (this.isListening && this.mode !== 'SLEEPING') {
            try { this.recognition.start(); } catch(e) {}
        }
    };
    
    this.synth.speak(utterance);
  }
}