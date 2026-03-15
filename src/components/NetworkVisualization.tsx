import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

interface CityNode {
  id: number;
  x: number;
  y: number;
  type: "tower" | "home" | "hub";
  label: string;
  detail: string;
}

const cityNodes: CityNode[] = [
  { id: 1, x: 500, y: 120, type: "hub", label: "Central Hub", detail: "10 Gbps Backbone" },
  { id: 2, x: 180, y: 220, type: "tower", label: "Tower Alpha", detail: "2.4 / 5 GHz" },
  { id: 3, x: 820, y: 200, type: "tower", label: "Tower Beta", detail: "5 / 6 GHz" },
  { id: 4, x: 100, y: 380, type: "home", label: "Residential A", detail: "100 Mbps" },
  { id: 5, x: 320, y: 400, type: "home", label: "Residential B", detail: "150 Mbps" },
  { id: 6, x: 620, y: 370, type: "home", label: "Business Park", detail: "500 Mbps" },
  { id: 7, x: 900, y: 370, type: "home", label: "Residential C", detail: "100 Mbps" },
  { id: 8, x: 500, y: 310, type: "tower", label: "Tower Gamma", detail: "Point-to-Point" },
];

const connections = [
  [1, 2], [1, 3], [1, 8],
  [2, 4], [2, 5],
  [3, 6], [3, 7],
  [8, 5], [8, 6],
];

// Building silhouettes for the skyline
const buildings = [
  { x: 30, w: 40, h: 140 },
  { x: 75, w: 30, h: 90 },
  { x: 110, w: 50, h: 170 },
  { x: 165, w: 35, h: 110 },
  { x: 210, w: 45, h: 200 },
  { x: 260, w: 30, h: 130 },
  { x: 300, w: 55, h: 160 },
  { x: 360, w: 25, h: 80 },
  { x: 395, w: 40, h: 220 },
  { x: 440, w: 50, h: 180 },
  { x: 495, w: 35, h: 250 },
  { x: 535, w: 45, h: 150 },
  { x: 585, w: 30, h: 190 },
  { x: 620, w: 55, h: 120 },
  { x: 680, w: 40, h: 210 },
  { x: 725, w: 35, h: 140 },
  { x: 765, w: 50, h: 170 },
  { x: 820, w: 30, h: 100 },
  { x: 855, w: 45, h: 230 },
  { x: 905, w: 35, h: 160 },
  { x: 945, w: 40, h: 120 },
];

const DataPacket = ({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) => (
  <circle r="3" fill="hsl(var(--primary))" opacity="0.9">
    <animateMotion
      dur="2s"
      repeatCount="indefinite"
      begin={`${delay}s`}
      path={`M${x1},${y1} L${x2},${y2}`}
    />
    <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2s" repeatCount="indefinite" begin={`${delay}s`} />
  </circle>
);

const PulseRing = ({ cx, cy, color, delay = 0 }: { cx: number; cy: number; color: string; delay?: number }) => (
  <>
    <circle cx={cx} cy={cy} r="6" fill="none" stroke={color} strokeWidth="1" opacity="0">
      <animate attributeName="r" from="6" to="30" dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} />
      <animate attributeName="opacity" from="0.6" to="0" dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
    <circle cx={cx} cy={cy} r="6" fill="none" stroke={color} strokeWidth="0.5" opacity="0">
      <animate attributeName="r" from="6" to="45" dur="2.5s" repeatCount="indefinite" begin={`${delay + 0.8}s`} />
      <animate attributeName="opacity" from="0.3" to="0" dur="2.5s" repeatCount="indefinite" begin={`${delay + 0.8}s`} />
    </circle>
  </>
);

const NetworkVisualization = () => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  const skylineBaseY = 450;

  return (
    <section className="relative py-24 lg:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4 font-display">
            Network Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-display mb-4">
            A City, <span className="text-primary">Connected</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our distributed wireless network blankets the city with reliable, high-speed connectivity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-border/30"
          style={{ background: "linear-gradient(180deg, hsl(220 30% 4%) 0%, hsl(220 20% 7%) 60%, hsl(220 15% 10%) 100%)" }}
        >
          {/* Stars / sky dots */}
          <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-foreground/20"
                style={{
                  width: Math.random() > 0.7 ? 2 : 1,
                  height: Math.random() > 0.7 ? 2 : 1,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 40}%`,
                  animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <svg viewBox="0 0 1000 520" className="w-full relative z-10" style={{ minHeight: 300 }}>
            <defs>
              {/* Glow filter */}
              <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* Building window gradient */}
              <linearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(220 20% 12%)" />
                <stop offset="100%" stopColor="hsl(220 15% 6%)" />
              </linearGradient>
              {/* Ground glow */}
              <radialGradient id="groundGlow" cx="50%" cy="0%" r="60%">
                <stop offset="0%" stopColor="hsl(183 100% 50% / 0.06)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Ground glow */}
            <rect x="0" y={skylineBaseY - 20} width="1000" height="100" fill="url(#groundGlow)" />

            {/* Skyline buildings */}
            {buildings.map((b, i) => {
              const by = skylineBaseY - b.h;
              return (
                <g key={`b-${i}`}>
                  <rect
                    x={b.x} y={by} width={b.w} height={b.h}
                    fill="url(#buildingGrad)"
                    stroke="hsl(220 15% 16%)"
                    strokeWidth="0.5"
                    rx="1"
                  />
                  {/* Windows */}
                  {Array.from({ length: Math.floor(b.h / 18) }).map((_, row) =>
                    Array.from({ length: Math.floor(b.w / 12) }).map((_, col) => {
                      const lit = Math.random() > 0.45;
                      return (
                        <rect
                          key={`w-${i}-${row}-${col}`}
                          x={b.x + 4 + col * 12}
                          y={by + 6 + row * 18}
                          width={6}
                          height={8}
                          rx="0.5"
                          fill={lit ? "hsl(45 80% 70% / 0.5)" : "hsl(220 10% 8%)"}
                          opacity={lit ? 0.3 + Math.random() * 0.5 : 0.3}
                        />
                      );
                    })
                  )}
                </g>
              );
            })}

            {/* Ground line */}
            <line x1="0" y1={skylineBaseY} x2="1000" y2={skylineBaseY} stroke="hsl(183 100% 50% / 0.15)" strokeWidth="1" />

            {/* Connection lines */}
            {connections.map(([a, b], i) => {
              const nA = cityNodes.find(n => n.id === a)!;
              const nB = cityNodes.find(n => n.id === b)!;
              const active = hoveredNode === a || hoveredNode === b;
              return (
                <g key={`conn-${i}`}>
                  {/* Base line */}
                  <line
                    x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y}
                    stroke={active ? "hsl(183 100% 50% / 0.6)" : "hsl(183 100% 50% / 0.12)"}
                    strokeWidth={active ? 1.5 : 0.6}
                    strokeDasharray={active ? "none" : "4 4"}
                    style={{ transition: "all 0.4s ease" }}
                  />
                  {/* Glow line when active */}
                  {active && (
                    <line
                      x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y}
                      stroke="hsl(183 100% 50% / 0.15)"
                      strokeWidth="4"
                      filter="url(#glow-cyan)"
                    />
                  )}
                  {/* Data packets */}
                  {isVisible && (
                    <DataPacket x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y} delay={i * 0.4} />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {cityNodes.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isActive = isHovered || hoveredNode === null;
              const nodeColor = "hsl(183 100% 50%)";
              const size = node.type === "hub" ? 10 : node.type === "tower" ? 8 : 6;

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer" }}
                  opacity={isActive ? 1 : 0.4}
                  className="transition-opacity duration-300"
                >
                  {/* Outer glow */}
                  <circle cx={node.x} cy={node.y} r={size + 6} fill="hsl(183 100% 50% / 0.05)" />

                  {/* Node circle */}
                  <circle
                    cx={node.x} cy={node.y} r={size}
                    fill={node.type === "hub" ? "hsl(183 100% 50% / 0.25)" : node.type === "tower" ? "hsl(183 100% 50% / 0.15)" : "hsl(183 100% 50% / 0.1)"}
                    stroke={nodeColor}
                    strokeWidth={node.type === "hub" ? 2 : 1.2}
                    filter="url(#glow-cyan)"
                  />

                  {/* Inner dot */}
                  <circle cx={node.x} cy={node.y} r={size * 0.35} fill={nodeColor} />

                  {/* Hub icon - hexagon */}
                  {node.type === "hub" && (
                    <text x={node.x} y={node.y + 1.5} textAnchor="middle" fontSize="10" fill={nodeColor} fontFamily="monospace">⬡</text>
                  )}

                  {/* Pulse rings for towers and hub */}
                  {(node.type === "tower" || node.type === "hub") && isVisible && (
                    <PulseRing cx={node.x} cy={node.y} color={nodeColor} delay={node.id * 0.5} />
                  )}

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y - size - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fill={isHovered ? "hsl(183 100% 50%)" : "hsl(0 0% 55%)"}
                    fontFamily="'Space Grotesk', sans-serif"
                    fontWeight={isHovered ? "600" : "400"}
                    style={{ transition: "all 0.3s ease" }}
                  >
                    {node.label}
                  </text>

                  {/* Detail tooltip on hover */}
                  {isHovered && (
                    <g>
                      <rect
                        x={node.x - 50} y={node.y + size + 8}
                        width="100" height="28" rx="6"
                        fill="hsl(220 20% 8% / 0.95)"
                        stroke="hsl(183 100% 50% / 0.4)"
                        strokeWidth="1"
                      />
                      <text
                        x={node.x} y={node.y + size + 20}
                        textAnchor="middle" fontSize="10"
                        fill="hsl(183 100% 50%)"
                        fontFamily="'Space Grotesk', monospace"
                      >
                        ⚡ {node.detail}
                      </text>
                      <text
                        x={node.x} y={node.y + size + 32}
                        textAnchor="middle" fontSize="8"
                        fill="hsl(0 0% 45%)"
                        fontFamily="'Space Grotesk', sans-serif"
                      >
                        {node.type === "hub" ? "Core Infrastructure" : node.type === "tower" ? "Relay Point" : "Endpoint"}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend bar */}
          <div className="flex flex-wrap justify-center gap-6 px-6 pb-6 text-sm text-muted-foreground">
            {[
              { label: "Central Hub", icon: "⬡" },
              { label: "Relay Tower", icon: "◉" },
              { label: "Endpoint", icon: "●" },
              { label: "Active Link", icon: "—" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-primary text-xs">{item.icon}</span>
                <span className="font-display text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NetworkVisualization;
