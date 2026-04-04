# JMS Tax App (Electron + React + SQLite)

A desktop tax record management app built with Electron React Boilerplate, using `better-sqlite3` to store client tax records locally in SQLite.

## Features

- Local SQLite database managed in the Electron main process
- Full CRUD for client tax records (create, view, edit, delete)
- Dashboard with filer stats (active, inactive, late-filer)
- Sortable and searchable records table
- Status tracking: `active`, `inactive`, `late-filer`
- Safe renderer-to-main bridge via preload/IPC
- Confirm dialog for destructive actions

## Local Data Storage

The database file is created automatically in Electron's `userData` path:

- Database file name: `tax-records.sqlite3`
- Table: `tax_records`

## Scripts

```bash
npm start
npm run build
npm run test
```

## Folder Structure

```text
src/
  main/
    db/
      client.ts
      migrations.ts
      taxRecord.repository.ts
    ipc/
      taxRecord.handlers.ts
    main.ts
    menu.ts
    preload.ts
    util.ts

  renderer/
    components/
      common/
        EmptyState.tsx
        LoadingSpinner.tsx
      layout/
        AppLayout.tsx
        Sidebar.tsx
      table/
        DataTable.tsx
      ui/
        Badge.tsx
        Button.tsx
        Card.tsx
        Chip.tsx
        ConfirmDialog.tsx
    pages/
      dashboard/
        Dashboard.tsx
      tax-records/
        TaxRecords.tsx
        TaxRecordDetail.tsx
        TaxRecordForm.tsx
        taxRecordForm.helpers.ts
    hooks/
      useTaxRecords.ts
    App.tsx
    styles.css
    index.tsx

  shared/
    taxRecord.contracts.ts
```

## Routes

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/tax-records` | Tax Records list |
| `/tax-records/new` | Create new record |
| `/tax-records/:id` | Record detail view |
| `/tax-records/:id/edit` | Edit record |

## Data Flow

1. Renderer calls `window.electron.taxRecord.*` methods.
2. Preload forwards calls via `ipcRenderer.invoke`.
3. Main process handles IPC in `src/main/ipc/taxRecord.handlers.ts`.
4. Repository in `src/main/db/taxRecord.repository.ts` reads/writes SQLite.
5. Renderer updates UI from API responses.

## Notes

- All DB access stays in the main process.
- Renderer never imports `better-sqlite3` directly.

## Downloads

### Windows
Download the latest `.exe` installer from the [Releases](https://github.com/najamulsaqib/jms/releases) page.

### macOS (TODO)

> macOS builds are not currently available for direct download.
>
> macOS requires apps to be **code signed and notarized** by Apple before they can be distributed. This requires an Apple Developer account ($99/year).
>
> **To do:**
> - [ ] Obtain Apple Developer certificate
> - [ ] Configure signing secrets in GitHub Actions (`APPLE_CSC_LINK`, `APPLE_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`)
> - [ ] Set repo variable `APPLE_SIGNING_AVAILABLE=true` to enable the signed build path in CI
> - [ ] Re-enable `hardenedRuntime` and `type: distribution` in `package.json`
