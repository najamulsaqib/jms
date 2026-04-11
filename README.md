# JMS Tax App (Electron + React + Supabase)

A desktop tax record management app built with Electron React Boilerplate, using Supabase for authentication and tax record storage.

## Features

- Supabase-backed tax record management
- Full CRUD for client tax records (create, view, edit, delete)
- Dashboard with filer stats (`active`, `inactive`, `late-filer`)
- Sortable, searchable, and paginated records table
- Bulk status updates
- CSV import and CSV/PDF export
- Electron auto-update channel support (`latest` and `beta`)

## Supabase Setup

Set these environment variables before running the app:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Supabase client initialization lives in `src/renderer/lib/supabase.ts`.

Create the `tax_records` table in Supabase using the SQL block documented in `src/renderer/services/taxRecord.api.ts`.

## Scripts

```bash
npm start
npm run build
npm run test
```

## Data Flow

1. Renderer components call hooks in `src/renderer/hooks/useTaxRecords.ts`.
2. Hooks call `taxRecordApi` in `src/renderer/services/taxRecord.api.ts`.
3. `taxRecordApi` uses `@supabase/supabase-js` to query and mutate `tax_records`.
4. React Query keeps UI state synchronized after mutations.

## Notes

- Legacy local database code has been removed.
- Tax record data is stored in Supabase.

## Downloads

### Windows

Download the latest `.exe` installer from the [Releases](https://github.com/najamulsaqib/jms/releases) page.

### macOS (TODO)

> macOS builds are not currently available for direct download.
>
> macOS requires apps to be **code signed and notarized** by Apple before they can be distributed. This requires an Apple Developer account ($99/year).
>
> **To do:**
>
> - [ ] Obtain Apple Developer certificate
> - [ ] Configure signing secrets in GitHub Actions (`APPLE_CSC_LINK`, `APPLE_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`)
> - [ ] Set repo variable `APPLE_SIGNING_AVAILABLE=true` to enable the signed build path in CI
> - [ ] Re-enable `hardenedRuntime` and `type: distribution` in `package.json`
