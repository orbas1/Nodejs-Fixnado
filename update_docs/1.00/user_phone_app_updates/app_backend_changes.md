## 2025-10-22 — Communications Repository Integration
- Created `lib/features/communications/data/communications_repository.dart` consuming `/api/communications` endpoints with authenticated client, exponential backoff, and offline cache hydration for conversations/messages/deliveries.
- Repository normalises AI assist metadata, quiet-hour windows, and Agora session payloads before emitting domain models; delivery acknowledgement batching ensures mobile sends remain resilient during spotty connectivity.
- Updated dependency injection (Riverpod providers) so booking/rental controllers can surface unread communications counts and escalate to video sessions using shared communications repository methods.
