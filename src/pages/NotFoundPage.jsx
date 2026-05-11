import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const MotionSpan = motion.span;
  const MotionButton = motion.button;

  const stars = [
    { left: '8%', top: '14%', size: 'h-1 w-1', delay: 0.2 },
    { left: '18%', top: '28%', size: 'h-1.5 w-1.5', delay: 1.1 },
    { left: '27%', top: '10%', size: 'h-1 w-1', delay: 2.1 },
    { left: '37%', top: '33%', size: 'h-1 w-1', delay: 1.6 },
    { left: '45%', top: '18%', size: 'h-1.5 w-1.5', delay: 0.9 },
    { left: '53%', top: '8%', size: 'h-1 w-1', delay: 1.8 },
    { left: '61%', top: '24%', size: 'h-1 w-1', delay: 2.5 },
    { left: '72%', top: '12%', size: 'h-1.5 w-1.5', delay: 1.3 },
    { left: '82%', top: '30%', size: 'h-1 w-1', delay: 0.4 },
    { left: '90%', top: '17%', size: 'h-1 w-1', delay: 2.3 },
    { left: '14%', top: '63%', size: 'h-1.5 w-1.5', delay: 0.7 },
    { left: '26%', top: '78%', size: 'h-1 w-1', delay: 1.9 },
    { left: '36%', top: '68%', size: 'h-1 w-1', delay: 2.7 },
    { left: '49%', top: '74%', size: 'h-1.5 w-1.5', delay: 1.4 },
    { left: '59%', top: '62%', size: 'h-1 w-1', delay: 0.5 },
    { left: '71%', top: '72%', size: 'h-1 w-1', delay: 1.7 },
    { left: '81%', top: '61%', size: 'h-1.5 w-1.5', delay: 2.2 },
    { left: '92%', top: '76%', size: 'h-1 w-1', delay: 1.0 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-6 py-14 md:px-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#020617] to-[#020617]" />
      <div className="absolute -top-28 left-1/4 h-80 w-80 rounded-full bg-[#3b82f6]/10 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#60a5fa]/10 blur-3xl" />

      {stars.map((star, index) => (
        <MotionSpan
          key={`${star.left}-${star.top}`}
          className={`absolute ${star.size} rounded-full bg-[#e2e8f0]`}
          style={{ left: star.left, top: star.top }}
          animate={{ opacity: [0.15, 0.9, 0.2], scale: [0.85, 1.15, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay + index * 0.05 }}
        />
      ))}

      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl"
      >
        <div className="relative">
          <div className="pointer-events-none absolute -left-6 top-8 h-40 w-40 rounded-full border border-[#3b82f6]/20" />
          <div className="pointer-events-none absolute bottom-8 right-4 h-28 w-28 rounded-full border border-[#60a5fa]/20" />

          <div className="grid items-center gap-14 md:grid-cols-[1.1fr_1fr] md:gap-20">
            <MotionDiv
              variants={itemVariants}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto w-full max-w-lg"
            >
              <img
                src="/satellite.png"
                alt="Satellite"
                className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(2,6,23,0.8)]"
              />
              <MotionDiv
                className="absolute -bottom-3 left-1/2 h-20 w-40 -translate-x-1/2 rounded-[999px] border border-[#3b82f6]/30"
                animate={{ scaleX: [0.85, 1.1, 0.9], opacity: [0.25, 0.5, 0.3] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </MotionDiv>

            <MotionDiv variants={itemVariants} className="text-center md:text-left md:pl-4">
              <h1 className="text-[clamp(4.25rem,17vw,8rem)] font-black leading-[0.9] tracking-tight text-[#60a5fa]">
                404
              </h1>
              <p className="mt-2 text-base font-semibold text-[#e2e8f0] sm:text-lg md:text-xl lg:text-2xl">
                Oops... Looks like you are lost in space!
              </p>
              <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-[#94a3b8] sm:text-base md:mx-0 md:text-[1.05rem]">
                The page you are looking for doesn't exist or has been moved. Let's get you back on track!
              </p>

              <MotionButton
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate({ to: '/dashboard' })}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#60a5fa]/50 bg-[#0f172a]/70 px-6 py-3 text-xs font-semibold tracking-wide text-[#dbeafe] transition hover:border-[#93c5fd] hover:bg-[#1e293b] sm:w-auto sm:px-7 sm:py-3.5 sm:text-sm"
              >
                <Home size={18} />
                GO BACK HOME
              </MotionButton>
            </MotionDiv>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}
