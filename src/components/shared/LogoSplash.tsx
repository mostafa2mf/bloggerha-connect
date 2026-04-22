import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const LogoSplash = () => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
    <motion.img
      src={logo}
      alt="Bloggerha"
      className="w-32 h-32 object-contain"
      style={{ filter: 'drop-shadow(0 0 24px rgba(218,165,32,0.7))' }}
      initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
      animate={{
        scale: [0.6, 1.1, 1],
        opacity: [0, 1, 1],
        rotate: [-10, 0, 0],
      }}
      transition={{ duration: 1.4, ease: 'easeOut', times: [0, 0.6, 1] }}
    />
  </div>
);

export default LogoSplash;
