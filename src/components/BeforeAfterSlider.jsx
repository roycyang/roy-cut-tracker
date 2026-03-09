import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function BeforeAfterSlider({ beforeUrl, afterUrl, beforeLabel, afterLabel }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerDown = useCallback((e) => {
    dragging.current = true;
    updateSlider(e.clientX);
  }, [updateSlider]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    e.preventDefault();
    updateSlider(e.clientX);
  }, [updateSlider]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const slider = (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl select-none touch-none"
      style={{ aspectRatio: '3/4' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* After image (full) */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100vw' }}
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-black text-xs font-bold">{'\u2194'}</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
        {beforeLabel}
      </div>
      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
        {afterLabel}
      </div>
    </div>
  );

  return (
    <div className="mb-4">
      <div onClick={() => setFullscreen(true)} className="cursor-pointer">
        {slider}
      </div>
      <p className="text-[10px] text-gray-500 text-center mt-1">Drag to compare. Tap for fullscreen.</p>

      {fullscreen && createPortal(
        <div
          className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            {slider}
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full text-white text-xl flex items-center justify-center"
            >
              {'\u00D7'}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
