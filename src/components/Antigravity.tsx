import { useRef, useEffect, useCallback } from "react";

interface AntigravityProps {
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  color?: string;
  autoAnimate?: boolean;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  particleShape?: "circle" | "capsule" | "square";
  fieldStrength?: number;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  phase: number;
}

const Antigravity = ({
  count = 300,
  magnetRadius = 36,
  waveSpeed = 2.2,
  waveAmplitude = 1,
  particleSize = 1.5,
  lerpSpeed = 0.05,
  color = "#01c7fc",
  autoAnimate = true,
  particleVariance = 1,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = "capsule",
  fieldStrength = 10,
}: AntigravityProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x, y,
        originX: x,
        originY: y,
        vx: 0, vy: 0,
        size: particleSize + (Math.random() - 0.5) * particleVariance,
        depth: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, [count, particleSize, particleVariance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) { animRef.current = requestAnimationFrame(animate); return; }
      const w = rect.width;
      const h = rect.height;
      
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.016;
      const t = timeRef.current;
      const mouse = mouseRef.current;

      for (const p of particlesRef.current) {
        // Wave motion
        if (autoAnimate) {
          const wave = Math.sin(t * waveSpeed + p.phase) * waveAmplitude * p.depth * depthFactor;
          const wave2 = Math.cos(t * waveSpeed * 0.7 + p.phase * 1.3) * waveAmplitude * 0.5 * p.depth;
          p.originX += wave * 0.02;
          p.originY += wave2 * 0.02;
          
          // Keep in bounds
          if (p.originX < 0) p.originX = w;
          if (p.originX > w) p.originX = 0;
          if (p.originY < 0) p.originY = h;
          if (p.originY > h) p.originY = 0;
        }

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < magnetRadius) {
          const force = (magnetRadius - dist) / magnetRadius * fieldStrength;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.3;
          p.vy += Math.sin(angle) * force * 0.3;
        }

        // Lerp back to origin
        p.vx += (p.originX - p.x) * lerpSpeed * 0.5;
        p.vy += (p.originY - p.y) * lerpSpeed * 0.5;
        
        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;
        
        p.x += p.vx;
        p.y += p.vy;

        // Pulse
        const pulse = 1 + Math.sin(t * pulseSpeed + p.phase) * 0.15;
        const size = p.size * pulse * p.depth;
        const alpha = 0.3 + p.depth * 0.5;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        if (particleShape === "capsule") {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, size * 1.5, size, p.phase + t * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (particleShape === "square") {
          ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [count, magnetRadius, waveSpeed, waveAmplitude, particleSize, lerpSpeed, color, autoAnimate, particleVariance, depthFactor, pulseSpeed, particleShape, fieldStrength, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export default Antigravity;
