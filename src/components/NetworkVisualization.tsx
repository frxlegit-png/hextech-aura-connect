import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Node {
  id: number;
  x: number;
  y: number;
  type: "tower" | "home" | "hub";
  label: string;
  detail: string;
}

const nodes: Node[] = [
  { id: 1, x: 50, y: 20, type: "hub", label: "Central Hub", detail: "10 Gbps backbone" },
  { id: 2, x: 25, y: 45, type: "tower", label: "Tower Alpha", detail: "2.4 GHz / 5 GHz" },
  { id: 3, x: 75, y: 40, type: "tower", label: "Tower Beta", detail: "5 GHz / 6 GHz" },
  { id: 4, x: 15, y: 70, type: "home", label: "Residential A", detail: "100 Mbps" },
  { id: 5, x: 35, y: 75, type: "home", label: "Residential B", detail: "150 Mbps" },
  { id: 6, x: 65, y: 68, type: "home", label: "Business Park", detail: "500 Mbps" },
  { id: 7, x: 85, y: 65, type: "home", label: "Residential C", detail: "100 Mbps" },
  { id: 8, x: 50, y: 55, type: "tower", label: "Tower Gamma", detail: "Point-to-Point" },
];

const connections = [
  [1, 2], [1, 3], [1, 8],
  [2, 4], [2, 5],
  [3, 6], [3, 7],
  [8, 5], [8, 6],
];

const NodeIcon = ({ type, active }: { type: string; active: boolean }) => {
  const color = active ? "#00F5FF" : "hsl(0 0% 40%)";
  const size = type === "hub" ? 20 : type === "tower" ? 16 : 12;
  
  if (type === "hub") {
    return (
      <g>
        <polygon points={`0,-${size} ${size*0.87},-${size*0.5} ${size*0.87},${size*0.5} 0,${size} -${size*0.87},${size*0.5} -${size*0.87},-${size*0.5}`}
          fill={active ? "hsl(183 100% 50% / 0.2)" : "hsl(0 0% 10%)"}
          stroke={color}
          strokeWidth="1.5"
        />
        {active && <circle r={size + 8} fill="none" stroke={color} strokeWidth="0.5" opacity={0.3}>
          <animate attributeName="r" from={String(size + 4)} to={String(size + 20)} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
        </circle>}
      </g>
    );
  }

  if (type === "tower") {
    return (
      <g>
        <rect x={-size/3} y={-size} width={size*0.67} height={size*2} rx="2"
          fill={active ? "hsl(183 100% 50% / 0.15)" : "hsl(0 0% 8%)"}
          stroke={color} strokeWidth="1"
        />
        <line x1={0} y1={-size} x2={-size*0.8} y2={-size*0.3} stroke={color} strokeWidth="0.8" />
        <line x1={0} y1={-size} x2={size*0.8} y2={-size*0.3} stroke={color} strokeWidth="0.8" />
        {active && <>
          <circle cx={-size*0.8} cy={-size*0.3} r={3} fill="none" stroke="#00F5FF" strokeWidth="0.5">
            <animate attributeName="r" from="3" to="12" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={size*0.8} cy={-size*0.3} r={3} fill="none" stroke="#00F5FF" strokeWidth="0.5">
            <animate attributeName="r" from="3" to="12" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
          </circle>
        </>}
      </g>
    );
  }

  return (
    <g>
      <rect x={-size*0.6} y={-size*0.5} width={size*1.2} height={size} rx="2"
        fill={active ? "hsl(183 100% 50% / 0.1)" : "hsl(0 0% 6%)"}
        stroke={color} strokeWidth="0.8"
      />
      <line x1={-size*0.3} y1={-size*0.5} x2={-size*0.3} y2={-size*0.8} stroke={color} strokeWidth="0.5" />
      <line x1={size*0.3} y1={-size*0.5} x2={size*0.3} y2={-size*0.8} stroke={color} strokeWidth="0.5" />
    </g>
  );
};

const NetworkVisualization = () => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            How We <span className="text-primary">Connect</span> You
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our distributed wireless network ensures reliable, high-speed connectivity from hub to home.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="glass-card p-6 md:p-10 rounded-3xl max-w-4xl mx-auto"
        >
          <svg viewBox="0 0 100 90" className="w-full" style={{ maxHeight: "500px" }}>
            {/* Grid lines */}
            {[20, 40, 60, 80].map(y => (
              <line key={`h${y}`} x1="5" y1={y} x2="95" y2={y} stroke="hsl(0 0% 15%)" strokeWidth="0.1" />
            ))}
            {[20, 40, 60, 80].map(x => (
              <line key={`v${x}`} x1={x} y1="5" x2={x} y2="85" stroke="hsl(0 0% 15%)" strokeWidth="0.1" />
            ))}

            {/* Connections */}
            {connections.map(([a, b], i) => {
              const nodeA = nodes.find(n => n.id === a)!;
              const nodeB = nodes.find(n => n.id === b)!;
              const isActive = hoveredNode === a || hoveredNode === b;
              return (
                <g key={i}>
                  <line
                    x1={nodeA.x} y1={nodeA.y} x2={nodeB.x} y2={nodeB.y}
                    stroke={isActive ? "#00F5FF" : "hsl(0 0% 20%)"}
                    strokeWidth={isActive ? "0.4" : "0.2"}
                    strokeDasharray={isActive ? "none" : "1 1"}
                    style={{ transition: "all 0.5s ease" }}
                  />
                  {/* Data packet animation */}
                  {isActive && (
                    <circle r="0.8" fill="#00F5FF">
                      <animateMotion
                        dur="1.5s"
                        repeatCount="indefinite"
                        path={`M${nodeA.x},${nodeA.y} L${nodeB.x},${nodeB.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isActive = hoveredNode === node.id || hoveredNode === null;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer" }}
                >
                  <NodeIcon type={node.type} active={isActive} />
                  
                  {/* Tooltip */}
                  {hoveredNode === node.id && (
                    <g>
                      <rect
                        x={-20} y={node.type === "home" ? 14 : 22}
                        width="40" height="14" rx="2"
                        fill="hsl(0 0% 5% / 0.95)"
                        stroke="#00F5FF"
                        strokeWidth="0.3"
                      />
                      <text
                        x={0} y={node.type === "home" ? 22 : 30}
                        textAnchor="middle"
                        fontSize="3"
                        fill="#00F5FF"
                        fontFamily="Space Grotesk, Inter, sans-serif"
                      >
                        {node.label}
                      </text>
                      <text
                        x={0} y={node.type === "home" ? 26 : 34}
                        textAnchor="middle"
                        fontSize="2.2"
                        fill="hsl(0 0% 50%)"
                        fontFamily="Inter, sans-serif"
                      >
                        {node.detail}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-muted-foreground">
            {[
              { label: "Central Hub", color: "bg-primary" },
              { label: "Relay Tower", color: "bg-primary/60" },
              { label: "End User", color: "bg-primary/30" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NetworkVisualization;
