# v0.9.0 verification

Svelte/TypeScript checks pass with no diagnostics; production frontend builds.
All 15 Playwright tests pass, including collection create/bulk assignment/filter/
delete, appearance persistence, overlapping detail artwork, keyboard/reduced
motion behavior, and existing editing/progress interactions.

Go adapter race tests and vet pass. Native Wails builds succeeded for Windows
AMD64 and local macOS ARM64, and the macOS package includes the matching CLI.
Windows/Linux native runtime interaction is distinct from browser tests; Linux
release compilation and packaging are verified by the release workflow.

Shared core tests cover transactional schema migration, indexed collection
queries, Unicode tag matching, image normalization, archive round trips, merge
identity remapping/idempotence, corruption rejection, and reference cleanup.
