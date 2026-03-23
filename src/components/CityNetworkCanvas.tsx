import { useRef, useEffect, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  type: "tower" | "home" | "hub";
  pulsePhase: number;
  connections: number[];
  label?: string;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

const CityNetworkCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const packetsRef = useRef<DataPacket[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const hoveredNodeRef = useRef<number>(-1);
  const timeRef = useRef(0);

  const initNetwork = useCallback((w: number, h: number) => {
    const nodes: Node[] = [];
    // Central hub
    nodes.push({ x: w * 0.5, y: h * 0.45, type: "hub", pulsePhase: 0, connections: [], label: "Central Hub" });
    // Towers
    const towerPositions = [
      { x: 0.2, y: 0.25, label: "Tower North" },
      { x: 0.8, y: 0.2, label: "Tower East" },
      { x: 0.15, y: 0.7, label: "Tower West" },
      { x: 0.85, y: 0.65, label: "Tower South" },
      { x: 0.5, y: 0.15, label: "Tower Central" },
    ];
    towerPositions.forEach((p, i) => {
      nodes.push({ x: w * p.x, y: h * p.y, type: "tower", pulsePhase: i * 1.2, connections: [], label: p.label });
    });
    // Homes scattered
    const homeCount = 30;
    for (let i = 0; i < homeCount; i++) {
      nodes.push({
        x: w * (0.08 + Math.random() * 0.84),
        y: h * (0.08 + Math.random() * 0.84),
        type: "home",
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }

    // Build connections: hub connects to all towers
    for (let i = 1; i <= 5; i++) {
      nodes[0].connections.push(i);
      nodes[i].connections.push(0);
    }
    // Each home connects to nearest tower
    for (let i = 6; i < nodes.length; i++) {
      let minDist = Infinity;
      let nearest = 1;
      for (let t = 1; t <= 5; t++) {
        const dx = nodes[i].x - nodes[t].x;
        const dy = nodes[i].y - nodes[t].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; nearest = t; }
      }
      nodes[i].connections.push(nearest);
      nodes[nearest].connections.push(i);
    }

    nodesRef.current = nodes;

    // Initialize data packets
    const packets: DataPacket[] = [];
    for (let i = 0; i < 12; i++) {
      const fromIdx = Math.floor(Math.random() * nodes.length);
      const conns = nodes[fromIdx].connections;
      if (conns.length > 0) {
        packets.push({
          fromNode: fromIdx,
          toNode: conns[Math.floor(Math.random() * conns.length)],
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.006,
        });
      }
    }
    packetsRef.current = packets;
  }, []);

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNetwork(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      hoveredNodeRef.current = -1;
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
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      // Check hovered node
      hoveredNodeRef.current = -1;
      for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - mouse.x;
        const dy = nodes[i].y - mouse.y;
        if (Math.sqrt(dx * dx + dy * dy) < 18) {
          hoveredNodeRef.current = i;
          break;
        }
      }

      // Draw connections
      const drawn = new Set<string>();
      for (const node of nodes) {
        const ni = nodes.indexOf(node);
        for (const ci of node.connections) {
          const key = `${Math.min(ni, ci)}-${Math.max(ni, ci)}`;
          if (drawn.has(key)) continue;
          drawn.add(key);
          const target = nodes[ci];
          const isHighlight = hoveredNodeRef.current === ni || hoveredNodeRef.current === ci;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = isHighlight
            ? "rgba(0, 245, 255, 0.5)"
            : "rgba(0, 245, 255, 0.1)";
          ctx.lineWidth = isHighlight ? 1.5 : 0.5;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = hoveredNodeRef.current === i;
        const pulse = Math.sin(t * 2 + n.pulsePhase) * 0.5 + 0.5;

        if (n.type === "hub") {
          // Glow
          const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 20);
          grd.addColorStop(0, `rgba(0, 245, 255, ${0.4 + pulse * 0.3})`);
          grd.addColorStop(1, "rgba(0, 245, 255, 0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
          ctx.fill();
          // Core
          ctx.fillStyle = `rgba(0, 245, 255, ${0.8 + pulse * 0.2})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (n.type === "tower") {
          // Signal rings
          const ringAlpha = (1 - pulse) * 0.25;
          ctx.strokeStyle = `rgba(0, 245, 255, ${ringAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 8 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();
          // Tower dot
          ctx.fillStyle = isHovered ? "rgba(0, 245, 255, 1)" : `rgba(0, 245, 255, ${0.7 + pulse * 0.3})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, isHovered ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Tower triangle
          ctx.beginPath();
          ctx.moveTo(n.x, n.y - 8);
          ctx.lineTo(n.x - 4, n.y + 2);
          ctx.lineTo(n.x + 4, n.y + 2);
          ctx.closePath();
          ctx.fillStyle = `rgba(0, 245, 255, ${0.4 + pulse * 0.2})`;
          ctx.fill();
        } else {
          // Home - small dot
          const alpha = isHovered ? 1 : 0.4 + pulse * 0.3;
          ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, isHovered ? 3.5 : 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tooltip on hover
        if (isHovered && n.label) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          const tw = ctx.measureText(n.label).width + 16;
          ctx.beginPath();
          ctx.roundRect(n.x - tw / 2, n.y - 30, tw, 22, 4);
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 245, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "rgba(0, 245, 255, 0.9)";
          ctx.font = "11px monospace";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y - 15);
        }
      }

      // Animate data packets
      for (const p of packetsRef.current) {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.fromNode = p.toNode;
          const conns = nodes[p.toNode].connections;
          p.toNode = conns[Math.floor(Math.random() * conns.length)];
        }
        const from = nodes[p.fromNode];
        const to = nodes[p.toNode];
        if (!from || !to) continue;
        const px = from.x + (to.x - from.x) * p.progress;
        const py = from.y + (to.y - from.y) * p.progress;
        ctx.fillStyle = "rgba(0, 245, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Trail
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 6);
        grd.addColorStop(0, "rgba(0, 245, 255, 0.3)");
        grd.addColorStop(1, "rgba(0, 245, 255, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initNetwork]);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-crosshair"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export default CityNetworkCanvas;
