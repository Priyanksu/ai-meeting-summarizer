# AI Meeting Summarizer 🎙️

An end-to-end, privacy-focused meeting transcription and structured summarization tool running **100% locally and offline**.

---

## 🚀 Features

- **Live Meeting Recording**: In-browser microphone recording with live elapsed timer, animated waveform visualization, pause/resume controls, and custom audio renaming before processing.
- **Audio File Upload**: Support for uploading pre-recorded audio files (`.mp3`, `.wav`, `.m4a`, `.aac` up to 500MB).
- **Speech-to-Text**: Fast local audio transcription powered by `Faster-Whisper` with timestamped segments and confidence scores.
- **Local LLM Summarization**: Detailed meeting intelligence extraction using `Qwen 2.5` via `Ollama` with structured JSON schema and automatic retry logic.
- **Multilingual Support**: Transcribes English, Hindi, and Assamese audio natively, and automatically generates structured executive summaries in English.
- **Meeting Management & History**: Browse past meetings, search by filename, delete past records with confirmation, or export meeting notes to Markdown (`.md`).
- **100% Offline & Private**: Zero external API dependencies — all speech processing, AI summarization, database storage, and frontend rendering execute on your local machine.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), Tailwind CSS, Axios, Lucide Icons
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy, SQLite
- **AI Models**: Faster-Whisper (`small` model), Qwen 2.5 3B (`ollama`)

---

## 📋 Prerequisites

1. **Python 3.11+**
2. **Node.js 18+**
3. **NVIDIA GPU with CUDA support** (or CPU fallback)
4. **Ollama**: Install [Ollama](https://ollama.com/) and pull the model:
   ```bash
   ollama pull qwen2.5:3b
   ```

---

## ⚙️ Setup & Installation

### 1. Clone & Navigate to Project

```bash
cd ai-meeting-summarizer
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell/CMD):
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000 --timeout-keep-alive 300
```

### 3. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

### 4. Open the Application

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 How It Works

1. **Record or Upload**:
   - **Record**: Click **Record Meeting**, speak into your microphone, pause/resume if needed, stop, and optionally rename the `.webm` file.
   - **Upload**: Drag and drop or browse for an existing audio file (`MP3`, `WAV`, `M4A`, `AAC`).
2. **Select Language**: Choose the spoken language track (English, Hindi, or Assamese).
3. **Summarize**: Click **Summarize Meeting**.
   - Faster-Whisper transcribes speech into timestamped lines with confidence scores.
   - Qwen 2.5 generates structured meeting intelligence.
4. **View & Export**: Review the Executive Summary, Key Points, Action Items, Decisions, Risks, Tone, and Full Transcript. Export anytime to Markdown (`.md`).
5. **History & Management**: Access all previous meetings in the **Previous Meetings** tab, search by title, or delete unneeded recordings.

---

## 📊 Summary Output Schema

| Field | Description |
|---|---|
| **Executive Summary** | Comprehensive 3–5 paragraph overview of the meeting |
| **Key Discussion Points** | In-depth major discussion topics with context |
| **Action Items** | Actionable tasks with assignees and deadlines (if identified) |
| **Decisions Taken** | Key decisions agreed upon with underlying rationale |
| **Pending Issues / Risks** | Unresolved questions, blockers, or identified risks |
| **Participants Mentioned** | Detected attendee names or organizational roles |
| **Meeting Tone** | Overall sentiment (e.g. productive, constructive, contentious) |
| **Follow-up Needed** | Recommended next steps and future agenda items |

---

## 🔒 Privacy & Offline Guarantee

All audio recordings, database records (`meetings.db`), speech transcription computations, and LLM inferences remain strictly within your local environment. No data or telemetry is sent to any external server.
