import type { Product } from "@/types/domain";
import { ProductCard } from "@/components/public/ProductCard";

export function ProductGrid({
  products,
  skeleton = false,
}: {
  products: Product[];
  skeleton?: boolean;
}) {
  if (skeleton)
    return (
      <div className="product-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="product-skeleton" key={index}>
            <div />
            <span />
            <span />
            <b />
          </div>
        ))}
      </div>
    );
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  );
}
