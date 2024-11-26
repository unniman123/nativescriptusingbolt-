-- Create user_settings table if it doesn't exist
create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id),
    two_factor_enabled boolean default false,
    two_factor_secret text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Create RLS policies
create policy "Users can view their own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);

create policy "Users can update their own settings"
    on public.user_settings for update
    using (auth.uid() = user_id);

-- Create function to enable 2FA
create or replace function public.enable_two_factor(user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
    new_secret text;
begin
    -- Generate a random secret (in production, use a proper TOTP library)
    new_secret := encode(gen_random_bytes(20), 'base32');
    
    -- Insert or update user settings
    insert into public.user_settings (user_id, two_factor_enabled, two_factor_secret)
    values (user_id, true, new_secret)
    on conflict (user_id) 
    do update set 
        two_factor_enabled = true,
        two_factor_secret = new_secret,
        updated_at = now();
    
    return jsonb_build_object('secret', new_secret);
end;
$$;

-- Create function to verify 2FA token
create or replace function public.verify_two_factor_token(
    user_id uuid,
    token text
)
returns boolean
language plpgsql
security definer
as $$
declare
    stored_secret text;
    is_valid boolean;
begin
    -- Get the stored secret
    select two_factor_secret into stored_secret
    from public.user_settings
    where user_settings.user_id = verify_two_factor_token.user_id;
    
    -- In production, implement proper TOTP verification here
    -- For now, we'll just check if the token matches the first 6 chars of the secret
    is_valid := substring(stored_secret, 1, 6) = token;
    
    return is_valid;
end;
$$;
