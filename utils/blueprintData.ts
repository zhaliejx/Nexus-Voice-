export const BLUEPRINT_DATA = {
  overview: `
# Nexus Mobile Architecture

This blueprint describes a fully functional voice assistant pipeline optimized for Android devices using Termux. 
It leverages local wake-word detection for privacy and battery efficiency, while offloading intelligence to the Gemini API.

## Core Stack
- **Runtime:** Python 3.10+ (via Termux or Pydroid)
- **Wake Word:** OpenWakeWord (ONNX runtime)
- **STT:** OpenAI Whisper (Tiny/Base model, quantized)
- **Intelligence:** Google Gemini API (Flash model)
- **TTS:** Piper (Low-latency, local neural TTS)
`,
  structure: `
nexus-agent/
├── main.py              # Orchestrator & Event Loop
├── config.json          # API Keys & Model Paths
├── requirements.txt     # Python Dependencies
├── assets/
│   ├── wake_word.onnx   # OpenWakeWord model
│   └── sounds/          # UI Sound Effects (beep.wav)
└── modules/
    ├── audio.py         # PyAudio Input/Output wrapper
    ├── stt.py           # Faster-Whisper Implementation
    ├── llm.py           # Gemini API Client
    └── tts.py           # Piper TTS Wrapper
`,
  pseudocode: `
import asyncio
from modules import audio, stt, llm, tts, wake

async def main_loop():
    print("Nexus Initializing...")
    config = load_config()
    
    # 1. Initialize Components
    mic = audio.MicrophoneStream()
    speaker = audio.Speaker()
    wakeword = wake.OpenWakeWord(model="hey_nexus")
    whisper = stt.WhisperModel("tiny.en")
    gemini = llm.GeminiClient(api_key=config['GEMINI_KEY'])
    piper = tts.PiperTTS(voice="en_US-amy-medium")

    print("Listening...")
    
    while True:
        # 2. Wake Word Detection (Low Power)
        audio_frame = await mic.read_frame()
        if wakeword.detect(audio_frame):
            speaker.play("assets/sounds/active.wav")
            
            # 3. Speech Recognition
            user_audio = await mic.record_phrase(silence_timeout=2.0)
            text = whisper.transcribe(user_audio)
            
            if not text: continue
            
            # 4. LLM Processing
            response_text = await gemini.generate(text)
            
            # 5. Text-to-Speech
            audio_out = piper.synthesize(response_text)
            speaker.stream(audio_out)

if __name__ == "__main__":
    asyncio.run(main_loop())
`,
  setup: `
# 1. Install Termux from F-Droid
# 2. Update and install dependencies
pkg update && pkg upgrade
pkg install python ffmpeg portaudio build-essential git

# 3. Create Virtual Environment
python -m venv venv
source venv/bin/activate

# 4. Install Python Packages
pip install openwakeword faster-whisper google-genai sounddevice piper-tts numpy

# 5. Run the Agent
python main.py
`
};