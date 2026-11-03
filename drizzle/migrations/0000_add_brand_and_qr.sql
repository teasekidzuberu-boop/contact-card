ALTER TABLE public.card_profile ADD COLUMN IF NOT EXISTS brand_color text NOT NULL DEFAULT '#D7B56D';
ALTER TABLE public.card_profile ADD COLUMN IF NOT EXISTS qr_url text NOT NULL DEFAULT '';