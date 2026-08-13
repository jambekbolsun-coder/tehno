import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { InstallmentCalculator } from "@/components/public/InstallmentCalculator";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { formatMoney } from "@/utils/money";

export default function CartPage() {
  const { language, t } = useTranslation();
  const cart = useAppStore((state) => state.cart);
  const products = useAppStore((state) => state.products);
  const update = useAppStore((state) => state.updateCartQuantity);
  const remove = useAppStore((state) => state.removeFromCart);
  const items = cart.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.product.oldPrice ?? item.product.salePrice) * item.quantity,
    0,
  );
  const total = items.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0,
  );
  const discount = Math.max(0, subtotal - total);
  return (
    <div className="container page-space cart-page">
      <header className="page-heading">
        <span className="eyebrow">{t("yourChoice")}</span>
        <h1>{t("cart")}</h1>
        <p>{items.reduce((sum, item) => sum + item.quantity, 0)} {t("productsUnit")}</p>
      </header>
      {!items.length ? (
        <EmptyState
          icon={<ShoppingBag size={34} />}
          title={t("emptyCart")}
          text={t("emptyCartText")}
          action={
            <Link to="/catalog">
              <Button>{t("goCatalog")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="cart-layout">
          <section className="cart-list">
            {items.map(({ product, quantity }) => (
              <article className="cart-item" key={product.id}>
                <Link
                  to={`/product/${product.slug}`}
                  className="cart-item__image"
                >
                  <img
                    src={product.images[0]?.url || "/logo.jpg"}
                    alt={product.name[language]}
                  />
                </Link>
                <div className="cart-item__info">
                  <span>
                    {product.brand} · {product.model}
                  </span>
                  <Link to={`/product/${product.slug}`}>
                    {product.name[language]}
                  </Link>
                  <small>
                    {product.stock - product.reserved > 0
                      ? `${t("inStock")}: ${product.stock - product.reserved}`
                      : t("outOfStock")}
                  </small>
                </div>
                <div className="cart-item__quantity">
                  <button
                    onClick={() => update(product.id, quantity - 1)}
                    aria-label={t("decrease")}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={() => update(product.id, quantity + 1)}
                    aria-label={t("increase")}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="cart-item__price">
                  <strong>{formatMoney(product.salePrice * quantity)}</strong>
                  {product.oldPrice && (
                    <del>{formatMoney(product.oldPrice * quantity)}</del>
                  )}
                </div>
                <button
                  className="cart-item__remove"
                  onClick={() => remove(product.id)}
                  aria-label={t("removeProduct")}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <div className="order-summary">
              <h2>{t("total")}</h2>
              <dl>
                <div>
                  <dt>{t("subtotal")}</dt>
                  <dd>{formatMoney(subtotal)}</dd>
                </div>
                <div className="discount-row">
                  <dt>{t("discount")}</dt>
                  <dd>− {formatMoney(discount)}</dd>
                </div>
                <div className="summary-total">
                  <dt>{t("total")}</dt>
                  <dd>{formatMoney(total)}</dd>
                </div>
              </dl>
              <Link to="/checkout">
                <Button block size="lg">
                  {t("checkout")}
                </Button>
              </Link>
              <p>{t("stockRecheck")}</p>
            </div>
            <InstallmentCalculator amount={total} />
          </aside>
        </div>
      )}
    </div>
  );
}
