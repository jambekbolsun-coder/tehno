import { Edit3, Eye, EyeOff, ImagePlus, Newspaper, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CrmEmpty, CrmPageHeader } from "@/components/crm/CrmUI";
import { siteContentService, type CampaignBanner, type NewsPost } from "@/services/SiteContentService";
import { useAppStore } from "@/stores/useAppStore";

const BANNER_SPECS = {
  desktop: { label: "Ноутбук / Desktop", width: 2244, height: 701 },
  tablet: { label: "Планшет", width: 1881, height: 836 },
  mobile: { label: "Телефон", width: 1639, height: 960 },
} as const;

type BannerVariant = keyof typeof BANNER_SPECS;

const imageSize = (file: File) => new Promise<{ width: number; height: number }>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => { resolve({ width: image.naturalWidth, height: image.naturalHeight }); URL.revokeObjectURL(url); };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Не удалось прочитать изображение")); };
  image.src = url;
});

const makeSlug = () => `news-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`;
const displayDate = (value?: string) => value ? new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Черновик";

function BannerEditor({ item, open, onClose, onSaved }: { item: CampaignBanner | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const showToast = useAppStore((state) => state.showToast);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("/catalog");
  const [sortOrder, setSortOrder] = useState(0);
  const [urls, setUrls] = useState<Record<BannerVariant, string>>({ desktop: "", tablet: "", mobile: "" });
  const [files, setFiles] = useState<Partial<Record<BannerVariant, File>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? "");
    setLinkUrl(item?.linkUrl ?? "/catalog");
    setSortOrder(item?.sortOrder ?? 0);
    setUrls({ desktop: item?.desktopUrl ?? "", tablet: item?.tabletUrl ?? "", mobile: item?.mobileUrl ?? "" });
    setFiles({});
  }, [item, open]);

  const ready = (Object.keys(BANNER_SPECS) as BannerVariant[]).every((key) => Boolean(files[key] || urls[key]));

  const selectFile = async (variant: BannerVariant, file?: File) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) return showToast("Изображение должно быть меньше 12 МБ", "error");
    try {
      const dimensions = await imageSize(file);
      const spec = BANNER_SPECS[variant];
      if (dimensions.width !== spec.width || dimensions.height !== spec.height) {
        showToast(`${spec.label}: нужен точный размер ${spec.width}×${spec.height}px. Выбран файл ${dimensions.width}×${dimensions.height}px.`, "error");
        return;
      }
      setFiles((current) => ({ ...current, [variant]: file }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось проверить изображение", "error");
    }
  };

  const save = async (publish: boolean) => {
    if (!title.trim()) return showToast("Добавьте название баннера", "error");
    if (publish && !ready) return showToast("Для публикации нужны все 3 размера баннера", "error");
    setSaving(true);
    try {
      const next = { ...urls };
      for (const variant of Object.keys(BANNER_SPECS) as BannerVariant[]) {
        if (files[variant]) next[variant] = await siteContentService.uploadImage(files[variant]!, "banners");
      }
      await siteContentService.saveBanner({ id: item?.id, title, linkUrl, sortOrder, desktopUrl: next.desktop, tabletUrl: next.tablet, mobileUrl: next.mobile, isPublished: publish });
      showToast(publish ? "Баннер опубликован" : "Черновик баннера сохранён", "success");
      onSaved();
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось сохранить баннер", "error");
    } finally { setSaving(false); }
  };

  return <Modal open={open} onClose={onClose} title={item ? "Редактировать баннер" : "Новый баннер"} size="lg"><form className="crm-form site-content-editor" onSubmit={(event) => { event.preventDefault(); void save(false); }}><div className="form-grid"><div className="field"><label>Название</label><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: Скидки сентября" required/></div><div className="field"><label>Ссылка при нажатии</label><input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="/catalog или https://…"/></div><div className="field"><label>Порядок</label><input type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))}/></div><div className="field field--wide banner-size-note"><strong>Перед публикацией подготовьте три отдельных файла</strong><span>Размеры проверяются автоматически. Неподходящий файл не загрузится.</span></div>{(Object.keys(BANNER_SPECS) as BannerVariant[]).map((variant) => { const spec = BANNER_SPECS[variant]; const currentUrl = urls[variant]; return <div className="field banner-upload-field" key={variant}><label>{spec.label}</label><small>{spec.width} × {spec.height} px · JPG, PNG, WebP или AVIF</small><label className="content-file-button"><Upload size={16}/><span>{files[variant]?.name || (currentUrl ? "Заменить файл" : "Выбрать файл")}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void selectFile(variant, event.target.files?.[0])}/></label>{currentUrl && !files[variant] && <img className="banner-admin-preview" src={currentUrl} alt=""/>}{files[variant] && <span className="file-ready">Файл проверен ✓</span>}</div>; })}</div><footer className="modal-form-actions"><Button type="button" variant="ghost" onClick={onClose}>Отмена</Button><Button type="submit" variant="ghost" disabled={saving}>Сохранить черновик</Button><Button type="button" disabled={!ready || saving} onClick={() => void save(true)}>Опубликовать</Button></footer></form></Modal>;
}

function NewsEditor({ item, open, onClose, onSaved }: { item: NewsPost | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const showToast = useAppStore((state) => state.showToast);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? ""); setExcerpt(item?.excerpt ?? ""); setBody(item?.body ?? ""); setImages(item?.images ?? []); setFiles([]);
  }, [item, open]);

  const selectFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)];
    if (images.length + next.length > 5) return showToast("В одной новости можно добавить максимум 5 фотографий", "error");
    if (next.some((file) => file.size > 12 * 1024 * 1024)) return showToast("Каждая фотография должна быть меньше 12 МБ", "error");
    setFiles(next);
  };

  const save = async (publish: boolean) => {
    if (!title.trim()) return showToast("Добавьте заголовок", "error");
    if (publish && !body.trim()) return showToast("Перед публикацией добавьте текст новости", "error");
    setSaving(true);
    try {
      const uploaded = await Promise.all(files.map((file) => siteContentService.uploadImage(file, "news")));
      await siteContentService.saveNews({ id: item?.id, slug: item?.slug ?? makeSlug(), title, excerpt, body, images: [...images, ...uploaded].slice(0, 5), isPublished: publish });
      showToast(publish ? "Новость опубликована" : "Черновик новости сохранён", "success");
      onSaved(); onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось сохранить новость", "error");
    } finally { setSaving(false); }
  };

  return <Modal open={open} onClose={onClose} title={item ? "Редактировать новость" : "Новая новость"} size="lg"><form className="crm-form site-content-editor" onSubmit={(event: FormEvent) => { event.preventDefault(); void save(false); }}><div className="form-grid"><div className="field field--wide"><label>Заголовок</label><input value={title} onChange={(event) => setTitle(event.target.value)} required/></div><div className="field field--wide"><label>Короткое описание</label><textarea rows={3} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Показывается в карточке новости"/></div><div className="field field--wide"><label>Полный текст</label><textarea className="news-body-editor" rows={14} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Можно писать столько текста, сколько нужно…"/></div><div className="field field--wide"><label>Фотографии · до 5</label><label className="content-file-button"><ImagePlus size={17}/><span>Добавить фотографии</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => selectFiles(event.target.files)}/></label><div className="news-admin-images">{images.map((url, index) => <figure key={`${url}-${index}`}><img src={url} alt=""/><button type="button" aria-label="Удалить фото" onClick={() => setImages((current) => current.filter((_, i) => i !== index))}><Trash2 size={14}/></button></figure>)}{files.map((file, index) => <figure className="is-file" key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" aria-label="Убрать файл" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><Trash2 size={14}/></button></figure>)}</div><small>{images.length + files.length}/5 фотографий</small></div></div><footer className="modal-form-actions"><Button type="button" variant="ghost" onClick={onClose}>Отмена</Button><Button type="submit" variant="ghost" disabled={saving}>Сохранить черновик</Button><Button type="button" disabled={!title.trim() || !body.trim() || saving} onClick={() => void save(true)}>Опубликовать</Button></footer></form></Modal>;
}

export function SiteContentSection() {
  const showToast = useAppStore((state) => state.showToast);
  const [tab, setTab] = useState<"banners" | "news">("banners");
  const [banners, setBanners] = useState<CampaignBanner[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [bannerEditor, setBannerEditor] = useState<CampaignBanner | null | undefined>(undefined);
  const [newsEditor, setNewsEditor] = useState<NewsPost | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const [nextBanners, nextNews] = await Promise.all([siteContentService.listBanners(true), siteContentService.listNews(true)]); setBanners(nextBanners); setNews(nextNews); }
    catch (error) { showToast(error instanceof Error ? error.message : "Не удалось загрузить контент", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const publishedBanners = useMemo(() => banners.filter((item) => item.isPublished).length, [banners]);
  const publishedNews = useMemo(() => news.filter((item) => item.isPublished).length, [news]);

  const removeBanner = async (item: CampaignBanner) => {
    if (!window.confirm(`Удалить баннер «${item.title}»?`)) return;
    try { await siteContentService.deleteBanner(item.id); await load(); showToast("Баннер удалён", "success"); } catch (error) { showToast(error instanceof Error ? error.message : "Ошибка удаления", "error"); }
  };
  const removeNews = async (item: NewsPost) => {
    if (!window.confirm(`Удалить новость «${item.title}»?`)) return;
    try { await siteContentService.deleteNews(item.id); await load(); showToast("Новость удалена", "success"); } catch (error) { showToast(error instanceof Error ? error.message : "Ошибка удаления", "error"); }
  };

  return <div className="crm-page site-content-section"><CrmPageHeader title="Контент сайта" text="Баннеры главной страницы и новости. Этот раздел доступен только управляющему." actions={<Button icon={<Plus size={17}/>} onClick={() => tab === "banners" ? setBannerEditor(null) : setNewsEditor(null)}>{tab === "banners" ? "Добавить баннер" : "Добавить новость"}</Button>}/><div className="metrics-grid compact"><div className="mini-metric"><span><ImagePlus size={19}/></span><div><small>Баннеры</small><strong>{publishedBanners}/{banners.length}</strong></div></div><div className="mini-metric"><span><Newspaper size={19}/></span><div><small>Новости</small><strong>{publishedNews}/{news.length}</strong></div></div></div><section className="crm-panel content-tabs"><div className="segmented-control"><button className={tab === "banners" ? "active" : ""} onClick={() => setTab("banners")}>Баннеры карусели</button><button className={tab === "news" ? "active" : ""} onClick={() => setTab("news")}>Новости</button></div></section>{loading ? <section className="crm-panel content-loading">Загрузка…</section> : tab === "banners" ? (banners.length === 0 ? <CrmEmpty title="Баннеров нет" text="Добавьте первый баннер для главной страницы."/> : <section className="content-admin-grid">{banners.map((item) => <article className="crm-panel content-admin-card" key={item.id}><div className="content-admin-card__media"><img src={item.desktopUrl || item.tabletUrl || item.mobileUrl} alt=""/></div><div className="content-admin-card__body"><span className={`content-status${item.isPublished ? " is-live" : ""}`}>{item.isPublished ? <Eye size={14}/> : <EyeOff size={14}/>} {item.isPublished ? "Опубликован" : "Черновик"}</span><h3>{item.title}</h3><p>{item.linkUrl}</p><small>Порядок: {item.sortOrder} · {displayDate(item.publishedAt)}</small><footer><button onClick={() => setBannerEditor(item)}><Edit3 size={16}/> Изменить</button><button className="danger" onClick={() => void removeBanner(item)}><Trash2 size={16}/> Удалить</button></footer></div></article>)}</section>) : (news.length === 0 ? <CrmEmpty title="Новостей нет" text="Добавьте первую публикацию."/> : <section className="content-admin-grid">{news.map((item) => <article className="crm-panel content-admin-card" key={item.id}><div className="content-admin-card__media content-admin-card__media--news">{item.images[0] ? <img src={item.images[0]} alt=""/> : <Newspaper size={38}/>}</div><div className="content-admin-card__body"><span className={`content-status${item.isPublished ? " is-live" : ""}`}>{item.isPublished ? <Eye size={14}/> : <EyeOff size={14}/>} {item.isPublished ? "Опубликована" : "Черновик"}</span><h3>{item.title}</h3><p>{item.excerpt || item.body.slice(0, 100)}</p><small>{item.images.length}/5 фото · {displayDate(item.publishedAt)}</small><footer><button onClick={() => setNewsEditor(item)}><Edit3 size={16}/> Изменить</button><button className="danger" onClick={() => void removeNews(item)}><Trash2 size={16}/> Удалить</button></footer></div></article>)}</section>)}<BannerEditor item={bannerEditor ?? null} open={bannerEditor !== undefined} onClose={() => setBannerEditor(undefined)} onSaved={() => void load()}/><NewsEditor item={newsEditor ?? null} open={newsEditor !== undefined} onClose={() => setNewsEditor(undefined)} onSaved={() => void load()}/></div>;
}
