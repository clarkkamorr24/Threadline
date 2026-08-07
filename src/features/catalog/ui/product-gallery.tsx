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
      <div className="bg-muted text-muted-foreground flex aspect-3/4 items-center justify-center rounded-xl">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="sr-only">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="bg-muted relative aspect-3/4 cursor-zoom-in overflow-hidden rounded-xl"
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
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            transform: isZooming ? `scale(${ZOOM_SCALE})` : 'scale(1)',
            transformOrigin: origin,
          }}
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveUrl(image.url)}
                aria-label={`View image ${index + 1} of ${images.length} for ${productName}`}
                aria-current={index === activeIndex}
                className={cn(
                  'bg-muted focus-visible:ring-ring relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
                  index === activeIndex ? 'border-foreground' : 'border-transparent hover:border-border',
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
