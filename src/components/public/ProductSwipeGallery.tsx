import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductImage } from "@/types/domain";

interface ProductSwipeGalleryProps {
  images: ProductImage[];
  index: number;
  title: string;
  onIndexChange: (index: number) => void;
  onOpen: () => void;
}

export function ProductSwipeGallery({
  images,
  index,
  title,
  onIndexChange,
  onOpen,
}: ProductSwipeGalleryProps) {
  const { language, t } = useTranslation();
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);
  const activeIndex = images.length ? Math.min(Math.max(index, 0), images.length - 1) : 0;
  const hasMultipleImages = images.length > 1;

  const showPrevious = () => onIndexChange(Math.max(0, activeIndex - 1));
  const showNext = () => onIndexChange(Math.min(images.length - 1, activeIndex + 1));

  if (!images.length) {
    return (
      <section className="product-swipe-gallery product-swipe-gallery--empty" aria-label={t("gallery")}>
        <img src="/logo.jpg" alt={title}/>
      </section>
    );
  }

  return (
    <section className="product-swipe-gallery" aria-label={t("gallery")}>
      <div
        className="product-swipe-gallery__viewport"
        onTouchStart={(event) => {
          swiped.current = false;
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchCancel={() => {
          touchStartX.current = null;
          swiped.current = false;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          touchStartX.current = null;
          if (startX === null || !hasMultipleImages) return;
          const endX = event.changedTouches[0]?.clientX;
          if (endX === undefined) return;
          const distance = endX - startX;
          if (Math.abs(distance) < 42) return;
          swiped.current = true;
          if (distance < 0) showNext();
          else showPrevious();
        }}
      >
        <div
          className="product-swipe-gallery__track"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {images.map((image, imageIndex) => (
            <button
              type="button"
              className="product-swipe-gallery__slide"
              key={image.id}
              onClick={() => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                onIndexChange(imageIndex);
                onOpen();
              }}
              aria-label={`${t("zoomImage")} ${imageIndex + 1} / ${images.length}`}
              tabIndex={imageIndex === activeIndex ? 0 : -1}
            >
              <img
                src={image.url}
                alt={image.alt[language] || title}
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
      <span className="product-swipe-gallery__counter" aria-live="polite">
        {activeIndex + 1} / {images.length}
      </span>
      <span className="product-swipe-gallery__zoom-hint" aria-hidden="true">
        <ZoomIn size={17}/>
      </span>
      {hasMultipleImages && (
        <>
          <button
            type="button"
            className="product-swipe-gallery__arrow product-swipe-gallery__arrow--previous"
            onClick={showPrevious}
            disabled={activeIndex === 0}
            aria-label={t("previousImage")}
          >
            <ChevronLeft size={25}/>
          </button>
          <button
            type="button"
            className="product-swipe-gallery__arrow product-swipe-gallery__arrow--next"
            onClick={showNext}
            disabled={activeIndex === images.length - 1}
            aria-label={t("nextImage")}
          >
            <ChevronRight size={25}/>
          </button>
          <div className="product-swipe-gallery__dots" aria-label={t("gallery")}>
            {images.map((image, imageIndex) => (
              <button
                type="button"
                key={image.id}
                className={imageIndex === activeIndex ? "active" : ""}
                onClick={() => onIndexChange(imageIndex)}
                aria-label={`${imageIndex + 1} / ${images.length}`}
                aria-current={imageIndex === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
