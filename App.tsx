import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, Power, CircuitBoard, Mic, Activity } from 'lucide-react';
import { CerebrasClient } from './utils/cerebrasService';
import { VoiceManager } from './utils/voiceManager';
import { AppMode, ConnectionState } from './types';
import BlueprintView from './components/BlueprintView';

const DEFAULT_CEREBRAS_KEY = process.env.API_KEY || '';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LIVE_DEMO);
  const [status, setStatus] = useState<ConnectionState>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  const [cerebrasKey, setCerebrasKey] = useState(DEFAULT_CEREBRAS_KEY);

  const cerebrasRef = useRef<CerebrasClient | null>(null);
  const voiceRef = useRef<VoiceManager | null>(null);

  // Initialize System
  const initializeSystem = async () => {
    if (!cerebrasKey) {
      // Small non-intrusive alert
      alert("KEY_MISSING");
      setShowSettings(true);
      return;
    }

    setStatus('idle');
    cerebrasRef.current = new CerebrasClient();
    cerebrasRef.current.updateKey(cerebrasKey);

    voiceRef.current = new VoiceManager();
    
    voiceRef.current.init(
        // On Wake Word Detected
        () => {
            if (status !== 'disconnected' && status !== 'sleeping') {
                setStatus('listening');
            } else if (status === 'sleeping') {
                handleWakeFromSleep();
            }
        },
        // On Command Received
        async (text) => {
            setStatus('processing');
            await processCommand(text);
        }
    );

    voiceRef.current.start();
    voiceRef.current.speak("Nexus Online.");
  };

  const processCommand = async (text: string) => {
    if (!cerebrasRef.current || !voiceRef.current) return;

    try {
        const response = await cerebrasRef.current.sendMessage(text);
        
        if (response.toolUsed === 'system_sleep') {
            setStatus('sleeping');
            voiceRef.current.setSleepMode(true);
            voiceRef.current.speak("Shutdown.");
            return;
        }

        setStatus('speaking');
        voiceRef.current.speak(response.text, () => {
            setStatus('idle');
        });

    } catch (e: any) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleWakeFromSleep = () => {
      setStatus('listening');
      voiceRef.current?.setSleepMode(false);
      voiceRef.current?.speak("Restored.");
  };

  const getStatusText = () => {
    switch(status) {
        case 'disconnected': return 'OFFLINE';
        case 'listening': return 'LISTENING';
        case 'processing': return 'COMPUTING';
        case 'speaking': return 'ACTIVE';
        case 'sleeping': return '';
        case 'error': return 'ERROR';
        case 'idle': return 'READY';
        default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full font-sans relative bg-black text-white overflow-hidden selection:bg-white/20">
      
      {/* Settings Panel (Minimal Overlay) */}
      {showSettings && (
          <div className="absolute inset-0 z-50 bg-black flex items-center justify-center p-8">
              <div className="w-full max-w-sm space-y-8">
                  <div className="flex justify-between items-center border-b border-white/20 pb-4">
                      <h2 className="text-xl font-light tracking-[0.2em]">CONFIG</h2>
                      <button onClick={() => setShowSettings(false)}><X className="text-white/50 hover:text-white" /></button>
                  </div>
                  <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-3">API Credential</label>
                      <input 
                        type="password" 
                        value={cerebrasKey} 
                        onChange={(e) => setCerebrasKey(e.target.value)}
                        className="w-full bg-transparent border-b border-white/30 py-2 text-lg text-white focus:border-white outline-none placeholder-white/10 font-mono"
                        placeholder="ENTER_KEY"
                      />
                  </div>
                  <button 
                    onClick={() => {
                        if (cerebrasRef.current) cerebrasRef.current.updateKey(cerebrasKey);
                        setShowSettings(false);
                    }}
                    className="w-full bg-white text-black py-4 font-bold tracking-[0.2em] hover:bg-zinc-200 transition-all"
                  >
                      INITIALIZE
                  </button>
              </div>
          </div>
      )}

      {/* Main UI */}
      <main className="flex-1 relative flex flex-col items-center justify-center">
        
        {mode === AppMode.LIVE_DEMO ? (
            <div className={`relative flex flex-col items-center justify-center w-full h-full transition-opacity duration-1000 ${status === 'sleeping' ? 'opacity-0' : 'opacity-100'}`}>
                
                {/* Center Assembly */}
                <div className="relative flex items-center justify-center">
                    
                    {/* The Glow Field */}
                    <div className={`absolute rounded-full blur-[80px] transition-all duration-700 ease-in-out ${
                        status === 'listening' ? 'bg-white/30 w-96 h-96' :
                        status === 'processing' ? 'bg-white/40 w-[30rem] h-[30rem] animate-pulse' :
                        status === 'speaking' ? 'bg-white/50 w-80 h-80' :
                        status === 'disconnected' ? 'bg-transparent w-0 h-0' :
                        'bg-white/10 w-64 h-64'
                    }`}></div>

                    {/* The ORB */}
                    <div 
                        onClick={status === 'disconnected' ? initializeSystem : undefined}
                        className={`relative z-10 w-32 h-32 rounded-full bg-white transition-all duration-500 flex items-center justify-center cursor-pointer ${
                        status === 'disconnected' ? 'scale-75 opacity-20 hover:opacity-40 shadow-none' :
                        status === 'listening' ? 'scale-110 shadow-[0_0_60px_rgba(255,255,255,0.8)]' :
                        status === 'processing' ? 'scale-90 shadow-[0_0_100px_rgba(255,255,255,1)] animate-pulse' :
                        status === 'speaking' ? 'scale-105 shadow-[0_0_50px_rgba(255,255,255,0.6)]' :
                        'scale-100 shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-[pulse_3s_ease-in-out_infinite]'
                    }`}>
                        {status === 'disconnected' && <Power className="w-8 h-8 text-black/50" />}
                    </div>

                    {/* Orbital Rings (Decoration) */}
                    {status !== 'disconnected' && (
                         <div className={`absolute border border-white/20 rounded-full transition-all duration-1000 ${
                             status === 'processing' ? 'w-[20rem] h-[20rem] rotate-180 opacity-50' : 'w-48 h-48 rotate-0 opacity-20'
                         }`}></div>
                    )}

                </div>

                {/* Status Indicator */}
                <div className="absolute bottom-32 text-center">
                    <h2 className="text-xs font-bold tracking-[0.5em] text-white/60 animate-pulse">
                        {getStatusText()}
                    </h2>
                </div>

                {/* Footer Controls */}
                <div className="absolute bottom-8 flex gap-8 text-white/30">
                    <button onClick={() => setShowSettings(true)} className="hover:text-white transition-colors">
                        <Settings className="w-6 h-6" />
                    </button>
                    <button onClick={() => setMode(AppMode.BLUEPRINT)} className="hover:text-white transition-colors">
                        <CircuitBoard className="w-6 h-6" />
                    </button>
                </div>

            </div>
        ) : (
            <div className="w-full h-full overflow-y-auto bg-black relative z-20">
                 <button 
                    onClick={() => setMode(AppMode.LIVE_DEMO)}
                    className="fixed top-6 right-6 z-50 text-white mix-blend-difference hover:opacity-70"
                >
                    <X className="w-8 h-8" />
                </button>
                <BlueprintView />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;