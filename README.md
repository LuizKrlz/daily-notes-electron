# Daily Notes

Daily Notes is a local desktop app for capturing work daily notes, organizing context by project/date/tags, and tracking tasks that come out of those meetings.

The project is designed to be fast, simple, offline-first, and easy to evolve with Codex.

## Features

- Create, edit, list, and delete dailies
- Simple text search
- Filters by today, date, project, and tag
- Project autocomplete based on previously used projects
- Tag autocomplete with multiple selected tags and removable chips
- Editable daily date, separate from the technical creation date
- Daily participants
- Note sections: yesterday, today, blockers, discussions, and observations
- Rich text blocks with participant mentions using `@`
- Tasks linked to a daily
- Today's task board with `todo`, `doing`, and `done` columns
- Drag and drop tasks between columns, persisting status in SQLite
- Dark mode
- Default and vertical layouts
- Collapsible daily list panel to free up reading/writing space

## Stack

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- Local ShadCN-style UI primitives
- Zustand
- Zod
- SQLite
- better-sqlite3
- electron-builder

## Decisions

### Offline-first

The app does not depend on a remote backend. All data is stored in a local SQLite database:

```bash
~/Library/Application Support/DailyNotes/daily-notes.sqlite
```

This keeps the app fast, usable without internet access, and simple to distribute.

### SQLite in the main process

The renderer never accesses SQLite directly. The flow is:

```text
React Renderer -> Typed Preload -> IPC -> Electron Main -> SQLite
```

This keeps `nodeIntegration=false` and `contextIsolation=true`.

### No heavy ORM

The project uses direct SQL with `better-sqlite3`. For the current size of the app, this keeps complexity low and makes small migrations straightforward.

### Projects and people as entities

Projects and people are first-class database entities. A daily is linked to a project, and people can be linked both to a project and to a specific daily.

When a person participates in a daily for a project, that person also becomes associated with the project and appears as a suggestion in future dailies for that project.

### Daily date separate from createdAt

`createdAt` records when the row was created. `dailyDate` represents the actual date of the daily and can be edited by the user.

This allows users to register late dailies or correct dates without losing basic audit information.

### Tasks as entities

Tasks are not loose text. They have:

- `id`
- `title`
- `status`
- a link to the daily

This makes it possible to show a checklist inside the daily and a separate board for task tracking.

### Optional vertical layout

The default layout remains sidebar, list, and detail. The vertical layout moves filters/navigation to the top while keeping the list and content side by side for portrait monitors.

### Collapsible list

The daily list can be collapsed to increase the usable content area. It is hidden on the task board because it does not add value in that view.

## Structure

```text
src/
  main/
    database/
    ipc/
    services/
    preload.ts
    index.ts

  renderer/
    components/
    features/
    lib/
    store/
    styles/

  shared/
    constants/
    schemas/
    types/
```

## Running Locally

Requirements:

- macOS
- Node.js 22 or compatible
- npm
- Xcode Command Line Tools, because native dependencies such as `better-sqlite3` need them

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

Generate macOS artifacts:

```bash
npm run dist
```

Artifacts are created in:

```text
dist-release/
  DailyNotes-arm64.dmg
  DailyNotes-arm64.zip
  DailyNotes-x64.dmg
  DailyNotes-x64.zip
  mac-arm64/DailyNotes.app
  mac/DailyNotes.app
```

## Distribution

For manual use:

1. Run `npm run dist`
2. Open the `.dmg` for your Mac architecture
3. Drag `DailyNotes.app` into `Applications`

On GitHub Actions, every push/merge to `main` creates a new release containing:

- `DailyNotes-arm64.dmg` for Apple Silicon Macs
- `DailyNotes-x64.dmg` for Intel Macs
- `DailyNotes-arm64.zip`
- `DailyNotes-x64.zip`

The `.zip` files contain the `.app`, because GitHub Releases cannot attach directories directly.

## Signing Notes

The workflow disables automatic certificate discovery with:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false
```

The Electron Builder config also sets `mac.identity` to `null`, which prevents CI or a local machine from accidentally signing the app with an invalid or unrelated certificate. After packaging, an `afterPack` hook applies an ad-hoc signature with `codesign --sign -` so bundle resources are still sealed.

This allows CI builds to run without an Apple Developer certificate. For public distribution outside local/internal use, Apple signing and notarization should be configured.

Without notarization, macOS may block the first launch of an app downloaded from the internet. In that case, use right-click > Open, or approve it explicitly in System Settings > Privacy & Security.
