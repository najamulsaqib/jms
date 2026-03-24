# JMS Tax Todo (Electron + React + SQLite)

A desktop todo app built with Electron React Boilerplate, using `better-sqlite3` to store todos locally in SQLite.

## What Is Implemented

- Local SQLite database in Electron main process
- IPC handlers for todo operations
- Safe renderer-to-main bridge through preload
- Basic todo flow:
  - Create todo
  - List todos

## Local Data Storage

The database file is created automatically in Electron's `userData` path:

- Database file name: `todos.sqlite3`
- Table: `todos`

## Scripts

```bash
npm start
npm run build
npm run test
```

## Folder Structure (Option 1)

```text
src/
  main/
    db/
      client.ts
      migrations.ts
      todo.repository.ts
    ipc/
      todo.handlers.ts
    main.ts
    menu.ts
    preload.ts
    util.ts

  renderer/
    components/
      todo/
        TodoForm.tsx
        TodoItem.tsx
        TodoList.tsx
    pages/
      TodoPage.tsx
    hooks/
      useTodos.ts
    services/
      todo.api.ts
    types/
      todo.ts
    App.css
    App.tsx
    index.ejs
    index.tsx
    preload.d.ts

  shared/
    todo.contracts.ts
```

## Data Flow

1. Renderer calls `window.electron.todo.*` methods.
2. Preload forwards calls via `ipcRenderer.invoke`.
3. Main process handles IPC in `src/main/ipc/todo.handlers.ts`.
4. Repository in `src/main/db/todo.repository.ts` reads/writes SQLite.
5. Renderer updates UI from API responses.

## Notes

- All DB access stays in the main process.
- Renderer never imports `better-sqlite3` directly.
