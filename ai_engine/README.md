# Vina Doctor — AI Engine

FastAPI service that accepts medical consultation audio, transcribes it with speaker diarization, and returns structured multilingual SOAP reports using Alibaba's Qwen models via DashScope.

---

## Table of contents

1. [Architecture](#architecture)
2. [API endpoints](#api-endpoints)
3. [Pipeline modes](#pipeline-modes)
4. [Project structure](#project-structure)
5. [Setup](#setup)
6. [Running the service](#running-the-service)
7. [Environment variables](#environment-variables)
8. [Output schema](#output-schema)

---

## Architecture

The service follows Clean Architecture with four layers:

```
Domain          entities, value objects, protocol interfaces (no external deps)
Application     use cases — orchestrate domain objects and protocols
Adapters        agents (ScribeAgent, ClinicalAgent), API routers, schemas
Infrastructure  QwenAudioClient, VoiceActivityDetector, ModelSelector,
                InMemoryPipelineStateTracker, audio processor, text cleaner
```

Dependency direction: Infrastructure → Adapters → Application → Domain.

---

## API endpoints

All routes are mounted under `/v1/consultations`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/consultations/process` | Legacy single-call pipeline (Unified mode only) |
| `POST` | `/v1/consultations/process-v2` | Multi-agent pipeline (Unified or Two-Step) |

Interactive docs are available at `http://localhost:8000/docs` when the service is running.

### `POST /v1/consultations/process`

Upload an audio file and receive a structured SOAP report in a single Qwen call.

**Query parameters**

| Name | Default | Description |
|------|---------|-------------|
| `model` | `qwen-audio-turbo` | Qwen model to use. Use `qwen-audio-max` for long or complex recordings. |

**Form data**

| Field | Type | Description |
|-------|------|-------------|
| `file` | `UploadFile` | Audio file (mp3, m4a, wav, webm, ogg, flac, aac) |

---

### `POST /v1/consultations/process-v2`

Upload an audio file and receive a structured SOAP report via the multi-agent pipeline.

**Query parameters**

| Name | Default | Description |
|------|---------|-------------|
| `mode` | `two_step` | Pipeline mode: `unified` or `two_step` |
| `model` | _(auto)_ | Optional model override. Leave empty for automatic selection. |

**Form data**

| Field | Type | Description |
|-------|------|-------------|
| `file` | `UploadFile` | Audio file (mp3, m4a, wav, webm, ogg, flac, aac) |

---

## Pipeline modes

### `unified` — single LLM call

```
audio → VAD → ffmpeg convert → Qwen2-Audio (transcription + SOAP in one prompt) → MedicalReport
```

The `MedicalExtractor` agent sends the audio directly to Qwen with a combined medical scribe + SOAP extraction prompt and parses the structured JSON response.

### `two_step` (default) — Scribe → Clinical

```
audio → VAD → ffmpeg convert
      → ScribeAgent (Qwen2-Audio): audio → transcript + diarization + session_info
      → TextCleanerService: PII redaction (phones, emails, national IDs)
      → ClinicalAgent (Qwen): transcript text → SOAP report + diagnostics + urgency
      → MedicalReport (merged result)
```

Each agent uses the model selected by `ModelSelector` (configurable via env vars) or the caller-supplied override.

**Pipeline statuses** (tracked in-memory per session):

`pending` → `transcribing` → `cleaning` → `analyzing` → `completed` / `failed`

---

## Project structure

```
ai_engine/
├── main.py                          # App factory, DI wiring, FastAPI lifespan
├── domain/
│   ├── entities.py                  # Pydantic data models (MedicalReport, ClinicalReport, …)
│   ├── value_objects.py             # Enums: SeverityFlag, UrgencyLevel, PipelineMode, PipelineStatus
│   ├── protocols.py                 # Protocol interfaces: ScribeAgentProtocol, ClinicalAgentProtocol, …
│   └── repositories.py
├── application/
│   └── use_cases/
│       ├── process_audio_use_case.py        # Unified single-call pipeline
│       └── process_consultation_use_case.py # Two-step Scribe → Clinical pipeline
├── agents/
│   ├── scribe_agent.py              # Audio → structured transcript (Qwen2-Audio)
│   ├── scribe_prompts.py            # System + user prompts for ScribeAgent
│   ├── clinical_agent.py            # Transcript → SOAP report + diagnostics (Qwen)
│   ├── clinical_prompts.py          # System + user prompts for ClinicalAgent
│   ├── extractor.py                 # MedicalExtractor (unified mode)
│   ├── prompts.py                   # Master prompt for unified mode
│   └── reporter.py                  # MedicalReporter (unified mode post-processing)
├── api/
│   └── v1/
│       ├── routers/
│       │   └── consultations.py     # FastAPI router — /v1/consultations/*
│       └── schemas/
│           └── consultation_schemas.py  # Request/response Pydantic schemas
├── infrastructure/
│   ├── clients/
│   │   └── qwen_audio_client.py     # DashScope MultiModalConversation wrapper
│   ├── vad/
│   │   └── voice_activity_detector.py  # File-size heuristic VAD (swap for silero-vad later)
│   ├── model_selector.py            # Picks Qwen model by task; env-var overridable
│   └── state_tracker.py             # InMemoryPipelineStateTracker (swap for Redis in prod)
└── processors/
    ├── audio.py                     # validate_and_convert: extension check + ffmpeg transcoding
    └── text_cleaner.py              # PII redaction: phones, emails, Vietnamese national IDs
```

---

## Setup

**Requirements**

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip
- ffmpeg (optional — used for audio format conversion; service works without it)
- A DashScope API key with access to `qwen-audio-turbo` / `qwen-audio-max`

**Install dependencies**

```bash
# From the ai_engine/ directory
cd ai_engine
uv sync
```

Or with pip:

```bash
pip install -e .
```

**Configure environment**

```bash
cp .env.example .env
# Edit .env and set DASHSCOPE_API_KEY
```

---

## Running the service

```bash
# From the repository root
uvicorn ai_engine.main:app --reload --port 8000
```

The service starts on `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DASHSCOPE_API_KEY` | ✅ | — | Alibaba Cloud DashScope API key |
| `VINA_MODEL_SCRIBE` | ❌ | `qwen-audio-turbo` | Qwen model used by ScribeAgent |
| `VINA_MODEL_CLINICAL` | ❌ | `qwen-audio-turbo` | Qwen model used by ClinicalAgent |
| `VINA_MODEL_CLINICAL_COMPLEX` | ❌ | `qwen-audio-max` | Qwen model for complex clinical tasks |

---

## Output schema

Both endpoints return a `MedicalReport`-shaped JSON body:

```jsonc
{
  "metadata": {
    "primary_language": "vi",
    "consultation_duration_estimate": null,
    "session_id": "abc123",
    "model": "scribe=qwen-audio-turbo, clinical=qwen-audio-turbo"
  },
  "transcript": [
    { "speaker": "Doctor", "timestamp": "00:00", "text": "Xin chào, hôm nay bạn cảm thấy thế nào?" },
    { "speaker": "Patient", "timestamp": "00:05", "text": "Tôi bị đau đầu từ sáng." }
  ],
  "clinical_report": {
    "chief_complaint": { "en": "Headache since morning", "vn": "Đau đầu từ sáng", "fr": "Maux de tête depuis ce matin", "ar": "صداع منذ الصباح" },
    "soap_notes": {
      "subjective":  { "en": "...", "vn": "...", "fr": "...", "ar": "..." },
      "objective":   { "en": "...", "vn": "...", "fr": "...", "ar": "..." },
      "assessment":  { "en": "...", "vn": "...", "fr": "...", "ar": "..." },
      "plan":        { "en": "...", "vn": "...", "fr": "...", "ar": "..." }
    },
    "medications": [
      {
        "name": "Paracetamol",
        "dosage": "500mg",
        "frequency": "Every 6 hours",
        "route": "oral",
        "instructions": { "en": "Take with food", "vn": "Uống cùng bữa ăn" }
      }
    ],
    "icd10_codes": ["G43.9"],
    "severity_flag": "Low",
    "urgency_level": "Low",
    "diagnostics": {
      "primary_diagnosis": "Tension headache",
      "icd10_code": "G44.2",
      "confidence_score": 0.82
    },
    "next_steps": { "en": "Rest and follow up in 3 days", "vn": "Nghỉ ngơi và tái khám sau 3 ngày" }
  },
  "multilingual_summary": {
    "en": "Patient presented with tension headache...",
    "vn": "Bệnh nhân đến với triệu chứng đau đầu căng thẳng...",
    "fr": "Le patient s'est présenté avec des céphalées de tension...",
    "ar": "قدّم المريض بصداع توتري..."
  }
}
```

**Severity and urgency values**

| Field | Possible values |
|-------|----------------|
| `severity_flag` | `Low`, `Medium`, `High` |
| `urgency_level` | `Low`, `Medium`, `High`, `Emergency` |
