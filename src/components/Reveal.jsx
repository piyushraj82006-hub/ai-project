import { useEffect, useRef, useState } from 'react';

/**
 * Reveal — fade/slide content in when it scrolls into view.
 * Lightweight IntersectionObserver wrapper; respects reduced motion via CSS.
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  // Lazy initializer: without IntersectionObserver, show content immediately.
  const [visible, setVisible] = useState(() => !('IntersectionObserver' in window));

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
