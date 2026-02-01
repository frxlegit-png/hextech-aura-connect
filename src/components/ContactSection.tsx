import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Request Submitted!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: "", email: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactInfo = [
    { icon: MapPin, label: "Location", value: "Harare, Zimbabwe" },
    { icon: Phone, label: "WhatsApp", value: "+263 78 380 0102" },
    { icon: Mail, label: "Email", value: "info@hextech.co.zw" },
  ];

  return (
    <section id="contact" className="relative py-24 lg:py-32 section-gradient">
      <div className="container mx-auto px-6">
        {/* Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            Get Started
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to <span className="text-primary">Connect?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Fill out the form below and our team will reach out to schedule your installation.
          </p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <ScrollReveal className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6">Contact Information</h3>
              <StaggerContainer className="space-y-4" staggerDelay={0.1}>
                {contactInfo.map((info, index) => (
                  <StaggerItem key={index}>
                    <motion.div 
                      className="flex items-start gap-4"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div 
                        className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1, backgroundColor: "hsl(185 100% 50% / 0.2)" }}
                      >
                        <info.icon className="w-5 h-5 text-primary" />
                      </motion.div>
                      <div>
                        <div className="text-sm text-muted-foreground">{info.label}</div>
                        <div className="text-foreground">{info.value}</div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {/* Hours */}
            <motion.div 
              className="glass-card p-6 rounded-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-sm font-semibold text-foreground mb-4">Support Hours</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span className="text-foreground">8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday</span>
                  <span className="text-foreground">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="text-foreground">Closed</span>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Contact Form */}
          <ScrollReveal className="lg:col-span-3" delay={0.2} direction="right">
            <motion.div 
              className="glass-card p-8 rounded-3xl"
              whileHover={{ boxShadow: "0 0 40px hsl(185 100% 50% / 0.1)" }}
              transition={{ duration: 0.4 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-secondary/50 border-border/50 focus:border-primary h-12"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-secondary/50 border-border/50 focus:border-primary h-12"
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+263 77 000 0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-secondary/50 border-border/50 focus:border-primary h-12"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your location and internet needs..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="bg-secondary/50 border-border/50 focus:border-primary resize-none"
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="xl" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Request Installation
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
