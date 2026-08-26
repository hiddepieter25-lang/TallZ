# Migrations

**Read this before changing the database.**

## Current state, stated plainly

There are **24 migrations applied to the hosted project and zero `.sql` files in this folder.** Every schema change so far was applied directly against the remote database. That means:

- The schema history exists only inside Supabase. If that project were deleted, it would be gone.
- Nothing here is code-reviewable — you cannot see in a diff what a migration did.
- The database cannot be rebuilt from this repo.

This is a real gap, not a style preference. It is written down here rather than quietly left as a surprise.

## Back-filling the existing 24

The SQL is still recoverable — Supabase keeps it in `supabase_migrations.schema_migrations`. Pulling it into files needs the CLI and the database password:

```bash
npx supabase link --project-ref vcitwawndwowctyvbzlc
npx supabase db pull
```

`link` prompts for the database password (Supabase dashboard → Project Settings → Database). That has to be entered by a person — it is not something to paste into a chat or commit anywhere.

Doing this once turns all 24 into real files here, after which the repo can rebuild the schema.

## Going forward

New migrations belong here as files, named `<timestamp>_<snake_case_name>.sql` to match the versions already applied.

## Applied so far

| Version | Name |
|---|---|
| 20260711152234 | create_onboarding_responses |
| 20260711161444 | add_onboarding_photo_storage |
| 20260712134139 | create_catalog_schema |
| 20260713091639 | add_fit_column |
| 20260713092009 | extend_onboarding_responses |
| 20260713093647 | add_baggy_fit_tier |
| 20260714095601 | shopify_ingest_function |
| 20260714100658 | add_profiles_and_link_onboarding |
| 20260714100709 | sync_last_login_on_signin |
| 20260714100733 | onboarding_responses_owner_select |
| 20260714101718 | add_fit_dimensions_and_retailer_region |
| 20260714102356 | add_product_events |
| 20260714102700 | add_own_row_delete_policies |
| 20260714102825 | add_feedback_table |
| 20260714111333 | add_admin_read_access |
| 20260725175108 | add_password_gated_admin_rpcs |
| 20260726211520 | add_product_identification_columns |
| 20260726213817 | add_admin_catalog_rpcs |
| 20260727161313 | add_admin_retailer_health_rpc |
| 20260727162801 | add_retailer_approval_workflow |
| 20260728184511 | add_impression_tracking_columns |
| 20260728190954 | add_admin_algorithm_overview_rpc |
| 20260729173650 | allow_authenticated_onboarding_insert |
| 20260826143957 | allow_authenticated_catalog_reads |

## One trap worth knowing

The last two entries above both fix the same mistake: an RLS policy written `to anon` instead of `to anon, authenticated`. It returns **zero rows with no error**, so it looks like missing data rather than a permissions problem. See `CLAUDEMODE.md` §5a. Any new policy on a table the apps read or write must list both roles.
