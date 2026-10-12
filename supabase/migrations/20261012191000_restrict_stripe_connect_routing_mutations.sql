-- Only trusted backend provisioning can alter Stripe Connect routing.
-- Prevent authenticated staff from substituting an attacker-controlled connected account.
revoke insert, update, delete on public.organization_payment_connections from authenticated;
drop policy if exists "Staff create org payment connection" on public.organization_payment_connections;
drop policy if exists "Staff update org payment connection" on public.organization_payment_connections;
drop policy if exists "Staff delete org payment connection" on public.organization_payment_connections;
-- Keep existing staff SELECT policy for connection status visibility.
