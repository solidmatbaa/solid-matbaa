drop extension if exists "pg_net";

drop trigger if exists "trg_archive_order" on "public"."orders";

drop trigger if exists "trg_archive_return" on "public"."returns";

drop policy "order_items_insert" on "public"."order_items";

drop policy "order_items_select" on "public"."order_items";

drop policy "orders_admin_update" on "public"."orders";

drop policy "orders_select" on "public"."orders";

drop policy "products_admin" on "public"."products";

drop policy "products_select" on "public"."products";

drop policy "profiles_select" on "public"."profiles";

drop policy "returns_admin" on "public"."returns";

drop policy "returns_select" on "public"."returns";

drop policy "settings_admin" on "public"."settings";

alter table "public"."notifications" drop constraint "notifications_order_id_fkey";

alter table "public"."notifications" drop constraint "notifications_tenant_id_fkey";

alter table "public"."notifications" drop constraint "notifications_user_id_fkey";

alter table "public"."order_items" drop constraint "order_items_order_id_fkey";

alter table "public"."order_items" drop constraint "order_items_product_id_fkey";

alter table "public"."orders" drop constraint "orders_tenant_id_fkey";

alter table "public"."orders" drop constraint "orders_user_id_fkey";

alter table "public"."products" drop constraint "products_tenant_id_fkey";

alter table "public"."profiles" drop constraint "profiles_tenant_id_fkey";

alter table "public"."returns" drop constraint "returns_order_id_fkey";

alter table "public"."returns" drop constraint "returns_tenant_id_fkey";

alter table "public"."returns" drop constraint "returns_user_id_fkey";

alter table "public"."settings" drop constraint "settings_tenant_id_fkey";

alter table "public"."email_verification_tokens" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."notifications" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."order_items" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."products" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."returns" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."settings" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."tenants" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."notifications" add constraint "notifications_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_order_id_fkey";

alter table "public"."notifications" add constraint "notifications_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_tenant_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_items" add constraint "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_product_id_fkey";

alter table "public"."orders" add constraint "orders_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_tenant_id_fkey";

alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey";

alter table "public"."products" add constraint "products_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."products" validate constraint "products_tenant_id_fkey";

alter table "public"."profiles" add constraint "profiles_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_tenant_id_fkey";

alter table "public"."returns" add constraint "returns_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."returns" validate constraint "returns_order_id_fkey";

alter table "public"."returns" add constraint "returns_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."returns" validate constraint "returns_tenant_id_fkey";

alter table "public"."returns" add constraint "returns_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."returns" validate constraint "returns_user_id_fkey";

alter table "public"."settings" add constraint "settings_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."settings" validate constraint "settings_tenant_id_fkey";

grant delete on table "public"."email_verification_tokens" to "anon";

grant insert on table "public"."email_verification_tokens" to "anon";

grant select on table "public"."email_verification_tokens" to "anon";

grant update on table "public"."email_verification_tokens" to "anon";

grant delete on table "public"."email_verification_tokens" to "authenticated";

grant insert on table "public"."email_verification_tokens" to "authenticated";

grant select on table "public"."email_verification_tokens" to "authenticated";

grant update on table "public"."email_verification_tokens" to "authenticated";

grant delete on table "public"."email_verification_tokens" to "service_role";

grant insert on table "public"."email_verification_tokens" to "service_role";

grant select on table "public"."email_verification_tokens" to "service_role";

grant update on table "public"."email_verification_tokens" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."returns" to "anon";

grant insert on table "public"."returns" to "anon";

grant select on table "public"."returns" to "anon";

grant update on table "public"."returns" to "anon";

grant delete on table "public"."returns" to "authenticated";

grant insert on table "public"."returns" to "authenticated";

grant select on table "public"."returns" to "authenticated";

grant update on table "public"."returns" to "authenticated";

grant delete on table "public"."returns" to "service_role";

grant insert on table "public"."returns" to "service_role";

grant select on table "public"."returns" to "service_role";

grant update on table "public"."returns" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";

grant delete on table "public"."tenants" to "anon";

grant insert on table "public"."tenants" to "anon";

grant select on table "public"."tenants" to "anon";

grant update on table "public"."tenants" to "anon";

grant delete on table "public"."tenants" to "authenticated";

grant insert on table "public"."tenants" to "authenticated";

grant select on table "public"."tenants" to "authenticated";

grant update on table "public"."tenants" to "authenticated";

grant delete on table "public"."tenants" to "service_role";

grant insert on table "public"."tenants" to "service_role";

grant select on table "public"."tenants" to "service_role";

grant update on table "public"."tenants" to "service_role";


  create policy "order_items_insert"
  on "public"."order_items"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))));



  create policy "order_items_select"
  on "public"."order_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND ((o.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.profiles p
          WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))))));



  create policy "orders_admin_update"
  on "public"."orders"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = orders.tenant_id)))));



  create policy "orders_select"
  on "public"."orders"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = orders.tenant_id))))));



  create policy "products_admin"
  on "public"."products"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = products.tenant_id)))));



  create policy "products_select"
  on "public"."products"
  as permissive
  for select
  to public
using (((is_active = true) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))));



  create policy "profiles_select"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = profiles.tenant_id))))));



  create policy "returns_admin"
  on "public"."returns"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = returns.tenant_id)))));



  create policy "returns_select"
  on "public"."returns"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = returns.tenant_id))))));



  create policy "settings_admin"
  on "public"."settings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text) AND (p.tenant_id = settings.tenant_id)))));


CREATE TRIGGER trg_archive_order BEFORE UPDATE ON public.orders FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.archive_order_on_status_change();

CREATE TRIGGER trg_archive_return BEFORE UPDATE ON public.returns FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.archive_return_on_delivered();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


