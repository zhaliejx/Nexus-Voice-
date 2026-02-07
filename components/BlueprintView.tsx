import React from 'react';
import { BLUEPRINT_DATA } from '../utils/blueprintData';
import { Terminal, FolderTree, Code, Smartphone, Cpu, Battery, CircuitBoard } from 'lucide-react';

const BlueprintView: React.FC = () => {
  return (
    <div className="flex flex-col space-y-8 p-6 max-w-5xl mx-auto pb-32 font-mono">
      
      {/* Header */}
      <div className="border-b-2 border-white pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3 text-glow">
            <CircuitBoard className="w-10 h-10 text-cyan-400" />
            System_Architecture
          </h2>
          <p className="text-zinc-400 mt-2 text-sm uppercase tracking-widest">
            Protocol: Mobile_Offline_First
          </p>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-xs text-cyan-400">SECURE_CONNECTION: TRUE</div>
            <div className="text-xs text-zinc-500">ID: NXS-8842-ALPHA</div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Cpu className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <div className="w-2 h-2 bg-cyan-400"></div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Compute_Optimized</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Utilizes int8 quantized Whisper models via ONNX runtime. Minimal CPU overhead for continuous operation on ARM64 architecture.
          </p>
        </div>
        
        <div className="glass-panel p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Battery className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-white">
            <div className="w-2 h-2 bg-white"></div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Power_Management</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Hybrid architecture: Local low-power wake-word detection triggers high-performance cloud inference only when necessary.
          </p>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Terminal className="w-12 h-12 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-zinc-400">
             <div className="w-2 h-2 bg-zinc-400"></div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Termux_Native</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Full Python environment execution within Android Termux or Pydroid 3. No root access required.
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2 border-l-4 border-cyan-400 pl-3">
          System_Manifest
        </h3>
        <div className="glass-panel p-6 text-xs text-zinc-300 whitespace-pre-wrap font-mono">
          {BLUEPRINT_DATA.overview.trim()}
        </div>
      </div>

      {/* Two Column Layout for Code and Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2 border-l-4 border-white pl-3">
                <FolderTree className="w-5 h-5" /> Directory_Map
            </h3>
            <div className="glass-panel p-6 text-xs text-cyan-300 whitespace-pre font-mono overflow-x-auto">
                {BLUEPRINT_DATA.structure.trim()}
            </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2 border-l-4 border-white pl-3">
                <Terminal className="w-5 h-5" /> Termux_Init
            </h3>
            <div className="glass-panel p-6 text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                {BLUEPRINT_DATA.setup.trim()}
            </div>
        </div>
      </div>

      {/* Pseudocode */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2 border-l-4 border-cyan-400 pl-3">
            <Code className="w-5 h-5" /> Kernel_Loop.py
        </h3>
        <div className="bg-black border border-zinc-800 p-4 rounded-none overflow-x-auto">
          <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
            {BLUEPRINT_DATA.pseudocode.trim()}
          </pre>
        </div>
      </div>

    </div>
  );
};

export default BlueprintView;