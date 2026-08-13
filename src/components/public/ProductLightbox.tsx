import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useBodyLock } from "@/hooks/useBodyLock";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProductImage } from "@/types/domain";

interface ProductLightboxProps {
  open: boolean;
  images: ProductImage[];
  index: number;
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function ProductLightbox({
  open,
  images,
  index,
  title,
  onIndexChange,
  onClose,
}: ProductLightboxProps) {
  const { language, t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const activeIndex = images.length ? Math.min(Math.max(index, 0), images.length - 1) : 0;
  const currentImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;

  useBodyLock(open);

  const showPrevious = useCallback(() => {
    if (!images.length) return;
    onIndexChange((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  const showNext = useCallback(() => {
    if (!images.length) return;
    onIndexChange((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultipleImages) {
        event.preventDefault();
        showPrevious();
      }
      if (event.key === "ArrowRight" && hasMultipleImages) {
        event.preventDefault();
        showNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, onClose, open, showNext, showPrevious]);

  if (!open || !currentImage) return null;

  return createPortal(
    <div className="product-lightbox" role="presentation">
      <section
        className="product-lightbox__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${t("gallery")}: ${title}`}
      >
        <header className="product-lightbox__header">
          <div>
            <strong>{title}</strong>
            <span aria-live="polite">{activeIndex + 1} / {images.length}</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="product-lightbox__close"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X size={24}/>
          </button>
        </header>
        <div
          className="product-lightbox__stage"
          onTouchStart={(event) => {
            swipeStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchCancel={() => {
            swipeStartX.current = null;
          }}
          onTouchEnd={(event) => {
            const startX = swipeStartX.current;
            swipeStartX.current = null;
            if (startX === null || !hasMultipleImages) return;
            const endX = event.changedTouches[0]?.clientX;
            if (endX === undefined) return;
            const distance = endX - startX;
            if (Math.abs(distance) < 48) return;
            if (distance < 0) showNext();
            else showPrevious();
          }}
        >
          {hasMultipleImages && (
            <button
              type="button"
              className="product-lightbox__navigation product-lightbox__navigation--previous"
              onClick={showPrevious}
              aria-label={t("previousImage")}
            >
              <ChevronLeft size={30}/>
            </button>
          )}
          <img
            src={currentImage.url}
            alt={currentImage.alt[language] || title}
            draggable={false}
          />
          {hasMultipleImages && (
            <button
              type="button"
              className="product-lightbox__navigation product-lightbox__navigation--next"
              onClick={showNext}
              aria-label={t("nextImage")}
            >
              <ChevronRight size={30}/>
            </button>
          )}
        </div>
        {hasMultipleImages && (
          <div className="product-lightbox__thumbs" aria-label={t("gallery")}>
            {images.map((image, imageIndex) => (
              <button
                type="button"
                key={image.id}
                className={imageIndex === activeIndex ? "active" : ""}
                onClick={() => onIndexChange(imageIndex)}
                aria-label={`${imageIndex + 1} / ${images.length}`}
                aria-current={imageIndex === activeIndex ? "true" : undefined}
              >
                <img src={image.url} alt=""/>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
