# AI Memory Implementation Plan

## Phase 1 — Safe foundation (current)
- Keep the existing multi-account storage implementation unchanged.
- Add local environment-file ignore rules and a frontend environment template.
- Document the AI-memory design and security boundaries.

## Phase 2 — File inventory and indexing controls (API foundation implemented)
- Add persistent per-account opt-in settings.
- Add account listing with metadata file counts and opt-in state.
- Add metadata inventory API restricted to accounts with indexing enabled.
- No file contents are downloaded or sent to an AI service in this phase.
- Resumable jobs and progress tracking remain future work.

## Phase 3 — Text extraction
- Add bounded, streaming downloads for supported file types.
- Add TXT, Markdown, PDF, DOCX, and HTML extraction.
- Store extraction status and parser errors.
- Apply limits for file size, page count, and processing time.

## Phase 4 — Embeddings and vector storage
- Add provider-neutral embedding interface.
- Add Qdrant as an optional Docker service.
- Store vectors with user, account, file, chunk, and modified-time metadata.
- Make upserts idempotent.

## Phase 5 — Retrieval API
- Add authenticated semantic search.
- Enforce user scope on every vector query.
- Return source file metadata and relevant snippets.
- Add deletion and re-index controls.

## Phase 6 — Memory interface
- Add a Memory page with source accounts, indexing progress, searchable content, and delete controls.
- Add chat retrieval with source citations.
- Treat retrieved document text as untrusted data.
