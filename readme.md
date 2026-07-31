# AI Meeting Summarizer 🎙️

An end-to-end, privacy-focused meeting transcription and structured summarization tool running 100% locally.

## Features

- **Speech-to-Text**: GPU-accelerated audio transcription powered by `Faster-Whisper` with timestamped output and confidence scores.
- **Local LLM Pipeline**: Detailed meeting summary extraction using `Qwen 2.5` via `Ollama` with JSON retry logic.
- **Multilingual Support**: Transcribes English, Hindi, and Assamese audio natively, and automatically generates high-quality structured summaries in English.
- **FastAPI Backend**: SQLAlchemy database storage and RESTful endpoints.
- **React Frontend**: Clean Tailwind CSS interface with workspace, meeting history, and markdown export.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Axios, Lucide Icons
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **AI Models**: Faster-Whisper (small, CUDA), Qwen 2.5 3B (Ollama)

## Setup Instructions

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- NVIDIA GPU with CUDA support
- Install [Ollama](https://ollama.com/) and pull Qwen 2.5:
  ```bash
  ollama pull qwen2.5:3b
  ```

### 2. Backend Setup

```bash
cd backend

python -m venv venv

# On Ubuntu
source venv/bin/activate

# On Windows
venv/Scripts/activate

pip install -r ../requirements.txt

uvicorn app.main:app --reload --port 8000 --timeout-keep-alive 300
```

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

### 4. Open the App

Navigate to `http://localhost:5173` in your browser.

## How It Works

1. **Upload** an audio file (MP3, WAV, M4A, AAC)
2. **Select** the audio language (English, Hindi, or Assamese)
3. The backend **transcribes** the audio using Faster-Whisper on GPU with timestamps and confidence scores
4. The transcript is **summarized** by Qwen 2.5 into structured JSON with executive summary, action items, decisions, participants, tone, and follow-ups
5. Results are **saved** to SQLite and displayed in the frontend

## Summary Output Fields

| Field | Description |
|---|---|
| Executive Summary | 3-5 paragraph overview of the meeting |
| Key Discussion Points | Major topics with context and nuance |
| Action Items | Tasks with responsible person and deadlines |
| Decisions Taken | Each decision with reasoning |
| Pending Issues | Unresolved items with blockers |
| Participants Mentioned | Names or roles detected |
| Meeting Tone | Overall tone (productive, contentious, etc.) |
| Follow-up Needed | Items needing follow-up with next steps |
