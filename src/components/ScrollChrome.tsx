'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Reading-progress bar, condensed-header flag and a back-to-top button. */
export function ScrollChrome() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      setShowTop(y > 900);
      doc.classList.toggle('is-scrolled', y > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div className="scroll-progress-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <button
        type="button"
        className={`back-to-top ${showTop ? 'is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={16} />
      </button>
    </>
  );
}
