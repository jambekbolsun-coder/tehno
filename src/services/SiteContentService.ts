import { supabase } from "@/lib/supabase";

export interface CampaignBanner {
  id: string;
  title: string;
  linkUrl: string;
  desktopUrl: string;
  tabletUrl: string;
  mobileUrl: string;
  sortOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  images: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BannerDraft {
  id?: string;
  title: string;
  linkUrl: string;
  desktopUrl: string;
  tabletUrl: string;
  mobileUrl: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface NewsDraft {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  images: string[];
  isPublished: boolean;
}

const db = supabase as any;

const mapBanner = (row: any): CampaignBanner => ({
  id: row.id,
  title: row.title,
  linkUrl: row.link_url,
  desktopUrl: row.desktop_url,
  tabletUrl: row.tablet_url,
  mobileUrl: row.mobile_url,
  sortOrder: row.sort_order,
  isPublished: row.is_published,
  publishedAt: row.published_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNews = (row: any): NewsPost => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  body: row.body,
  images: row.images ?? [],
  isPublished: row.is_published,
  publishedAt: row.published_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const ensure = (error: { message?: string } | null) => {
  if (error) throw new Error(error.message || "Ошибка Supabase");
};

const safeExtension = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/avif") return "avif";
  if (file.type === "image/webp") return "webp";
  return "jpg";
};

const storagePathFromPublicUrl = (url: string) => {
  const marker = "/storage/v1/object/public/content-media/";
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
};

export const siteContentService = {
  async listBanners(includeDrafts = false): Promise<CampaignBanner[]> {
    let query = db.from("campaign_banners").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (!includeDrafts) query = query.eq("is_published", true);
    const { data, error } = await query;
    ensure(error);
    return (data ?? []).map(mapBanner);
  },

  async saveBanner(draft: BannerDraft): Promise<CampaignBanner> {
    const payload = {
      title: draft.title.trim(),
      link_url: draft.linkUrl.trim() || "/catalog",
      desktop_url: draft.desktopUrl,
      tablet_url: draft.tabletUrl,
      mobile_url: draft.mobileUrl,
      sort_order: Number.isFinite(draft.sortOrder) ? draft.sortOrder : 0,
      is_published: draft.isPublished,
    };
    const query = draft.id
      ? db.from("campaign_banners").update(payload).eq("id", draft.id)
      : db.from("campaign_banners").insert(payload);
    const { data, error } = await query.select("*").single();
    ensure(error);
    return mapBanner(data);
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await db.from("campaign_banners").delete().eq("id", id);
    ensure(error);
  },

  async listNews(includeDrafts = false, limit?: number): Promise<NewsPost[]> {
    let query = db.from("news_posts").select("*").order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    if (!includeDrafts) query = query.eq("is_published", true);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    ensure(error);
    return (data ?? []).map(mapNews);
  },

  async getNewsBySlug(slug: string): Promise<NewsPost | null> {
    const { data, error } = await db.from("news_posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
    ensure(error);
    return data ? mapNews(data) : null;
  },

  async saveNews(draft: NewsDraft): Promise<NewsPost> {
    const payload = {
      slug: draft.slug,
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body: draft.body,
      images: draft.images.slice(0, 5),
      is_published: draft.isPublished,
    };
    const query = draft.id
      ? db.from("news_posts").update(payload).eq("id", draft.id)
      : db.from("news_posts").insert(payload);
    const { data, error } = await query.select("*").single();
    ensure(error);
    return mapNews(data);
  },

  async deleteNews(id: string): Promise<void> {
    const { error } = await db.from("news_posts").delete().eq("id", id);
    ensure(error);
  },

  async uploadImage(file: File, folder: "banners" | "news"): Promise<string> {
    const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${safeExtension(file)}`;
    const { error } = await db.storage.from("content-media").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    ensure(error);
    return db.storage.from("content-media").getPublicUrl(path).data.publicUrl as string;
  },

  async removeUploadedImage(url: string): Promise<void> {
    const path = storagePathFromPublicUrl(url);
    if (!path) return;
    const { error } = await db.storage.from("content-media").remove([path]);
    ensure(error);
  },
};
