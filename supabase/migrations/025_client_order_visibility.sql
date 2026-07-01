-- Client soft-delete for rejected orders (hide from My Orders without removing the record)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS hidden_from_client BOOLEAN NOT NULL DEFAULT false;
