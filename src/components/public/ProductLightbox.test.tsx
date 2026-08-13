import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductLightbox } from "@/components/public/ProductLightbox";
import { useAppStore } from "@/stores/useAppStore";
import type { ProductImage } from "@/types/domain";

const images: ProductImage[] = [
  {
    id: "image-1",
    url: "https://example.com/one.jpg",
    alt: { ru: "Первое фото", kg: "Биринчи сүрөт", en: "First photo" },
    position: 0,
  },
  {
    id: "image-2",
    url: "https://example.com/two.jpg",
    alt: { ru: "Второе фото", kg: "Экинчи сүрөт", en: "Second photo" },
    position: 1,
  },
  {
    id: "image-3",
    url: "https://example.com/three.jpg",
    alt: { ru: "Третье фото", kg: "Үчүнчү сүрөт", en: "Third photo" },
    position: 2,
  },
];

describe("ProductLightbox", () => {
  beforeEach(() => {
    useAppStore.setState({ language: "ru" });
  });

  it("листает изображения кнопками и клавиатурой", async () => {
    const user = userEvent.setup();
    let activeIndex = 0;
    const onIndexChange = vi.fn((nextIndex: number) => {
      activeIndex = nextIndex;
    });
    const { rerender } = render(
      <ProductLightbox
        open
        images={images}
        index={activeIndex}
        title="Тестовый товар"
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: /Фотографии товара: Тестовый товар/ })).toBeInTheDocument();
    expect(screen.getByAltText("Первое фото")).toHaveAttribute("src", images[0].url);

    await user.click(screen.getByRole("button", { name: "Следующее изображение" }));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    rerender(
      <ProductLightbox
        open
        images={images}
        index={activeIndex}
        title="Тестовый товар"
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByAltText("Второе фото")).toHaveAttribute("src", images[1].url);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it("поддерживает свайп в полноэкранном режиме и закрытие Escape", () => {
    const onIndexChange = vi.fn();
    const onClose = vi.fn();
    render(
      <ProductLightbox
        open
        images={images}
        index={0}
        title="Тестовый товар"
        onIndexChange={onIndexChange}
        onClose={onClose}
      />,
    );

    const stage = screen.getByRole("dialog").querySelector(".product-lightbox__stage");
    expect(stage).not.toBeNull();
    fireEvent.touchStart(stage as Element, { touches: [{ clientX: 280 }] });
    fireEvent.touchEnd(stage as Element, { changedTouches: [{ clientX: 100 }] });
    expect(onIndexChange).toHaveBeenCalledWith(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
