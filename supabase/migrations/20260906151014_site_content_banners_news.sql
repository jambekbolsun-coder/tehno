create table public.campaign_banners (
  id uuid primary key default gen_random_uuid(), title text not null default '', link_url text not null default '/catalog', desktop_url text not null default '', tablet_url text not null default '', mobile_url text not null default '', sort_order integer not null default 0, is_published boolean not null default false, published_at timestamptz, created_by uuid references public.profiles(id) on delete set null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint campaign_banners_publish_assets_check check (not is_published or (length(btrim(desktop_url)) > 0 and length(btrim(tablet_url)) > 0 and length(btrim(mobile_url)) > 0))
);
create table public.news_posts (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, excerpt text not null default '', body text not null default '', images text[] not null default '{}'::text[], is_published boolean not null default false, published_at timestamptz, created_by uuid references public.profiles(id) on delete set null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint news_posts_images_limit_check check (cardinality(images) <= 5), constraint news_posts_publish_content_check check (not is_published or (length(btrim(title)) > 0 and length(btrim(body)) > 0))
);
create index campaign_banners_public_order_idx on public.campaign_banners (is_published, sort_order, created_at);
create index news_posts_public_date_idx on public.news_posts (is_published, published_at desc, created_at desc);
create or replace function public.touch_site_content_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); if new.is_published and new.published_at is null then new.published_at=now(); end if; return new; end; $$;
create trigger campaign_banners_touch_updated_at before update on public.campaign_banners for each row execute function public.touch_site_content_updated_at();
create trigger news_posts_touch_updated_at before update on public.news_posts for each row execute function public.touch_site_content_updated_at();
alter table public.campaign_banners enable row level security; alter table public.news_posts enable row level security;
create policy campaign_banners_public_read on public.campaign_banners for select to anon, authenticated using (is_published = true or public.is_admin());
create policy campaign_banners_admin_insert on public.campaign_banners for insert to authenticated with check (public.is_admin());
create policy campaign_banners_admin_update on public.campaign_banners for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy campaign_banners_admin_delete on public.campaign_banners for delete to authenticated using (public.is_admin());
create policy news_posts_public_read on public.news_posts for select to anon, authenticated using (is_published = true or public.is_admin());
create policy news_posts_admin_insert on public.news_posts for insert to authenticated with check (public.is_admin());
create policy news_posts_admin_update on public.news_posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy news_posts_admin_delete on public.news_posts for delete to authenticated using (public.is_admin());
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('content-media','content-media',true,12582912,array['image/jpeg','image/png','image/webp','image/avif']) on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy content_media_public_read on storage.objects for select to anon,authenticated using (bucket_id='content-media');
create policy content_media_admin_insert on storage.objects for insert to authenticated with check (bucket_id='content-media' and public.is_admin());
create policy content_media_admin_update on storage.objects for update to authenticated using (bucket_id='content-media' and public.is_admin()) with check (bucket_id='content-media' and public.is_admin());
create policy content_media_admin_delete on storage.objects for delete to authenticated using (bucket_id='content-media' and public.is_admin());
insert into public.campaign_banners (title,link_url,desktop_url,tablet_url,mobile_url,sort_order,is_published,published_at,created_by)
select * from (values
('Рассрочка 12 месяцев на все товары','/catalog','/banners-hq/installment-desktop.webp','/banners-hq/installment-tablet.webp','/banners-hq/installment-mobile.webp',10,true,now(),null::uuid),
('Купите холодильник — чайник в подарок','/catalog','/banners-hq/gift-desktop.webp','/banners-hq/gift-tablet.webp','/banners-hq/gift-mobile.webp',20,true,now(),null::uuid),
('Горячие скидки до 30 процентов','/catalog','/banners-hq/sale-desktop.webp','/banners-hq/sale-tablet.webp','/banners-hq/sale-mobile.webp',30,true,now(),null::uuid),
('TEHNO CENTER — Токтогула 236','/contacts','/banners-hq/address-desktop.webp','/banners-hq/address-tablet.webp','/banners-hq/address-mobile.webp',40,true,now(),null::uuid)
) as seed(title,link_url,desktop_url,tablet_url,mobile_url,sort_order,is_published,published_at,created_by) where not exists (select 1 from public.campaign_banners);
