-- Create a table for users
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  failed_login_attempts int default 0,
  locked_until timestamp with time zone,
  email_verified boolean default false,
  metadata jsonb default '{}'::jsonb
);

-- Create a table for refresh tokens
create table public.refresh_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  token_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  revoked boolean default false,
  user_agent text,
  ip_address text
);

-- Create a table for public profiles
create table public.profiles (
  id uuid references public.users(id) not null primary key,
  username text,
  avatar_url text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- Create a table for user settings
create table public.user_settings (
  user_id uuid references public.users(id) not null primary key,
  theme text default 'system',
  email_notifications boolean default true,
  desktop_notifications boolean default true,
  weekly_digest boolean default false,
  language text default 'en',
  timezone text default 'UTC',
  has_seen_onboarding boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for documents
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text default 'Untitled Document',
  content jsonb, -- Store snapshot of document content
  owner_id uuid references public.users(id) not null
);

alter table public.documents enable row level security;

-- Create type for collaboration roles
create type public.collaboration_role as enum ('view', 'edit');

-- Create a table for collaborators
create table public.collaborators (
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role public.collaboration_role default 'view'::public.collaboration_role,
  
  primary key (document_id, user_id)
);

alter table public.collaborators enable row level security;

-- Policies for Documents
-- 1. Owners can do everything
create policy "Owners can do everything on documents" on documents
  for all using (auth.uid() = owner_id);

-- 2. Collaborators can view
create policy "Collaborators can view documents" on documents
  for select using (
    exists (
      select 1 from collaborators
      where document_id = documents.id and user_id = auth.uid()
    )
  );

-- 3. Collaborators with 'edit' role can update
create policy "Editors can update documents" on documents
  for update using (
    exists (
      select 1 from collaborators
      where document_id = documents.id 
      and user_id = auth.uid() 
      and role = 'edit'
    )
  );

-- Policies for Collaborators
-- 1. Owners can manage collaborators
create policy "Owners can manage collaborators" on collaborators
  for all using (
    exists (
      select 1 from documents
      where id = collaborators.document_id and owner_id = auth.uid()
    )
  );

-- 2. Users can view their own collaborations
create policy "Users can view own collaborations" on collaborators
  for select using (user_id = auth.uid());

-- Function to handle new user signup (automatically create profile)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- Create profile
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.name, new.avatar_url);
  
  -- Create default settings
  insert into public.user_settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create or replace trigger on_user_created
  after insert on public.users
  for each row execute procedure public.handle_new_user();
-- Create a table for snapshots (history)
create table public.snapshots (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.documents(id) on delete cascade not null,
  title text,
  snapshot_data text not null, -- Store as JSON string or YJS update
  saved_by uuid references public.users(id) not null,
  saved_by_name text,
  description text,
  is_auto boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
