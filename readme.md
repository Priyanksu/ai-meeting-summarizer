# AI Meeting Summarizer 🎙️

An end-to-end, privacy-focused meeting transcription and structured summarization tool running 100% locally.

## Features

- **Speech-to-Text**: Offline audio transcription powered by `Faster-Whisper`.
- **Local LLM Pipeline**: Structured meeting summary extraction using `Llama 3.1` via `Ollama`.
- **Multilingual Support**: Supports English, Hindi, and Assamese with automatic English side-by-side translations.
- **FastAPI Backend**: SQLAlchemy database storage and RESTful endpoints.
- **React Frontend**: Clean Tailwind CSS interface with workspace and meeting history tracking.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Axios, Lucide Icons
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **AI Models**: Faster-Whisper, Llama 3.1 (Ollama)

## Setup Instructions

### 1. Prerequisites

- Install [Ollama](https://ollama.com/) and pull Llama 3.1:
  ```bash
  ollama pull llama3.1
  ```

### Backend setup

cd backend
python -m venv venv
(On ubuntu) source venv/bin/activate (On Windows) venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

### Frontend setup

cd frontend
npm install
npm run dev
