# Local-first database layer

## Current and target responsibilities

- `schema.ts`: Dexie database and versioned object-store definitions.
- `records.ts`: types for the new stores. Legacy app types remain untouched.
- `repositories.ts`: typed CRUD contracts and explicit primary-identity initializer.
- `diagnostics.ts`: read-only storage inventory; never exposes record payloads.
- `repo.ts`, `client.ts`, `worker.ts`: existing memory/echo/imprint worker API.

## Safety rules

1. Creating the database schema does not migrate or delete legacy localStorage.
2. `ensurePrimaryIdentity` is explicit and is not run automatically on app startup.
3. Do not auto-select or merge legacy persona projects. Ask the user which existing persona text should seed the single companion.
4. Do not persist API keys in any object store.
5. Media blobs should be written only by a future explicit import flow after a verified backup.
6. The existing `clearAll` API currently clears only the three legacy IndexedDB stores; do not reuse it as a whole-app wipe operation.

## Dexie v3

Version 3 adds new stores alongside existing memories, echoes and imprints. Existing stores and their data are retained unchanged. New tables are empty until a feature explicitly writes to them.
