import { useRef, useState, useEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// ── Lightbox — Radix nested dialog (stacking + interaction handled correctly) ──
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const atStart = idx === 0;
  const atEnd = idx >= images.length - 1;

  // Disable page scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[200] flex items-center justify-center outline-none"
          onEscapeKeyDown={(e) => { e.stopPropagation(); onClose(); }}
          onInteractOutside={onClose}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-colors z-10"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70 font-medium backdrop-blur-md bg-white/10 border border-white/15 rounded-full px-3 py-1 pointer-events-none">
              {idx + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <img
            src={images[idx].url}
            alt=""
            className="max-w-[88vw] max-h-[88vh] object-contain select-none rounded-sm shadow-2xl"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Prev */}
          <button
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
              backdrop-blur-md bg-white/10 border border-white/20 text-white
              flex items-center justify-center hover:bg-white/25 transition-all hover:scale-105 active:scale-95 z-10
              ${atStart ? 'opacity-0 pointer-events-none' : ''}`}
            onClick={() => setIdx((i) => i - 1)}
            aria-label="Önceki"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Next */}
          <button
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
              backdrop-blur-md bg-white/10 border border-white/20 text-white
              flex items-center justify-center hover:bg-white/25 transition-all hover:scale-105 active:scale-95 z-10
              ${atEnd ? 'opacity-0 pointer-events-none' : ''}`}
            onClick={() => setIdx((i) => i + 1)}
            aria-label="Sonraki"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dot strip */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all duration-300 focus:outline-none ${
                    i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ── DragScrollGallery ─────────────────────────────────────────────────────────
export function DragScrollGallery({ images, className = 'aspect-[3/4]', enableKeyboard = false }) {
  const ref = useRef(null);
  const idxRef = useRef(0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const dragging = useRef(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const baseScroll = useRef(0);

  function updateIdx(i) {
    idxRef.current = i;
    setDisplayIdx(i);
  }

  const goTo = useCallback((i) => {
    const el = ref.current;
    if (!el || !images?.length) return;
    const clamped = Math.max(0, Math.min(i, images.length - 1));
    idxRef.current = clamped;
    el.scrollTo({ left: clamped * el.offsetWidth, behavior: 'smooth' });
  }, [images?.length]);

  function onMouseDown(e) {
    dragging.current = true;
    moved.current = false;
    startX.current = e.pageX;
    baseScroll.current = ref.current.scrollLeft;
    ref.current.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!dragging.current) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 5) moved.current = true;
    ref.current.scrollLeft = baseScroll.current - dx * 1.5;
  }

  function onMouseUp(e) {
    if (!dragging.current) return;
    dragging.current = false;
    ref.current.style.cursor = 'grab';

    if (!moved.current) {
      setLightbox(true);
      return;
    }
    const dx = startX.current - e.pageX;
    if (Math.abs(dx) > 30) {
      goTo(idxRef.current + (dx > 0 ? 1 : -1));
    } else {
      goTo(idxRef.current);
    }
  }

  function onMouseLeave() {
    if (!dragging.current) return;
    dragging.current = false;
    ref.current.style.cursor = 'grab';
    goTo(idxRef.current);
  }

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    updateIdx(Math.round(el.scrollLeft / el.offsetWidth));
  }

  // Mouse wheel → debounced slide navigation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let accumulated = 0;
    let timer;
    function onWheel(e) {
      e.preventDefault();
      accumulated += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (Math.abs(accumulated) > 10) goTo(idxRef.current + (accumulated > 0 ? 1 : -1));
        accumulated = 0;
      }, 60);
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { el.removeEventListener('wheel', onWheel); clearTimeout(timer); };
  }, [goTo]);

  // Keyboard arrows
  useEffect(() => {
    if (!enableKeyboard) return;
    function onKey(e) {
      if (lightbox) return;
      if (e.key === 'ArrowLeft') goTo(idxRef.current - 1);
      if (e.key === 'ArrowRight') goTo(idxRef.current + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableKeyboard, goTo, lightbox]);

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!images?.length) {
    return (
      <div className={`${className} bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-sm text-[var(--text-muted)]`}>
        Görsel yok
      </div>
    );
  }

  // ── Single image ──────────────────────────────────────────────────────────
  if (images.length === 1) {
    return (
      <>
        <div
          className={`${className} bg-[var(--bg-secondary)] rounded-xl overflow-hidden cursor-zoom-in`}
          onClick={() => setLightbox(true)}
        >
          <img src={images[0].url} alt="" className="w-full h-full object-contain" loading="eager" />
        </div>
        {lightbox && <Lightbox images={images} startIdx={0} onClose={() => setLightbox(false)} />}
      </>
    );
  }

  // ── Multi-image ───────────────────────────────────────────────────────────
  const count = images.length;
  const atStart = displayIdx === 0;
  const atEnd = displayIdx >= count - 1;

  return (
    <>
      <div className={`relative ${className} bg-[var(--bg-secondary)] rounded-xl overflow-hidden select-none group/gallery cursor-zoom-in`}>

        {/* Slide strip */}
        <div
          ref={ref}
          className="flex h-full overflow-x-scroll"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: 'grab',
            WebkitOverflowScrolling: 'touch',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onScroll={onScroll}
        >
          {images.map((img, i) => (
            <div key={i} className="flex-shrink-0 w-full h-full" style={{ scrollSnapAlign: 'start' }}>
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-contain pointer-events-none"
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Edge fades */}
        {!atStart && (
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
        )}
        {!atEnd && (
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />
        )}

        {/* Prev */}
        <button
          aria-label="Önceki"
          onClick={(e) => { e.stopPropagation(); goTo(displayIdx - 1); }}
          className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
            backdrop-blur-md bg-black/35 border border-white/20 text-white
            flex items-center justify-center z-10 transition-all duration-200
            hover:bg-black/60 hover:scale-105 active:scale-95
            ${atStart ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/gallery:opacity-80'}`}
        >
          <ChevronLeft size={17} strokeWidth={2.5} />
        </button>

        {/* Next */}
        <button
          aria-label="Sonraki"
          onClick={(e) => { e.stopPropagation(); goTo(displayIdx + 1); }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
            backdrop-blur-md bg-black/35 border border-white/20 text-white
            flex items-center justify-center z-10 transition-all duration-200
            hover:bg-black/60 hover:scale-105 active:scale-95
            ${atEnd ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/gallery:opacity-80'}`}
        >
          <ChevronRight size={17} strokeWidth={2.5} />
        </button>

        {/* Pill indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1 pointer-events-none">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              className={`rounded-full pointer-events-auto transition-all duration-300 focus:outline-none ${
                i === displayIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/75'
              }`}
            />
          ))}
        </div>

        {/* Counter */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-semibold
          backdrop-blur-md bg-black/40 border border-white/15 text-white rounded-full px-2 py-0.5 pointer-events-none tracking-wide">
          {displayIdx + 1}<span className="opacity-40 mx-0.5">/</span>{count}
        </div>
      </div>

      {lightbox && (
        <Lightbox images={images} startIdx={displayIdx} onClose={() => setLightbox(false)} />
      )}
    </>
  );
}
