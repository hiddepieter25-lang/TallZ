# Migrations

All 24 migrations applied to the hosted project are now checked in here as `.sql` files, recovered from `supabase_migrations.schema_migrations` on 2026-08-28. Before that they existed only inside Supabase.

## How faithful are these files?

Verified, not assumed. Each file was compared against the database by md5:

- **19 of 24 are byte-identical** to the SQL that was applied (ignoring leading/trailing blank lines).
- **5 differ in exactly one way**, described below.

The check is reproducible — see "Re-verifying" at the bottom.

## The 5 files with a placeholder

`20260725175108`, `20260726213817`, `20260727161313`, `20260727162801`, `20260728190954` each define password-gated admin RPCs, and the applied version has the admin password written into the function body as a string literal.

**This repository is public.** Committing that literal would publish the password to anyone who looks. So in these five files it is replaced with:

```
'__ADMIN_PASSWORD__'
```

Everything else in them is byte-identical to what is applied. To run one against a fresh database, substitute the real value first — it is the same string as `ADMIN_DASHBOARD_PASSWORD` in `apps/web/.env.local` (gitignored).

### This is worth fixing properly

A secret inside a `SECURITY DEFINER` function body is a weak design regardless of this repo's visibility: it is readable by anything that can inspect the function source, it cannot be rotated without a migration, and it has to be kept in sync by hand with the app's env var. The migration's own comment already admits this ("intentionally duplicated ... keep them in sync").

The better shape is to keep the check out of the function body — a `current_setting()` lookup, or gating on `public.is_admin()` (which already exists, `20260714111333`) instead of a password. That is a behaviour change to a live admin panel, so it is deliberately **not** bundled into this recovery work.

## Going forward

New migrations belong here as files, named `<timestamp>_<snake_case_name>.sql`. Never write a credential into one.

## One trap worth knowing

`20260729173650` and `20260826143957` both fix the same mistake: an RLS policy written `to anon` instead of `to anon, authenticated`. It returns **zero rows with no error**, so it looks like missing data rather than a permissions problem. See `CLAUDEMODE.md` §5a. Any new policy on a table the apps read or write must list both roles.

## Re-verifying

To confirm a file still matches the database, compare md5 of the file (leading/trailing newlines trimmed) against:

```sql
select version,
       md5(btrim(array_to_string(statements, E';\n'), E'\n'))
from supabase_migrations.schema_migrations
order by version;
```

For the five redacted ones, wrap the expression in `replace(..., '<the real password>', '__ADMIN_PASSWORD__')` first.

## Applied so far

| Version | Name | File matches DB |
|---|---|---|
| 20260711152234 | create_onboarding_responses | exact |
| 20260711161444 | add_onboarding_photo_storage | exact |
| 20260712134139 | create_catalog_schema | exact |
| 20260713091639 | add_fit_column | exact |
| 20260713092009 | extend_onboarding_responses | exact |
| 20260713093647 | add_baggy_fit_tier | exact |
| 20260714095601 | shopify_ingest_function | exact |
| 20260714100658 | add_profiles_and_link_onboarding | exact |
| 20260714100709 | sync_last_login_on_signin | exact |
| 20260714100733 | onboarding_responses_owner_select | exact |
| 20260714101718 | add_fit_dimensions_and_retailer_region | exact |
| 20260714102356 | add_product_events | exact |
| 20260714102700 | add_own_row_delete_policies | exact |
| 20260714102825 | add_feedback_table | exact |
| 20260714111333 | add_admin_read_access | exact |
| 20260725175108 | add_password_gated_admin_rpcs | password redacted |
| 20260726211520 | add_product_identification_columns | exact |
| 20260726213817 | add_admin_catalog_rpcs | password redacted |
| 20260727161313 | add_admin_retailer_health_rpc | password redacted |
| 20260727162801 | add_retailer_approval_workflow | password redacted |
| 20260728184511 | add_impression_tracking_columns | exact |
| 20260728190954 | add_admin_algorithm_overview_rpc | password redacted |
| 20260729173650 | allow_authenticated_onboarding_insert | exact |
| 20260826143957 | allow_authenticated_catalog_reads | exact |
