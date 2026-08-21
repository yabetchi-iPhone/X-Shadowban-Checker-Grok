create table if not exists check_history (
  id text primary key,
  user_id text not null,
  username text not null,
  display_name text not null,
  overall_status text not null,
  health_score integer not null,
  checked_at timestamptz not null default now()
);

create index if not exists check_history_user_idx
  on check_history (user_id, checked_at desc);
