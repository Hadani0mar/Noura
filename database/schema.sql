create table public.catalog_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.catalog_admins enable row level security;
grant select on public.catalog_admins to authenticated;
revoke all on public.catalog_admins from anon;
create policy "Admins can read own membership" on public.catalog_admins for select to authenticated using (user_id=(select auth.uid()));
create table public.catalog_products (
 id integer primary key,
 name text not null check (length(name) between 1 and 300),
 pack integer not null check (pack > 0),
 price numeric(12,2) not null check (price >= 0),
 image text not null,
 updated_at timestamptz not null default now()
);
alter table public.catalog_products enable row level security;
grant select on public.catalog_products to anon, authenticated;
grant update(name,pack,price,image) on public.catalog_products to authenticated;
create policy "Public catalog read" on public.catalog_products for select to anon,authenticated using (true);
create policy "Only catalog admins update" on public.catalog_products for update to authenticated
 using (exists(select 1 from public.catalog_admins where user_id=(select auth.uid())))
 with check (exists(select 1 from public.catalog_admins where user_id=(select auth.uid())));
create function public.catalog_touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=clock_timestamp(); return new; end $$;
revoke execute on function public.catalog_touch_updated_at() from public, anon, authenticated;
create trigger catalog_update_time before update on public.catalog_products for each row execute function public.catalog_touch_updated_at();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('catalog-images','catalog-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Catalog admin uploads" on storage.objects for insert to authenticated
 with check (bucket_id='catalog-images' and exists(select 1 from public.catalog_admins where user_id=(select auth.uid())));
create policy "Catalog admin image read" on storage.objects for select to authenticated
 using (bucket_id='catalog-images' and exists(select 1 from public.catalog_admins where user_id=(select auth.uid())));
create policy "Catalog admin image cleanup" on storage.objects for delete to authenticated
 using (bucket_id='catalog-images' and exists(select 1 from public.catalog_admins where user_id=(select auth.uid())));
-- Restrict any default privileges inherited when tables were created.
revoke all on public.catalog_admins from anon, authenticated;
grant select on public.catalog_admins to authenticated;
revoke all on public.catalog_products from anon, authenticated;
grant select on public.catalog_products to anon, authenticated;
grant update(name,pack,price,image) on public.catalog_products to authenticated;
