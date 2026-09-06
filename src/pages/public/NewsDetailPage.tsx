import { ArrowLeft, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { siteContentService, type NewsPost } from "@/services/SiteContentService";

export default function NewsDetailPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    siteContentService.getNewsBySlug(slug).then((item) => active && setPost(item)).catch(() => active && setPost(null)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  if (loading) return <div className="container page-space news-state">Загружаем публикацию…</div>;
  if (!post) return <div className="container page-space news-state"><strong>Новость не найдена</strong><Link to="/news">Вернуться к новостям</Link></div>;

  const date = new Date(post.publishedAt || post.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="container page-space public-news-detail">
      <Link className="public-news-detail__back" to="/news"><ArrowLeft size={17}/> Все новости</Link>
      <header>
        <small><CalendarDays size={15}/>{date}</small>
        <h1>{post.title}</h1>
        {post.excerpt && <p>{post.excerpt}</p>}
      </header>
      {post.images.length > 0 && <div className={`public-news-detail__gallery${post.images.length === 1 ? " is-single" : ""}`}>{post.images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${post.title} — фото ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} decoding="async"/>)}</div>}
      <div className="public-news-detail__body">{post.body}</div>
    </article>
  );
}
