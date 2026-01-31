import { Zap, Shield, HeadphonesIcon, DollarSign, Wifi, TrendingUp } from "lucide-react";

const WhyChooseSection = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "No Setup Fees",
      description: "Get started without any upfront costs. We believe in making connectivity accessible to everyone.",
    },
    {
      icon: Shield,
      title: "No Equipment Costs",
      description: "All hardware is included with your subscription. No hidden charges or surprise bills.",
    },
    {
      icon: TrendingUp,
      title: "Reliable Uptime",
      description: "Our network maintains 99.9% uptime with redundant systems ensuring you stay connected.",
    },
    {
      icon: HeadphonesIcon,
      title: "Fast Support",
      description: "Our dedicated support team is available to help you with any issues, anytime.",
    },
    {
      icon: Wifi,
      title: "Scalable Network",
      description: "As your needs grow, our network grows with you. Upgrade seamlessly without interruption.",
    },
    {
      icon: Zap,
      title: "Low Latency",
      description: "Optimized for real-time applications. Perfect for gaming, video calls, and streaming.",
    },
  ];

  return (
    <section id="why-us" className="relative py-24 lg:py-32 section-gradient">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Built for <span className="text-primary">Performance</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've designed every aspect of our service to deliver the best possible internet experience.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative"
            >
              <div className="glass-card h-full p-8 rounded-2xl transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
