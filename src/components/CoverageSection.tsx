import { MapPin, Signal, Check } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { lazy, Suspense, useState } from "react";
import { useCoverageAreas } from "@/hooks/useCoverageAreas";

// Lazy load the map component
const CoverageMap = lazy(() => import("@/components/CoverageMap"));

const CoverageSection = () => {
  const { areas: coverageAreas, isLoading } = useCoverageAreas();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    inCoverage: boolean;
  } | null>(null);

  const networkStats = [
    { label: "Network Nodes", value: "150+" },
    { label: "Bandwidth Capacity", value: "10 Gbps" },
    { label: "Avg. Latency", value: "<15ms" },
    { label: "Coverage Radius", value: "50+ km" },
  ];

  const handleLocationSelect = (lat: number, lng: number, inCoverage: boolean) => {
    setSelectedLocation({ lat, lng, inCoverage });
  };

  return (
    <section id="coverage" className="relative py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Content */}
          <ScrollReveal>
            <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
              Network Coverage
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Expanding Across{" "}
              <span className="text-primary">Zimbabwe</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our wireless network is constantly growing to bring high-speed internet 
              to more communities. Click on the map to check if your area is covered 
              or register your interest for upcoming expansions.
            </p>

            {/* Coverage Status Message */}
            {selectedLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl mb-8 ${
                  selectedLocation.inCoverage 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : "bg-yellow-500/10 border border-yellow-500/30"
                }`}
              >
                <p className={`font-semibold ${
                  selectedLocation.inCoverage ? "text-green-500" : "text-yellow-500"
                }`}>
                  {selectedLocation.inCoverage 
                    ? "✓ Great news! Your location is covered!" 
                    : "⏳ Not covered yet - register your interest below!"}
                </p>
              </motion.div>
            )}

            {/* Coverage Areas */}
            <StaggerContainer className="grid grid-cols-2 gap-3 mb-10">
              {coverageAreas.slice(0, 6).map((area) => (
                <StaggerItem key={area.id}>
                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
                    whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary) / 0.3)" }}
                    transition={{ duration: 0.2 }}
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
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>

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
          </ScrollReveal>

          {/* Interactive Map */}
          <ScrollReveal delay={0.2} direction="right">
            <div className="glass-card p-4 rounded-3xl">
              {/* Map Container */}
              <div className="aspect-square relative bg-secondary/30 rounded-2xl overflow-hidden">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Signal className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                }>
                  <CoverageMap onLocationSelect={handleLocationSelect} />
                </Suspense>
              </div>

              {/* Network stats */}
              <StaggerContainer className="grid grid-cols-2 gap-4 mt-6">
                {networkStats.map((stat, index) => (
                  <StaggerItem key={index}>
                    <motion.div 
                      className="text-center p-4 rounded-xl bg-secondary/50"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CoverageSection;
