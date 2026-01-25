-- DANGEROUS: Drop everything to start fresh as requested
drop table if exists matches cascade;
drop table if exists inquiries cascade;
drop table if exists inventory cascade;
drop table if exists profiles cascade;

-- (Removed vector extension)

-- 1. PROFILES (Manage Roles: 'user' vs 'assistant')
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('user', 'assistant')) default 'user',
  created_at timestamptz default now()
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_metadata->>'full_name',
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. INVENTORY (The Hidden "Found Items" Catalog)
create table inventory (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  -- Search Index: Automatically updates when description changes
  search_tsv tsvector generated always as (to_tsvector('english', description)) stored,
  image_url text, 
  location_found text,
  is_claimed boolean default false,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Index for fast text search
create index inventory_search_idx on inventory using GIN (search_tsv);

-- 3. INQUIRIES (The User's "Lost Item" Reports)
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  description text not null,
  image_url text,
  status text check (status in ('submitted', 'under_review', 'matched', 'resolved')) default 'submitted',
  admin_notes text,
  created_at timestamptz default now()
);

-- 4. MATCHES (The "Likely Candidates" for an Inquiry)
create table matches (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references inquiries(id) on delete cascade,
  inventory_id uuid references inventory(id) on delete cascade,
  score float, -- Rank score from text search ranking
  status text check (status in ('pending', 'rejected', 'confirmed')) default 'pending',
  admin_notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table inventory enable row level security;
alter table inquiries enable row level security;
alter table matches enable row level security;

-- POLICIES

-- Profiles
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);

-- Inventory: ASSISTANTS ONLY
create policy "Assistants can do everything on inventory"
on inventory for all
using ( exists (select 1 from profiles where id = auth.uid() and role = 'assistant') );

-- Inquiries: Users see OWN, Assistants see ALL
create policy "Users can insert inquiries" on inquiries for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can select own inquiries" on inquiries for select to authenticated using (auth.uid() = user_id);
create policy "Assistants can select all inquiries" on inquiries for select to authenticated using ( exists (select 1 from profiles where id = auth.uid() and role = 'assistant') );
create policy "Assistants can update inquiries" on inquiries for update to authenticated using ( exists (select 1 from profiles where id = auth.uid() and role = 'assistant') );

-- Matches: ASSISTANTS ONLY
create policy "Assistants can do everything on matches"
on matches for all
using ( exists (select 1 from profiles where id = auth.uid() and role = 'assistant') );

-- Storage
insert into storage.buckets (id, name, public) values ('images', 'images', true);
create policy "Authenticated Upload" on storage.objects for insert to authenticated with check (bucket_id = 'images');
create policy "Public Read" on storage.objects for select using (bucket_id = 'images');
