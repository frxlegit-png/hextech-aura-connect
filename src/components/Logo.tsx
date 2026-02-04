import { motion } from "framer-motion";
import logoImage from "@/assets/hextech-logo.png";

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className = "", size = 40 }: LogoProps) => {
  return (
    <motion.img
      src={logoImage}
      alt="Hextech Logo"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
};

export default Logo;
