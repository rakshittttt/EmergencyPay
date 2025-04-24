import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

interface QuickActionButtonProps {
  icon: string;
  label: string;
  path: string;
  delay?: number;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, path, delay = 0 }) => {
  return (
    <Link href={path}>
      <motion.a
        className="flex flex-col items-center justify-center cursor-pointer"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: delay * 0.1 + 0.2, duration: 0.3 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center mb-2">
          <i className={`${icon} text-2xl text-primary`}></i>
        </div>
        <span className="text-xs text-gray-700">{label}</span>
      </motion.a>
    </Link>
  );
};

export default QuickActionButton;
