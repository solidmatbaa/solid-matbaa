-- Stop auto-archiving orders/returns on status changes.
-- Archive is admin-only (manual / search), not triggered by delivered/refunded.

CREATE OR REPLACE FUNCTION public.archive_order_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_return_on_refunded()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Restore visibility for orders/returns that were auto-archived by the old triggers
UPDATE public.orders
SET is_archived = false
WHERE status = 'refunded' AND is_archived = true;

UPDATE public.returns
SET is_archived = false
WHERE status = 'refunded' AND is_archived = true;
