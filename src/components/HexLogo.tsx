import { motion } from "framer-motion";

interface HexLogoProps {
  className?: string;
  size?: number;
}

const HexLogo = ({ className = "", size = 40 }: HexLogoProps) => {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(280, 100%, 60%)" />
          <stop offset="100%" stopColor="hsl(260, 100%, 50%)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer C shape */}
      <motion.path
        d="M 70 20 
           C 45 20, 25 35, 25 50 
           C 25 65, 45 80, 70 80"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      
      {/* Inner highlight */}
      <motion.path
        d="M 65 30 
           C 48 30, 35 38, 35 50 
           C 35 62, 48 70, 65 70"
        fill="none"
        stroke="hsl(280, 100%, 70%)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  );
};

export default HexLogo;
