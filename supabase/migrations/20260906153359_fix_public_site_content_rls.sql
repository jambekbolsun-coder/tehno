drop policy if exists campaign_banners_public_read on public.campaign_banners;
drop policy if exists news_posts_public_read on public.news_posts;

create policy campaign_banners_anon_read
on public.campaign_banners
for select
to anon
using (is_published = true);

create policy campaign_banners_authenticated_read
on public.campaign_banners
for select
to authenticated
using (is_published = true or public.is_admin());

create policy news_posts_anon_read
on public.news_posts
for select
to anon
using (is_published = true);

create policy news_posts_authenticated_read
on public.news_posts
for select
to authenticated
using (is_published = true or public.is_admin());
