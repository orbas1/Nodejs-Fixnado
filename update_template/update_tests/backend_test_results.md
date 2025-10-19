# Backend Test Results

- 2024-06-02 – `npm test` (Vitest) **Failed**. Advertising models now import cleanly, but legacy suites still fail because of historical permission catalog duplication, association alias conflicts, and SQLite FK fixtures (see run `27ff11`).
