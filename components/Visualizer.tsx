import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  volume: number; // 0.0 to 1.0 (approx)
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      // Resize handling
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) {
        // Idle state: A flat digital line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
        ctx.lineWidth = 1;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      // Active state: Sharp digital jagged lines
      const centerY = canvas.height / 2;
      const amplitude = Math.min(canvas.height / 2, volume * 300 + 20); 
      
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff'; // White core
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff'; // Cyan glow
      ctx.lineWidth = 2;

      // Draw jagged digital wave
      ctx.moveTo(0, centerY);
      
      const segments = 100;
      const segmentWidth = canvas.width / segments;

      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth;
        
        // Create a "noise" based wave rather than sine for a digital look
        const noise = (Math.sin(i * 0.5 + time) + Math.sin(i * 0.2 - time * 2)) * Math.random();
        
        // Modulate with volume
        const yOffset = noise * amplitude;
        
        // Clamp visually
        const y = centerY + yOffset;

        ctx.lineTo(x, y);
      }

      ctx.stroke();
      
      // Mirror reflection (faint)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth;
        const noise = (Math.sin(i * 0.5 + time) + Math.sin(i * 0.2 - time * 2)) * Math.random();
        const yOffset = noise * amplitude;
        ctx.lineTo(x, centerY - yOffset); // Inverted
      }
      ctx.stroke();


      time += 0.2;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume]);

  return (
    <div className="relative w-full h-32 border-y border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="absolute top-0 left-0 text-[10px] text-cyan-500 font-mono px-2 py-1 opacity-70">
        AUDIO_VISUALIZATION_MODULE // V.2.0
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default Visualizer;