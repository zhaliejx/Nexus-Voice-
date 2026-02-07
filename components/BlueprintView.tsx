import React from 'react';
import { BLUEPRINT_DATA } from '../utils/blueprintData';
import { Terminal, FolderTree, Code, Smartphone, Cpu, Battery, CircuitBoard } from 'lucide-react';

const BlueprintView: React.FC = () => {
  return (
    <div className="flex flex-col space-y-8 p-6 max-w-5xl mx-auto pb-32 font-mono text-zinc-300">
      
      {/* Header */}
      <div className="border-b border-white/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-light text-white uppercase tracking-tighter flex items-center gap-3">
            <CircuitBoard className="w-8 h-8" />
            System Architecture
          </h2>
          <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest">
            Protocol: Mobile Offline First
          </p>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-xs text-white">SECURE CONNECTION: TRUE</div>
            <div className="text-xs text-zinc-600">ID: NXS-8842-ALPHA</div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-white/10 bg-white/5 p-6 relative overflow-hidden group hover:border-white/30 transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Cpu className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-white">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <h3 className="font-bold uppercase tracking-wider text-xs">Compute Optimized</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Utilizes int8 quantized Whisper models via ONNX runtime. Minimal CPU overhead for continuous operation on ARM64 architecture.
          </p>
        </div>
        
        <div className="border border-white/10 bg-white/5 p-6 relative overflow-hidden group hover:border-white/30 transition-colors">
           <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Battery className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-white">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <h3 className="font-bold uppercase tracking-wider text-xs">Power Management</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hybrid architecture: Local low-power wake-word detection triggers high-performance cloud inference only when necessary.
          </p>
        </div>

        <div className="border border-white/10 bg-white/5 p-6 relative overflow-hidden group hover:border-white/30 transition-colors">
           <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Terminal className="w-12 h-12 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-white">
             <div className="w-1 h-1 bg-white rounded-full"></div>
            <h3 className="font-bold uppercase tracking-wider text-xs">Termux Native</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Full Python environment execution within Android Termux or Pydroid 3. No root access required.
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 pl-1">
          System Manifest
        </h3>
        <div className="border border-white/10 bg-black p-6 text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
          {BLUEPRINT_DATA.overview.trim()}
        </div>
      </div>

      {/* Two Column Layout for Code and Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 pl-1">
                <FolderTree className="w-4 h-4" /> Directory Map
            </h3>
            <div className="border border-white/10 bg-black p-6 text-xs text-zinc-400 whitespace-pre font-mono overflow-x-auto">
                {BLUEPRINT_DATA.structure.trim()}
            </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 pl-1">
                <Terminal className="w-4 h-4" /> Termux Init
            </h3>
            <div className="border border-white/10 bg-black p-6 text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {BLUEPRINT_DATA.setup.trim()}
            </div>
        </div>
      </div>

      {/* Pseudocode */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 pl-1">
            <Code className="w-4 h-4" /> Kernel Loop.py
        </h3>
        <div className="border border-white/10 bg-black p-6 overflow-x-auto">
          <pre className="text-xs text-zinc-500 font-mono leading-relaxed">
            {BLUEPRINT_DATA.pseudocode.trim()}
          </pre>
        </div>
      </div>

    </div>
  );
};

export default BlueprintView;