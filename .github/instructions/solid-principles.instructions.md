---
description: "Use when writing classes, functions, interfaces, protocols, or modules in any part of the project (backend, ai_engine, frontend). Enforces SOLID principles: SRP, OCP, LSP, ISP, DIP."
applyTo: "**/*.{py,ts,tsx}"
---

# SOLID Principles

## S — Single Responsibility

Each class, module, or function has **one reason to change**.

```python
# BAD: transcription + persistence + notification in one class
class TranscriptionService:
    def transcribe(self, audio): ...
    def save_to_db(self, record): ...
    def send_notification(self, user): ...

# GOOD: split into focused units
class AudioTranscriber:
    def transcribe(self, audio) -> Transcript: ...

class TranscriptRepository:
    def save(self, transcript: Transcript) -> None: ...
```

- One use case per use case class.
- One endpoint concern per router module.
- React components: one responsibility per component (display OR data fetching, not both).

## O — Open / Closed

Open for extension, closed for modification. Add new behavior via new classes or strategies, not by editing existing ones.

```python
# BAD: add new model type by editing existing function
def transcribe(audio, model: str):
    if model == "whisper": ...
    elif model == "qwen": ...   # keeps growing

# GOOD: strategy / protocol
class TranscriberProtocol(Protocol):
    def transcribe(self, audio: bytes) -> str: ...

class WhisperTranscriber:
    def transcribe(self, audio: bytes) -> str: ...

class QwenTranscriber:
    def transcribe(self, audio: bytes) -> str: ...
```

## L — Liskov Substitution

Subtypes must be substitutable for their base type without breaking callers.

- Concrete repository implementations must honour all contracts of the abstract repository.
- Never raise exceptions that the interface doesn't declare.
- Don't narrow parameter types or widen return types in subclasses.

```python
class AudioRepository(ABC):
    def get(self, id: UUID) -> AudioRecord: ...   # never returns None

class PostgresAudioRepository(AudioRepository):
    def get(self, id: UUID) -> AudioRecord:       # must uphold: never None
        result = self.db.query(...)
        if not result:
            raise AudioNotFoundError(id)          # OK — signal failure, not None
        return result
```

## I — Interface Segregation

Clients should not depend on methods they don't use. Prefer small, focused protocols over fat interfaces.

```python
# BAD: one fat interface
class StorageService(ABC):
    def save_audio(self): ...
    def save_report(self): ...
    def delete_audio(self): ...
    def archive_report(self): ...

# GOOD: focused protocols
class AudioWriter(Protocol):
    def save_audio(self, audio: bytes) -> UUID: ...

class ReportWriter(Protocol):
    def save_report(self, report: SOAPReport) -> UUID: ...
```

TypeScript: use small `interface` types; avoid `&`-merging unrelated shapes into a single prop type.

## D — Dependency Inversion

High-level modules depend on abstractions; low-level modules implement them. Inject dependencies — never instantiate infrastructure inside business logic.

```python
# BAD: use case creates its own dependency
class GenerateSOAPUseCase:
    def __init__(self):
        self.repo = PostgresTranscriptRepository()   # concrete!

# GOOD: injected via constructor
class GenerateSOAPUseCase:
    def __init__(
        self,
        repo: TranscriptRepositoryProtocol,
        llm: LLMClientProtocol,
    ) -> None:
        self._repo = repo
        self._llm = llm
```

```typescript
// TypeScript: depend on interface, inject via props or context
interface ReportRepository {
  save(report: SOAPReport): Promise<void>;
}

// Never: const repo = new SupabaseReportRepository() inside a hook
// Always: receive repo as a parameter or via a context/DI container
```

## Quick Checklist

Before submitting any new module or class, verify:
- [ ] Does it have a single, named responsibility?
- [ ] Can I add new behavior without editing this file?
- [ ] Would swapping an implementation break callers?
- [ ] Does the interface expose only what this client needs?
- [ ] Are all external dependencies injected, not instantiated internally?
