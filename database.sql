create table public.associated_people (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  name character varying(255) not null,
  relationship character varying(100) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint associated_people_pkey primary key (id),
  constraint associated_people_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_associated_people_user_id on public.associated_people using btree (user_id) TABLESPACE pg_default;

create table public.bug_reports (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  title character varying(255) not null,
  description text not null,
  steps_to_reproduce text null,
  severity character varying(20) not null,
  status character varying(20) not null default 'new'::character varying,
  device_info text null,
  browser_info text null,
  admin_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bug_reports_pkey primary key (id),
  constraint bug_reports_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint bug_reports_severity_check check (
    (
      (severity)::text = any (
        array[
          ('low'::character varying)::text,
          ('medium'::character varying)::text,
          ('high'::character varying)::text,
          ('critical'::character varying)::text
        ]
      )
    )
  ),
  constraint bug_reports_status_check check (
    (
      (status)::text = any (
        array[
          ('new'::character varying)::text,
          ('in_progress'::character varying)::text,
          ('resolved'::character varying)::text,
          ('closed'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists bug_reports_status_idx on public.bug_reports using btree (status) TABLESPACE pg_default;

create index IF not exists bug_reports_user_id_idx on public.bug_reports using btree (user_id) TABLESPACE pg_default;

create trigger update_bug_reports_updated_at BEFORE
update on bug_reports for EACH row
execute FUNCTION update_bug_reports_updated_at ();

create table public.contacts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  contact_id uuid not null,
  status character varying(20) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  country_code character varying(5) null,
  constraint contacts_pkey primary key (id),
  constraint contacts_user_id_contact_id_key unique (user_id, contact_id),
  constraint contacts_contact_id_fkey foreign KEY (contact_id) references users (id) on delete CASCADE,
  constraint contacts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint contacts_status_check check (
    (
      (status)::text = any (
        array[
          ('pending'::character varying)::text,
          ('accepted'::character varying)::text,
          ('blocked'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_contacts_contact_id on public.contacts using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_contacts_user_id on public.contacts using btree (user_id) TABLESPACE pg_default;

create table public.email_verification_tokens (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  token character varying(255) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  expires_at timestamp with time zone not null,
  constraint email_verification_tokens_pkey primary key (id),
  constraint email_verification_tokens_token_key unique (token),
  constraint email_verification_tokens_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  message text not null,
  type character varying(50) not null,
  related_id uuid null,
  is_read boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  link text null,
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_related_id on public.notifications using btree (related_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

create trigger set_notification_link_trigger BEFORE INSERT on notifications for EACH row
execute FUNCTION set_notification_link ();

create table public.password_reset_tokens (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  token character varying(255) not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  created_by_admin boolean null,
  constraint password_reset_tokens_pkey primary key (id),
  constraint password_reset_tokens_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_password_reset_tokens_expires_at on public.password_reset_tokens using btree (expires_at) TABLESPACE pg_default;

create index IF not exists idx_password_reset_tokens_token on public.password_reset_tokens using btree (token) TABLESPACE pg_default;

create index IF not exists idx_password_reset_tokens_user_id on public.password_reset_tokens using btree (user_id) TABLESPACE pg_default;

create trigger update_password_reset_tokens_updated_at BEFORE
update on password_reset_tokens for EACH row
execute FUNCTION update_updated_at_column ();

create table public.push_subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  subscription jsonb not null,
  device_id uuid not null default gen_random_uuid (),
  device_name character varying(255) null,
  enabled boolean not null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  last_used timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint push_subscriptions_pkey primary key (id),
  constraint unique_user_device unique (user_id, device_id),
  constraint fk_push_subscriptions_user foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_push_subscriptions_device_id on public.push_subscriptions using btree (device_id) TABLESPACE pg_default;

create index IF not exists idx_push_subscriptions_last_used on public.push_subscriptions using btree (last_used) TABLESPACE pg_default;

create index IF not exists idx_push_subscriptions_user_id on public.push_subscriptions using btree (user_id) TABLESPACE pg_default;

create table public.reports (
  id uuid not null default extensions.uuid_generate_v4 (),
  reporter_id uuid not null,
  reported_id uuid not null,
  reason text not null,
  details text not null,
  status text not null default 'pending'::text,
  report_type text not null,
  ride_id uuid null,
  admin_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint reports_pkey primary key (id),
  constraint reports_reported_id_fkey foreign KEY (reported_id) references users (id) on delete CASCADE,
  constraint reports_reporter_id_fkey foreign KEY (reporter_id) references users (id) on delete CASCADE,
  constraint reports_ride_id_fkey foreign KEY (ride_id) references rides (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_reports_reported_id on public.reports using btree (reported_id) TABLESPACE pg_default;

create index IF not exists idx_reports_reporter_id on public.reports using btree (reporter_id) TABLESPACE pg_default;

create index IF not exists idx_reports_ride_id on public.reports using btree (ride_id) TABLESPACE pg_default;

create index IF not exists idx_reports_status on public.reports using btree (status) TABLESPACE pg_default;

create table public.reviews (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  review text not null,
  rating integer not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_approved boolean null default false,
  reviewer_name character varying null,
  constraint reviews_pkey primary key (id),
  constraint reviews_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint reviews_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_reviews_created_at on public.reviews using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_reviews_is_approved on public.reviews using btree (is_approved) TABLESPACE pg_default;

create index IF not exists idx_reviews_user_id on public.reviews using btree (user_id) TABLESPACE pg_default;

create table public.ride_notes (
  id uuid not null default extensions.uuid_generate_v4 (),
  ride_id uuid not null,
  user_id uuid not null,
  note text not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_edited boolean null default false,
  is_deleted boolean null default false,
  seen_by jsonb null default '[]'::jsonb,
  constraint ride_notes_pkey primary key (id),
  constraint ride_notes_ride_id_fkey foreign KEY (ride_id) references rides (id) on delete CASCADE,
  constraint ride_notes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ride_notes_ride_id on public.ride_notes using btree (ride_id) TABLESPACE pg_default;

create table public.rides (
  id uuid not null default extensions.uuid_generate_v4 (),
  from_location character varying(255) not null,
  to_location character varying(255) not null,
  time timestamp with time zone not null,
  requester_id uuid not null,
  accepter_id uuid null,
  status text not null,
  rider_name character varying(255) not null,
  rider_phone character varying(20) null,
  note text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  from_lat numeric(10, 8) not null,
  from_lon numeric(11, 8) not null,
  to_lat numeric(10, 8) not null,
  to_lon numeric(11, 8) not null,
  is_edited boolean null default false,
  constraint rides_pkey primary key (id),
  constraint rides_accepter_id_fkey foreign KEY (accepter_id) references users (id) on delete set null,
  constraint rides_requester_id_fkey foreign KEY (requester_id) references users (id) on delete CASCADE,
  constraint status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'cancelled'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_rides_accepter_id on public.rides using btree (accepter_id) TABLESPACE pg_default;

create index IF not exists idx_rides_requester_id on public.rides using btree (requester_id) TABLESPACE pg_default;


create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  name character varying(255) not null,
  email character varying(255) not null,
  phone character varying(20) null,
  password character varying(255) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  push_enabled boolean null default true,
  is_verified boolean null default false,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_users_phone on public.users using btree (phone) TABLESPACE pg_default;


CREATE OR REPLACE FUNCTION public.set_notification_link()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.link IS NULL THEN
    NEW.link := CASE
      WHEN NEW.type IN ('newNote', 'rideAccepted', 'rideCancelled', 'rideCompleted') AND NEW.related_id IS NOT NULL 
        THEN '/rides/' || NEW.related_id
      WHEN NEW.type IN ('contactRequest', 'contactAccepted') 
        THEN '/profile?tab=contacts'
      WHEN NEW.type = 'newRide' 
        THEN '/dashboard'
      ELSE NULL
    END;
  END IF;
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.search_users_with_unaccent(search_query text, current_user_id uuid, limit_count integer)
 RETURNS TABLE(id uuid, name character varying, phone character varying)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.phone
  FROM users u
  WHERE u.id != current_user_id
  AND (
    unaccent(LOWER(u.name)) LIKE unaccent('%' || LOWER(search_query) || '%')
    OR
    unaccent(LOWER(u.phone)) LIKE unaccent('%' || LOWER(search_query) || '%')
  )
  LIMIT limit_count;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_bug_reports_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.count_reports_by_type()
 RETURNS TABLE(report_type text, count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.report_type, COUNT(*)::BIGINT
  FROM reports r
  GROUP BY r.report_type
  ORDER BY r.report_type;
END;
$function$

CREATE OR REPLACE FUNCTION public.count_reports_by_status()
 RETURNS TABLE(status text, count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.status, COUNT(*)::BIGINT
  FROM reports r
  GROUP BY r.status
  ORDER BY r.status;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_approved_reviews()
 RETURNS TABLE(id uuid, user_name character varying, review text, rating integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.reviewer_name AS user_name,
    r.review,
    r.rating,
    r.created_at
  FROM 
    reviews r
  WHERE 
    r.is_approved = true
  ORDER BY 
    r.created_at DESC;
END;
$function$



CREATE OR REPLACE FUNCTION public.count_reports_by_reason()
 RETURNS TABLE(reason text, count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.reason, COUNT(*)::BIGINT
  FROM reports r
  GROUP BY r.reason
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$function$
