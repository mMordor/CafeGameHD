-- PostgreSQL design for GameZone reservations.
--
-- STATUS: DESIGN ONLY. This file has NOT been executed against a database and the app
-- does not use it yet (see README "Storage"). It documents how the guarantees the file
-- store provides today map onto PostgreSQL, so the adapter can be written and tested
-- against a real Supabase / Neon database.

create extension if not exists btree_gist;

create table reservations (
  id                uuid primary key default gen_random_uuid(),
  serial            char(4)     not null check (serial ~ '^[0-9]{4}$'),
  -- true while the serial is "in use": status confirmed/checked_in AND the booking has not ended.
  -- Maintained by the application in the same transaction as status changes, and cleared by a
  -- periodic job once end time passes (now() cannot be used in an index predicate).
  serial_active     boolean     not null default true,
  tier              text        not null check (tier in ('standard', 'pro')),
  date              date        not null,
  start_hour        smallint    not null check (start_hour between 0 and 23),
  hours             smallint    not null check (hours >= 1 and start_hour + hours <= 24),
  name              text        not null,
  phone             text        not null default '',
  note              text        not null default '',
  status            text        not null check (status in ('confirmed','checked_in','completed','no_show','cancelled')),
  source            text        not null check (source in ('online','phone')),
  created_by        text,
  price_per_seat    integer     not null check (price_per_seat >= 0),
  total             integer     not null check (total >= 0),
  pricing_estimated boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

-- One four-digit serial per *active* reservation. Exhaustion (10,000 active) = insert fails -> HTTP 503.
create unique index reservations_active_serial on reservations (serial) where serial_active;
create index reservations_date_tier on reservations (date, tier);
create index reservations_phone on reservations (phone);

-- One row per reserved seat. The exclusion constraint makes overlapping bookings of the same
-- seat impossible even under concurrent transactions; no application-level lock is needed.
create table reservation_seats (
  reservation_id uuid     not null references reservations(id) on delete cascade,
  tier           text     not null,
  date           date     not null,
  seat           smallint not null check (seat >= 1),
  during         int4range not null,                  -- [start_hour, start_hour + hours)
  blocking       boolean  not null,                   -- true while status is confirmed / checked_in
  primary key (reservation_id, seat),
  constraint no_double_booking
    exclude using gist (tier with =, date with =, seat with =, during with &&) where (blocking)
);

-- Application rules that must run in the same transaction as writes:
--   * insert reservation + its reservation_seats rows (catch SQLSTATE 23P01 -> "seat taken")
--   * on status change set reservation_seats.blocking = (status in ('confirmed','checked_in'))
--   * allocate serial: pick random free 4-digit value; retry on unique_violation (23505)
--   * migrate legacy JSON records with the same normalization as lib/domain/migrate.ts
