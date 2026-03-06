import { Twitter, Facebook, Instagram, Linkedin, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: "About Us", href: "#about" },
      { label: "Coverage", href: "#coverage" },
      { label: "Careers", href: "#" },
      { label: "Admin Login", href: "/auth" },
    ],
    services: [
      { label: "Residential", href: "#services" },
      { label: "Business", href: "#services" },
      { label: "Enterprise", href: "#" },
      { label: "Partners", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "#contact" },
      { label: "Network Status", href: "#" },
      { label: "Speed Test", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Acceptable Use", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="relative border-t border-border" style={{ background: "hsl(0 0% 3%)" }}>
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 mb-6">
              <Logo size={36} />
              <span className="text-lg font-bold text-foreground font-display">
                Hex<span className="text-primary">tech</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Next-generation wireless internet service provider. Fast, reliable, and affordable connectivity for everyone.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors duration-300"
                  style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 12%)" }}
                  whileHover={{ scale: 1.1, y: -2, borderColor: "hsl(183 100% 50% / 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-foreground mb-4 capitalize font-display text-sm">{title}</h4>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Hextech. All rights reserved.
          </p>
          <motion.a
            href="#"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors group font-display"
            whileHover={{ y: -2 }}
          >
            Back to top
            <ArrowUpRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
          </motion.a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
