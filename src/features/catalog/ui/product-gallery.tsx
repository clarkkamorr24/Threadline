'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { ImageOff } from 'lucide-react';
import type { ProductImageModel } from '@/entities/product/model/types';
import { cn } from '@/lib/utils';

const ZOOM_SCALE = 2.2;

interface ProductGalleryProps {
  readonly images: readonly ProductImageModel[];
  readonly productName: string;
  readonly activeImageUrl?: string;
}

export function ProductGallery({ images, productName, activeImageUrl }: ProductGalleryProps) {
  const [activeUrl, setActiveUrl] = useState(activeImageUrl ?? images[0]?.url);
  const [requestedUrl, setRequestedUrl] = useState(activeImageUrl);
  const [isZooming, setIsZooming] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  if (activeImageUrl !== requestedUrl) {
    setRequestedUrl(activeImageUrl);

    if (activeImageUrl) {
      setActiveUrl(activeImageUrl);
    }
  }

  const foundIndex = images.findIndex((image) => image.url === activeUrl);
  const activeIndex = foundIndex === -1 ? 0 : foundIndex;
  const active = images[activeIndex];

  function handleMouseMove(event: MouseEvent<HTMLDivElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setOrigin(`${x}% ${y}%`);
  }

  if (!active) {
    return (
      <div className="text-ink-55 flex aspect-4/5 items-center justify-center bg-[repeating-linear-gradient(135deg,#e6e4e1_0_11px,#eceae7_11px_22px)]">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="sr-only">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-0.5 lg:flex-row">
      {images.length > 1 ? (
        <ul className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveUrl(image.url)}
                aria-label={`View image ${index + 1} of ${images.length} for ${productName}`}
                aria-current={index === activeIndex}
                className={cn(
                  'focus-visible:ring-ring relative h-[88px] w-[70px] shrink-0 overflow-hidden border transition-colors focus-visible:ring-2',
                  index === activeIndex ? 'border-foreground' : 'border-line hover:border-line-strong',
                )}
              >
                <Image src={image.url} alt="" fill sizes="70px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className="relative aspect-4/5 flex-1 cursor-zoom-in overflow-hidden bg-[#e6e4e1]"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            transform: isZooming ? `scale(${ZOOM_SCALE})` : 'scale(1)',
            transformOrigin: origin,
          }}
        />
      </div>

    </div>
  );
}
