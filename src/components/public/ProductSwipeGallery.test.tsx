import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductSwipeGallery } from "@/components/public/ProductSwipeGallery";
import { useAppStore } from "@/stores/useAppStore";
import type { ProductImage } from "@/types/domain";

const images: ProductImage[] = [
  { id: "one", url: "https://example.com/one.jpg", alt: { ru: "Фото 1", kg: "Сүрөт 1", en: "Photo 1" }, position: 0 },
  { id: "two", url: "https://example.com/two.jpg", alt: { ru: "Фото 2", kg: "Сүрөт 2", en: "Photo 2" }, position: 1 },
  { id: "three", url: "https://example.com/three.jpg", alt: { ru: "Фото 3", kg: "Сүрөт 3", en: "Photo 3" }, position: 2 },
];

describe("ProductSwipeGallery", () => {
  beforeEach(() => useAppStore.setState({ language: "ru" }));

  it("переключает фотографии стрелками и точками", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(
      <ProductSwipeGallery
        images={images}
        index={0}
        title="Тестовый товар"
        onIndexChange={onIndexChange}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Следующее изображение" }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole("button", { name: "3 / 3" }));
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("поддерживает свайп и открывает полноэкранный просмотр по нажатию", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    const onOpen = vi.fn();
    const { container } = render(
      <ProductSwipeGallery
        images={images}
        index={0}
        title="Тестовый товар"
        onIndexChange={onIndexChange}
        onOpen={onOpen}
      />,
    );

    const viewport = container.querySelector(".product-swipe-gallery__viewport");
    await user.click(screen.getByRole("button", { name: "Увеличить фотографию 1 / 3" }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(viewport as Element, { touches: [{ clientX: 280 }] });
    fireEvent.touchEnd(viewport as Element, { changedTouches: [{ clientX: 100 }] });
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});
