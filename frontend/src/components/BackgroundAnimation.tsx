'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  targetX?: number;
  targetY?: number;
  phase: 'floating' | 'converging' | 'spreading';
}

interface Bottle {
  x: number;
  y: number;
  index: number;
  angle: number;
}

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const bottlesRef = useRef<Bottle[]>([]);
  const timeRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const isFinePointerRef = useRef(false);
  const isScrollActiveRef = useRef(false);
  const scrollStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let radialGlow: CanvasGradient;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      radialGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.6,
      );
      radialGlow.addColorStop(0, 'rgba(139, 94, 60, 0.06)');
      radialGlow.addColorStop(0.5, 'rgba(228, 194, 133, 0.03)');
      radialGlow.addColorStop(1, 'transparent');
    };
    resizeCanvas();

    // Initialize bottles (fragrance containers)
    const initBottles = () => {
      bottlesRef.current = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, index: 0, angle: 0 },
        { x: canvas.width * 0.5, y: canvas.height * 0.2, index: 1, angle: 0 },
        { x: canvas.width * 0.8, y: canvas.height * 0.4, index: 2, angle: 0 },
        { x: canvas.width * 0.35, y: canvas.height * 0.7, index: 3, angle: 0 },
        { x: canvas.width * 0.7, y: canvas.height * 0.65, index: 4, angle: 0 },
      ];
    };
    initBottles();

    // Draw bottle shape (fragrance vessels)
    const drawBottle = (x: number, y: number, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity * 0.8;
      ctx.strokeStyle = `rgba(244, 187, 146, ${opacity * 0.5})`; // Amber bottles
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      // Bottle body (rounded square)
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 12);
      ctx.lineTo(x + 8, y - 12);
      ctx.quadraticCurveTo(x + 12, y - 8, x + 12, y);
      ctx.lineTo(x + 12, y + 15);
      ctx.quadraticCurveTo(x + 8, y + 20, x - 8, y + 20);
      ctx.lineTo(x - 12, y + 15);
      ctx.quadraticCurveTo(x - 12, y - 8, x - 8, y - 12);
      ctx.stroke();

      // Bottle cap (accent color)
      ctx.fillStyle = `rgba(228, 194, 133, ${opacity * 0.7})`; // Gold cap
      ctx.fillRect(x - 5, y - 14, 10, 3);

      ctx.restore();
    };

    isFinePointerRef.current = window.matchMedia('(pointer: fine)').matches;

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = isFinePointerRef.current ? 44 : 80;
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          color: Math.random() > 0.5 ? '#f4bb92' : '#e4c285', // Amber or Gold
          phase: 'floating',
        });
      }
    };
    initParticles();

    // Animation loop
    const animate = (timestamp: number) => {
      const frameBudget = isFinePointerRef.current ? 1000 / 36 : 1000 / 45;
      if (timestamp - lastFrameTimeRef.current < frameBudget) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      timeRef.current += 1;
      const cycle = timeRef.current % 800; // 8 second cycle at 100fps
      const reduceDuringScroll = isFinePointerRef.current && isScrollActiveRef.current;

      // Clear canvas with light botanical background
      // Dark velvet background — transparent so CSS background shows through
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle radial glow at center
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bottles
      bottlesRef.current.forEach((bottle) => {
        bottle.angle += 0.01;
        const bobY = bottle.y + Math.sin(bottle.angle) * 8;
        const opacity = 0.3 + Math.sin(cycle / 100) * 0.2;
        drawBottle(bottle.x, bobY, opacity);
      });

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Determine particle phase based on animation cycle
        if (cycle < 200) {
          particle.phase = 'floating';
        } else if (cycle < 500) {
          particle.phase = 'converging';
        } else {
          particle.phase = 'spreading';
        }

        // Apply physics based on phase
        if (particle.phase === 'floating') {
          const drift = 0.025;
          particle.vx += Math.sin((timeRef.current + index * 7) * 0.02) * drift;
          particle.vy += Math.cos((timeRef.current + index * 9) * 0.02) * drift;
          particle.vx *= 0.98;
          particle.vy *= 0.98;
        } else if (particle.phase === 'converging' && !reduceDuringScroll) {
          // Particles converge toward center (matching/recommendation)
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const dx = centerX - particle.x;
          const dy = centerY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 50) {
            particle.vx += (dx / distance) * 0.3;
            particle.vy += (dy / distance) * 0.3;
          }
          particle.vx *= 0.95;
          particle.vy *= 0.95;
        } else if (!reduceDuringScroll) {
          // Spreading phase (results displaying)
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const dx = particle.x - centerX;
          const dy = particle.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 300) {
            particle.vx += (dx / (distance + 1)) * 0.2;
            particle.vy += (dy / (distance + 1)) * 0.2;
          }
          particle.vx *= 0.95;
          particle.vy *= 0.95;
        } else {
          particle.vx *= 0.985;
          particle.vy *= 0.985;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Update opacity based on phase
        if (particle.phase === 'floating') {
          particle.opacity = 0.3 + Math.sin(cycle / 50 + index) * 0.3;
        } else if (particle.phase === 'converging') {
          particle.opacity = 0.4 + Math.sin((cycle - 200) / 50) * 0.4;
        } else {
          particle.opacity = 0.5 + Math.sin((cycle - 500) / 50) * 0.3;
        }

        // Draw particle with glow effect
        const glowColor = particle.color === '#f4bb92' ? 'rgba(244, 187, 146, 0.2)' : 'rgba(228, 194, 133, 0.2)';
        
        // Glow
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Particle core
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connection lines during converging phase
      if (!reduceDuringScroll && cycle >= 200 && cycle < 500) {
        const connectionProgress = (cycle - 200) / 300;
        ctx.strokeStyle = `rgba(244, 187, 146, ${0.15 * connectionProgress})`;
        ctx.lineWidth = 0.5;

        bottlesRef.current.forEach((bottle) => {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          ctx.beginPath();
          ctx.moveTo(bottle.x, bottle.y);
          ctx.lineTo(centerX, centerY);
          ctx.stroke();
        });
      }

      // Draw match score indicators during spreading phase
      if (!reduceDuringScroll && cycle >= 500) {
        const spreadProgress = (cycle - 500) / 300;
        ctx.fillStyle = `rgba(244, 187, 146, ${0.6 * (1 - spreadProgress)})`;
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';

        bottlesRef.current.forEach((bottle) => {
          const score = 65 + (bottle.index * 7);
          ctx.fillText(`${score}%`, bottle.x, bottle.y - 30);
        });
      }

      // Store animation frame ID for proper cleanup
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    // Apply parallax directly to the canvas to avoid React re-renders on scroll.
    const handleScroll = () => {
      isScrollActiveRef.current = true;
      if (scrollStopTimerRef.current !== null) {
        clearTimeout(scrollStopTimerRef.current);
      }
      scrollStopTimerRef.current = window.setTimeout(() => {
        isScrollActiveRef.current = false;
      }, 120);

      scrollOffsetRef.current = window.scrollY * 0.32;
      canvas.style.transform = `translate3d(0, ${scrollOffsetRef.current}px, 0)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle resize
    window.addEventListener('resize', resizeCanvas);

    handleScroll();

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (scrollStopTimerRef.current !== null) {
        clearTimeout(scrollStopTimerRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: 'none',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        display: 'block',
      }}
    />
  );
}
