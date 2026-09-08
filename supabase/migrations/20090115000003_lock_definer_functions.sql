-- Two SECURITY DEFINER functions were reachable over the REST API.
--
-- Supabase exposes every function in the `public` schema at `/rest/v1/rpc/<name>`, and both of
-- these run with the definer's rights. `prune_billing_events()` is the serious one: anyone
-- holding the publishable key — which is public by design — could call it and empty the webhook
-- idempotency ledger, after which previously-processed Stripe events replay as new.
--
-- Neither function is meant to be called by anyone. `handle_new_user()` is a trigger, and
-- pruning is a scheduled job run as the service role.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prune_billing_events() from public, anon, authenticated;

-- New functions default to EXECUTE for PUBLIC, so future ones inherit the same lock rather than
-- relying on someone remembering.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
