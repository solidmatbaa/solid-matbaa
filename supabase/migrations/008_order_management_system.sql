-- Order Management System: spec-aligned statuses, return workflow, admin indexes

-- ============================================================
-- ORDERS: rename legacy statuses → spec names
-- ============================================================
UPDATE public.orders SET status = 'approved' WHERE status = 'confirmed';
UPDATE public.orders SET status = 'shipping' WHERE status = 'shipped';
UPDATE public.orders SET status = 'refunded' WHERE status IN ('refund_processed', 'returned');

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending', 'approved', 'processing', 'shipping', 'delivered', 'refunded', 'rejected'
));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_admin_sections
  ON public.orders(tenant_id, order_type, status, is_archived);

-- Archive on delivered / refunded (rejected orders are deleted, not archived)
CREATE OR REPLACE FUNCTION public.archive_order_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('delivered', 'refunded') THEN
    NEW.is_archived := true;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- RETURNS: expanded workflow statuses
-- ============================================================
UPDATE public.returns SET status = 'refunded' WHERE status = 'delivered';

ALTER TABLE public.returns DROP CONSTRAINT IF EXISTS returns_status_check;
ALTER TABLE public.returns ADD CONSTRAINT returns_status_check CHECK (status IN (
  'pending', 'approved', 'rejected', 'shipping', 'inspecting', 'refunded'
));

CREATE INDEX IF NOT EXISTS idx_returns_admin_sections
  ON public.returns(tenant_id, status, is_archived);

CREATE OR REPLACE FUNCTION public.archive_return_on_refunded()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'refunded' THEN
    NEW.is_archived := true;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_return ON public.returns;
CREATE TRIGGER trg_archive_return
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.archive_return_on_refunded();

-- ============================================================
-- NOTIFICATIONS: link to returns
-- ============================================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS return_id UUID REFERENCES public.returns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_return
  ON public.notifications(return_id);
