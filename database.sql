CREATE TABLE public.associated_people (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  relationship character varying(100) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT associated_people_pkey PRIMARY KEY (id),
  CONSTRAINT associated_people_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_associated_people_user_id ON public.associated_people USING btree (user_id);

CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  status character varying(20) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  country_code character varying(5) NULL,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_user_id_contact_id_key UNIQUE (user_id, contact_id),
  CONSTRAINT contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT contacts_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'blocked'::character varying])::text[])))
);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON public.contacts USING btree (contact_id);

CREATE TABLE public.email_verification_tokens (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  token character varying(255) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT email_verification_tokens_token_key UNIQUE (token),
  CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  type character varying(50) NOT NULL,
  related_id uuid NULL,
  is_read boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  token character varying(255) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);

CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription jsonb NOT NULL,
  device_id uuid NOT NULL DEFAULT gen_random_uuid(),
  device_name character varying(255) NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  last_used timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_device UNIQUE (user_id, device_id),
  CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_id ON public.push_subscriptions USING btree (device_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used ON public.push_subscriptions USING btree (last_used);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  review text NOT NULL,
  rating integer NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  is_approved boolean NULL DEFAULT false,
  reviewer_name character varying NULL,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews USING btree (is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews USING btree (created_at);

CREATE TABLE public.ride_notes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  ride_id uuid NOT NULL,
  user_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  is_edited boolean NULL DEFAULT false,
  is_deleted boolean NULL DEFAULT false,
  seen_by jsonb NULL DEFAULT '[]'::jsonb,
  CONSTRAINT ride_notes_pkey PRIMARY KEY (id),
  CONSTRAINT ride_notes_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  CONSTRAINT ride_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ride_notes_ride_id ON public.ride_notes USING btree (ride_id);

CREATE TABLE public.rides (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  from_location character varying(255) NOT NULL,
  to_location character varying(255) NOT NULL,
  time timestamp with time zone NOT NULL,
  requester_id uuid NOT NULL,
  accepter_id uuid NULL,
  status text NOT NULL,
  rider_name character varying(255) NOT NULL,
  rider_phone character varying(20) NULL,
  note text NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  from_lat numeric(10,8) NOT NULL,
  from_lon numeric(11,8) NOT NULL,
  to_lat numeric(10,8) NOT NULL,
  to_lon numeric(11,8) NOT NULL,
  is_edited boolean NULL DEFAULT false,
  CONSTRAINT rides_pkey PRIMARY KEY (id),
  CONSTRAINT rides_accepter_id_fkey FOREIGN KEY (accepter_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT rides_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'cancelled'::text, 'completed'::text])))
);
CREATE INDEX IF NOT EXISTS idx_rides_requester_id ON public.rides USING btree (requester_id);
CREATE INDEX IF NOT EXISTS idx_rides_accepter_id ON public.rides USING btree (accepter_id);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  phone character varying(20) NULL,
  password character varying(255) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  push_enabled boolean NULL DEFAULT true,
  is_verified boolean NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users USING btree (phone);