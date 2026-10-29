// Adapted from 21st.dev "Animated Gradient Background" by hammamikhairi
// (https://21st.dev/hammamikhairi/animated-gradient-background).
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

const DEFAULT_COLORS = [
  "#0A0A0A",
  "#2979FF",
  "#FF80AB",
  "#FF6D00",
  "#FFD600",
  "#00E676",
  "#3D5AFE",
];
const DEFAULT_STOPS = [35, 50, 60, 70, 80, 90, 100];

interface AnimatedGradientBackgroundProps {
  /** Initial size of the radial gradient, as a percentage of the container. */
  startingGap?: number;
  /** Slowly expands and contracts the gradient. Off when the viewer prefers reduced motion. */
  breathing?: boolean;
  /** Gradient colors; each one pairs with the stop at the same index. */
  gradientColors?: string[];
  /** Stop percentages (0–100), one per color. */
  gradientStops?: number[];
  /** Percentage points the gradient grows or shrinks per frame while breathing. */
  animationSpeed?: number;
  /** How far, in percentage points, the gradient breathes either way. */
  breathingRange?: number;
  /** Extra height added to the gradient ellipse, in percentage points. */
  topOffset?: number;
  containerClassName?: string;
}

export default function AnimatedGradientBackground({
  startingGap = 125,
  breathing = false,
  gradientColors = DEFAULT_COLORS,
  gradientStops = DEFAULT_STOPS,
  animationSpeed = 0.02,
  breathingRange = 5,
  topOffset = 0,
  containerClassName = "",
}: AnimatedGradientBackgroundProps) {
  if (gradientColors.length !== gradientStops.length) {
    throw new Error(
      `gradientColors and gradientStops must have the same length (got ${gradientColors.length} and ${gradientStops.length}).`,
    );
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const animate = breathing && !reduceMotion;

  useEffect(() => {
    const stops = gradientStops
      .map((stop, index) => `${gradientColors[index]} ${stop}%`)
      .join(", ");
    const paint = (width: number) => {
      if (containerRef.current) {
        containerRef.current.style.background = `radial-gradient(${width}% ${width + topOffset}% at 50% 20%, ${stops})`;
      }
    };

    paint(startingGap);
    if (!animate) return;

    let frame: number;
    let width = startingGap;
    let direction = 1;
    const step = () => {
      if (width >= startingGap + breathingRange) direction = -1;
      if (width <= startingGap - breathingRange) direction = 1;
      width += direction * animationSpeed;
      paint(width);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [startingGap, animate, gradientColors, gradientStops, animationSpeed, breathingRange, topOffset]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 1.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, ease: [0.25, 0.1, 0.25, 1] }}
      className={`absolute inset-0 overflow-hidden ${containerClassName}`}
    >
      <div ref={containerRef} className="absolute inset-0" />
    </motion.div>
  );
}
