-- Manager creation now happens only through the one-time QR Edge Function.
-- The old activate_manager RPC belongs to the removed email/manual activation flow.
revoke execute on function public.activate_manager(uuid,text,text,text,integer) from authenticated;
