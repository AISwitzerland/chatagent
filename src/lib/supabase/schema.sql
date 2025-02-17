-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Set up storage for documents
insert into storage.buckets (id, name) values ('documents', 'documents');

-- Create tables
create table public.customer_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  address text,
  preferred_language text check (preferred_language in ('de', 'en', 'fr', 'it')),
  insurance_interests text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  filename text not null,
  file_type text not null,
  size integer not null,
  document_type text check (document_type in ('identification', 'insurance_policy', 'claim', 'other')),
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending',
  upload_date timestamp with time zone default timezone('utc'::text, now()) not null,
  verification_date timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  storage_path text not null
);

create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  advisor_id uuid references auth.users not null,
  type text check (type in ('initial_consultation', 'followup', 'claim_support')),
  status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',
  datetime timestamp with time zone not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  messages jsonb[] default array[]::jsonb[],
  context jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.processing_status (
  process_id text primary key,
  status text not null check (status in ('queued', 'processing_ocr', 'processing_classification', 'processing_storage', 'completed', 'failed')),
  progress integer not null check (progress >= 0 and progress <= 100),
  message text,
  error jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS (Row Level Security)
alter table public.customer_profiles enable row level security;
alter table public.documents enable row level security;
alter table public.appointments enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.processing_status enable row level security;

-- Create policies
create policy "Users can view own profile"
  on public.customer_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.customer_profiles for update
  using (auth.uid() = user_id);

create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can upload own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can view own appointments"
  on public.appointments for select
  using (auth.uid() = user_id);

create policy "Users can manage own chat sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id);

-- Allow anonymous uploads (for testing)
create policy "Allow anonymous uploads"
  on public.documents for insert
  with check (true);

-- Allow anonymous reads (for testing)
create policy "Allow anonymous reads"
  on public.documents for select
  using (true);

-- Allow anonymous updates (for testing)
create policy "Allow anonymous updates"
  on public.documents for update
  using (true);

-- Allow anonymous deletes (for testing)
create policy "Allow anonymous deletes"
  on public.documents for delete
  using (true);

-- Allow anonymous access to processing_status
create policy "Allow anonymous access to processing_status"
  on public.processing_status for all
  using (true);

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.customer_profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updated_at
create trigger set_updated_at
  before update on public.processing_status
  for each row
  execute procedure public.handle_updated_at(); 