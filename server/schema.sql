-- Create a table for public profiles referenced to auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
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
  owner_id uuid references public.profiles(id) not null
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
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
