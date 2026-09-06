import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { siteContentService, type NewsPost } from "@/services/SiteContentService";

const newsDate = (value?: string) => value ? new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "";

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    siteContentService.listNews().then((items) => active && setPosts(items)).catch(() => active && setPosts([])).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="container page-space public-news-page">
      <header className="public-news-hero">
        <span><Newspaper size={18}/> TEHNO CENTER</span>
        <h1>Новости и объявления</h1>
        <p>Новые поступления, акции, полезные обновления и важная информация магазина.</p>
      </header>
      {loading ? <div className="news-state">Загружаем новости…</div> : posts.length === 0 ? <div className="news-state"><strong>Новостей пока нет</strong><p>Новые публикации появятся здесь.</p></div> : (
        <div className="public-news-grid">
          {posts.map((post) => (
            <article className="public-news-card" key={post.id}>
              <Link to={`/news/${post.slug}`} className="public-news-card__media" aria-label={post.title}>
                {post.images[0] ? <img src={post.images[0]} alt="" loading="lazy" decoding="async"/> : <span><Newspaper size={34}/></span>}
              </Link>
              <div className="public-news-card__body">
                <small><CalendarDays size={14}/>{newsDate(post.publishedAt || post.createdAt)}</small>
                <h2><Link to={`/news/${post.slug}`}>{post.title}</Link></h2>
                <p>{post.excerpt || `${post.body.slice(0, 180)}${post.body.length > 180 ? "…" : ""}`}</p>
                <Link className="public-news-card__link" to={`/news/${post.slug}`}>Подробнее <ArrowRight size={16}/></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
