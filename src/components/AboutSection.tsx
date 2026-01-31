import { Globe, Users, BarChart3 } from "lucide-react";

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
          <div>
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
            <div className="grid grid-cols-3 gap-6 mt-10">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="glass-card p-8 rounded-3xl">
              <div className="aspect-square relative flex items-center justify-center">
                {/* Animated network visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Outer ring */}
                  <div className="absolute w-full h-full rounded-full border border-primary/20 animate-pulse" />
                  {/* Middle ring */}
                  <div className="absolute w-3/4 h-3/4 rounded-full border border-primary/30" style={{ animationDelay: "1s" }} />
                  {/* Inner ring */}
                  <div className="absolute w-1/2 h-1/2 rounded-full border border-primary/40" />
                  
                  {/* Connection lines */}
                  {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
                    <div
                      key={i}
                      className="absolute w-px h-1/2 bg-gradient-to-b from-primary/50 to-transparent origin-bottom"
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />
                  ))}
                  
                  {/* Center hexagon */}
                  <div className="relative w-24 h-24 animate-pulse-glow rounded-xl flex items-center justify-center bg-primary/20">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-primary">
                      <polygon
                        points="50,10 85,30 85,70 50,90 15,70 15,30"
                        fill="currentColor"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                  
                  {/* Orbiting dots */}
                  {[0, 90, 180, 270].map((rotation, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 rounded-full bg-primary glow-effect"
                      style={{
                        transform: `rotate(${rotation}deg) translateY(-120px)`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
