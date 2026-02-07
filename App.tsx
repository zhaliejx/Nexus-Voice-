import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, Loader2, AlertCircle, Radio, X, Power, Zap } from 'lucide-react';
import { GeminiLiveClient } from './utils/geminiService';
import { AppMode, ConnectionState } from './types';
import Visualizer from './components/Visualizer';
import BlueprintView from './components/BlueprintView';

const API_KEY = process.env.API_KEY || '';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LIVE_DEMO);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Device State
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  const clientRef = useRef<GeminiLiveClient | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      setError("CRITICAL: API_KEY_MISSING");
    }
    refreshAudioDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
    return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
    };
  }, []);

  const refreshAudioDevices = async () => {
    try {
        const devices = await GeminiLiveClient.getAudioInputDevices();
        setAudioDevices(devices);
        if (selectedDeviceId && !devices.find(d => d.deviceId === selectedDeviceId)) {
             setSelectedDeviceId('');
        }
    } catch (e) {
        // Silently fail if permissions aren't granted yet
    }
  };

  const handleConnect = useCallback(async () => {
    if (!API_KEY) {
        setError("ACCESS_DENIED: MISSING_KEY");
        return;
    }

    setConnectionState('connecting');
    setError(null);

    const client = new GeminiLiveClient();
    clientRef.current = client;

    try {
      await client.connect({
        onOpen: () => {
          setConnectionState('connected');
          refreshAudioDevices();
        },
        onClose: () => {
          setConnectionState('disconnected');
          setVolume(0);
        },
        onVolume: (level) => {
          setVolume(level);
        },
        onError: (err) => {
          console.error(err);
          setError(`NET_ERR: ${err.message}`);
          setConnectionState('error');
          setVolume(0);
        }
      }, { deviceId: selectedDeviceId });
    } catch (e: any) {
       setError(e.message || "Connection Failed");
       setConnectionState('error');
    }
  }, [selectedDeviceId]);

  const handleDisconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState('disconnected');
    setVolume(0);
  }, []);

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (clientRef.current && connectionState === 'connected') {
        try {
            await clientRef.current.setInputDevice(deviceId);
        } catch (e) {
            setError("DEV_SWITCH_FAIL");
        }
    }
  };

  // Dynamic Orb Styles based on volume
  // Volume is 0.0 to 1.0 approximately
  const orbScale = 1 + (volume * 1.5); 
  const orbColor = connectionState === 'error' ? '239, 68, 68' : (connectionState === 'connecting' ? '234, 179, 8' : '6, 182, 212'); // Red, Yellow, Cyan
  
  return (
    <div className="flex flex-col h-full font-mono relative bg-black text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* Top HUD */}
      <nav className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-b border-white/10 relative z-30">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="relative">
                <Zap className={`w-5 h-5 ${connectionState === 'connected' ? 'text-cyan-400 fill-cyan-400' : 'text-zinc-600'}`} />
                {connectionState === 'connected' && <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-50 animate-pulse"></div>}
            </div>
            <div className="flex flex-col">
                <h1 className="text-xl font-black italic tracking-tighter leading-none">
                    NEXUS<span className="text-cyan-500">_PRIME</span>
                </h1>
                <span className="text-[9px] text-zinc-500 tracking-[0.3em] uppercase">V.3.1.0 // ONLINE</span>
            </div>
        </div>

        {/* Mode Switcher Desktop */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 border border-zinc-800 rounded-sm">
             <button 
                onClick={() => setMode(AppMode.LIVE_DEMO)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    mode === AppMode.LIVE_DEMO ? 'bg-cyan-950 text-cyan-400 border border-cyan-900 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Neural_Link
            </button>
            <button 
                onClick={() => setMode(AppMode.BLUEPRINT)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    mode === AppMode.BLUEPRINT ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Sys_Arch
            </button>
        </div>

        <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 border transition-all hover:bg-white/5 ${showSettings ? 'border-cyan-500 text-cyan-400' : 'border-zinc-800 text-zinc-500'}`}
        >
            <Settings className="w-5 h-5" />
        </button>
      </nav>

      {/* Settings Panel */}
      {showSettings && (
          <div className="absolute top-16 right-4 z-40 w-72 bg-black/90 border border-zinc-700 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center p-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                    <Radio className="w-3 h-3" /> Signal_Source
                </span>
                <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {audioDevices.map(d => (
                    <button 
                        key={d.deviceId} 
                        onClick={() => handleDeviceChange(d.deviceId)}
                        className={`w-full text-left px-3 py-2 text-[10px] font-mono uppercase truncate border-l-2 hover:bg-white/5 transition-all ${
                            selectedDeviceId === d.deviceId || (!selectedDeviceId && d.deviceId === 'default')
                            ? 'border-cyan-500 text-white bg-cyan-900/20' 
                            : 'border-transparent text-zinc-500'
                        }`}
                    >
                        {d.label || "Unknown Device"}
                    </button>
                ))}
            </div>
          </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        
        {mode === AppMode.LIVE_DEMO ? (
            <div className="flex-1 flex flex-col items-center justify-center relative">
                
                {/* Background FX */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none"></div>
                
                {/* THE ORB */}
                <div className="relative z-10 w-64 h-64 flex items-center justify-center">
                    
                    {/* Pulsing Glow Layer 1 */}
                    <div 
                        className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-transform duration-75"
                        style={{ 
                            backgroundColor: `rgb(${orbColor})`,
                            transform: `scale(${orbScale * 1.5})` 
                        }}
                    ></div>

                    {/* Pulsing Core Layer 2 */}
                    <div 
                        className="absolute inset-4 rounded-full border opacity-50 transition-transform duration-75"
                        style={{ 
                            borderColor: `rgb(${orbColor})`,
                            transform: `scale(${orbScale * 1.1})`,
                            boxShadow: `0 0 40px rgba(${orbColor}, 0.3)`
                        }}
                    ></div>
                    
                    {/* Solid Core Interaction Layer */}
                    <button 
                        onClick={connectionState === 'disconnected' || connectionState === 'error' ? handleConnect : handleDisconnect}
                        className="relative z-20 w-32 h-32 rounded-full flex items-center justify-center group outline-none transition-all duration-300"
                        style={{
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), rgb(0,0,0))`,
                            boxShadow: connectionState === 'connected' 
                                ? `inset 0 0 20px rgba(${orbColor}, 0.5), 0 0 20px rgba(${orbColor}, 0.5)`
                                : `inset 0 0 0px rgba(255,255,255,0.1), 0 0 0px rgba(0,0,0,0.5)`,
                            border: `2px solid rgba(${orbColor}, ${connectionState === 'connected' ? 0.8 : 0.3})`
                        }}
                    >
                        {connectionState === 'connecting' ? (
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        ) : connectionState === 'connected' ? (
                            <div className="w-8 h-8 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse"></div> // The "Pupil"
                        ) : (
                             <Power className="w-8 h-8 text-zinc-600 group-hover:text-white transition-colors" />
                        )}
                    </button>

                    {/* Orbital Rings */}
                    <div className="absolute inset-[-40px] border border-zinc-800 rounded-full opacity-50 animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-[-80px] border border-dashed border-zinc-900 rounded-full opacity-30 animate-[spin_20s_linear_infinite_reverse]"></div>

                </div>

                {/* Status Text */}
                <div className="mt-16 text-center space-y-2 relative z-10">
                    <div className={`text-xs font-bold uppercase tracking-[0.3em] ${
                        connectionState === 'connected' ? 'text-cyan-500 text-glow-cyan' :
                        connectionState === 'error' ? 'text-red-500' :
                        connectionState === 'connecting' ? 'text-yellow-500' : 'text-zinc-600'
                    }`}>
                        {connectionState === 'connected' ? 'Neural Link Active' : 
                         connectionState === 'error' ? 'System Failure' : 
                         connectionState === 'connecting' ? 'Handshake Protocol' : 'System Standby'}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                        {connectionState === 'connected' ? 'Awaiting Audio Input Stream...' : 'Tap Core to Initialize'}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="absolute bottom-32 max-w-sm mx-4 bg-red-950/80 border-l-2 border-red-500 p-3 backdrop-blur-md animate-in slide-in-from-bottom-5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-red-400 uppercase">Connection Interrupted</p>
                                <p className="text-[10px] text-red-300 font-mono leading-tight">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Footer Visualizer (Secondary) */}
                 <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                     <div className="opacity-30">
                        <Visualizer isActive={connectionState === 'connected'} volume={volume} />
                     </div>
                 </div>

            </div>
        ) : (
            <div className="flex-1 overflow-y-auto">
                <BlueprintView />
            </div>
        )}

      </main>

      {/* Mobile Footer Nav */}
      <div className="md:hidden grid grid-cols-2 border-t border-white/10 bg-black relative z-30">
         <button 
            onClick={() => setMode(AppMode.LIVE_DEMO)}
            className={`py-4 text-[10px] font-bold uppercase tracking-widest ${mode === AppMode.LIVE_DEMO ? 'text-cyan-400 bg-cyan-950/30' : 'text-zinc-600'}`}
        >
            Live_Link
        </button>
         <button 
            onClick={() => setMode(AppMode.BLUEPRINT)}
            className={`py-4 text-[10px] font-bold uppercase tracking-widest ${mode === AppMode.BLUEPRINT ? 'text-cyan-400 bg-cyan-950/30' : 'text-zinc-600'}`}
        >
            Sys_Arch
        </button>
      </div>

    </div>
  );
};

export default App;