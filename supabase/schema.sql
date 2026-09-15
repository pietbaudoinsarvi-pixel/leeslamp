create table if not exists public.books (
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    id text not null,
    data jsonb not null,
    updated bigint not null,
    deleted boolean not null default false,
    file boolean not null default false,
    cover boolean not null default false,
    updated_at timestamptz not null default now(),
    primary key (user_id, id)
);
create or replace function public.touch_book_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at before insert or update on public.books
for each row execute function public.touch_book_updated_at();
create index if not exists books_user_updated_at on public.books (user_id, updated_at);
alter table public.books enable row level security;
drop policy if exists books_owner on public.books;
create policy books_owner on public.books for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.books to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('books', 'books', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;
drop policy if exists books_select on storage.objects;
create policy books_select on storage.objects for select to authenticated
using (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists books_insert on storage.objects;
create policy books_insert on storage.objects for insert to authenticated
with check (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists books_update on storage.objects;
create policy books_update on storage.objects for update to authenticated
using (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists books_delete on storage.objects;
create policy books_delete on storage.objects for delete to authenticated
using (bucket_id = 'books' and (storage.foldername(name))[1] = auth.uid()::text);
