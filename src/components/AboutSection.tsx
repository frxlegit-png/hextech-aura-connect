import { Globe, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const AboutSection = () => {
  const stats = [
    { icon: Globe, value: "10+", label: "Coverage Areas" },
    { icon: Users, value: "5K+", label: "Happy Customers" },
    { icon: BarChart3, value: "99.9%", label: "Network Uptime" },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 section-gradient">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <ScrollReveal>
            <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
              About Hextech
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              The Future of{" "}
              <span className="text-primary">Wireless Connectivity</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Hextech is a next-generation wireless internet service provider committed to 
              delivering blazing-fast, reliable connectivity to homes and businesses. 
              We leverage cutting-edge technology to provide seamless internet experiences 
              without the limitations of traditional cable infrastructure.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our network is built for performance, reliability, and scalability. Whether 
              you're streaming, gaming, working from home, or running a business, Hextech 
              delivers the speed and stability you need to stay connected.
            </p>

            {/* Stats */}
            <StaggerContainer className="grid grid-cols-3 gap-6 mt-10" staggerDelay={0.15}>
              {stats.map((stat, index) => (
                <StaggerItem key={index}>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </ScrollReveal>

          {/* Visual */}
          <ScrollReveal delay={0.2} direction="right">
            <div className="relative">
              <motion.div 
                className="glass-card p-8 rounded-3xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <div className="aspect-square relative flex items-center justify-center">
                  {/* Animated network visualization */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Outer ring */}
                    <motion.div 
                      className="absolute w-full h-full rounded-full border border-primary/20"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Middle ring */}
                    <motion.div 
                      className="absolute w-3/4 h-3/4 rounded-full border border-primary/30"
                      animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    {/* Inner ring */}
                    <motion.div 
                      className="absolute w-1/2 h-1/2 rounded-full border border-primary/40"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    
                    {/* Connection lines */}
                    {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-px h-1/2 bg-gradient-to-b from-primary/50 to-transparent origin-bottom"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                    
                    {/* Center hexagon */}
                    <motion.div 
                      className="relative w-24 h-24 rounded-xl flex items-center justify-center bg-primary/20"
                      animate={{ 
                        boxShadow: [
                          "0 0 20px hsl(185 100% 50% / 0.2)",
                          "0 0 40px hsl(185 100% 50% / 0.4)",
                          "0 0 20px hsl(185 100% 50% / 0.2)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg viewBox="0 0 100 100" className="w-16 h-16 text-primary">
                        <polygon
                          points="50,10 85,30 85,70 50,90 15,70 15,30"
                          fill="currentColor"
                          opacity="0.8"
                        />
                      </svg>
                    </motion.div>
                    
                    {/* Orbiting dots */}
                    {[0, 90, 180, 270].map((rotation, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-primary"
                        style={{
                          transformOrigin: "center",
                        }}
                        animate={{
                          x: Math.cos((rotation + 360) * Math.PI / 180) * 120,
                          y: Math.sin((rotation + 360) * Math.PI / 180) * 120,
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div 
                className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
