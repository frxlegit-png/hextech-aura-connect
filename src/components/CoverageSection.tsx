import { MapPin, Signal, Check } from "lucide-react";

const CoverageSection = () => {
  const coverageAreas = [
    { name: "Downtown District", status: "active" },
    { name: "Industrial Zone", status: "active" },
    { name: "Residential North", status: "active" },
    { name: "Business Park", status: "active" },
    { name: "Suburban East", status: "expanding" },
    { name: "Harbor Area", status: "active" },
  ];

  const networkStats = [
    { label: "Network Nodes", value: "150+" },
    { label: "Bandwidth Capacity", value: "10 Gbps" },
    { label: "Avg. Latency", value: "<15ms" },
    { label: "Coverage Radius", value: "50+ km" },
  ];

  return (
    <section id="coverage" className="relative py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
              Network Coverage
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Expanding Across{" "}
              <span className="text-primary">Your Region</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our wireless network is constantly growing to bring high-speed internet 
              to more communities. Check if your area is covered or register your 
              interest for upcoming expansions.
            </p>

            {/* Coverage Areas */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {coverageAreas.map((area, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      area.status === "active" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-sm text-foreground">{area.name}</span>
                  {area.status === "expanding" && (
                    <span className="text-xs text-yellow-500 ml-auto">Soon</span>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Active Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Network Visualization */}
          <div className="relative">
            <div className="glass-card p-8 rounded-3xl">
              {/* Map placeholder with network visualization */}
              <div className="aspect-square relative bg-secondary/30 rounded-2xl overflow-hidden">
                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                  }}
                />
                
                {/* Central tower */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center glow-effect">
                      <Signal className="w-4 h-4 text-primary-foreground" />
                    </div>
                    {/* Signal waves */}
                    <div className="absolute -inset-4 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "3s" }} />
                    <div className="absolute -inset-8 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
                    <div className="absolute -inset-12 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: "3s", animationDelay: "2s" }} />
                  </div>
                </div>

                {/* Coverage nodes */}
                {[
                  { top: "25%", left: "30%" },
                  { top: "20%", left: "70%" },
                  { top: "60%", left: "20%" },
                  { top: "75%", left: "65%" },
                  { top: "40%", left: "80%" },
                  { top: "70%", left: "35%" },
                ].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-4 h-4 rounded-full bg-primary/60 flex items-center justify-center"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <MapPin className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                ))}

                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(185 100% 50% / 0.3)" />
                      <stop offset="50%" stopColor="hsl(185 100% 50% / 0.6)" />
                      <stop offset="100%" stopColor="hsl(185 100% 50% / 0.3)" />
                    </linearGradient>
                  </defs>
                  <line x1="50%" y1="50%" x2="30%" y2="25%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="70%" y2="20%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="20%" y2="60%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="65%" y2="75%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="80%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="35%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
                </svg>
              </div>

              {/* Network stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {networkStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 rounded-xl bg-secondary/50">
                    <div className="text-xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoverageSection;
