import { useState } from 'react';
import { cn } from '@/lib/utils';

export function LazyImage({ src, alt = '', className, containerClassName }) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return <div className={cn('bg-[var(--bg-secondary)] animate-pulse', containerClassName)} />;
  }

  return (
    <div className={cn('relative overflow-hidden bg-[var(--bg-secondary)]', containerClassName)}>
      {!loaded && (
        <div className="absolute inset-0 bg-[var(--bg-secondary)] animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0', className)}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
