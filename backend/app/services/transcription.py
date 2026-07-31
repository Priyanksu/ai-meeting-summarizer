import os
from faster_whisper import WhisperModel

device = "cpu"
compute_type = "int8"

_whisper_models = {}

def get_whisper_model():
    """Loads and caches the Whisper small model on GPU."""
    if "multilingual" not in _whisper_models:
        print("Loading Whisper small model... Please wait.")
        _whisper_models["multilingual"] = WhisperModel(
            "small",
            device=device,
            compute_type=compute_type
        )
    return _whisper_models["multilingual"]


def transcribe_audio_file(file_path: str, language_code: str) -> str:
    """Transcribes audio with timestamps, confidence scores, and VAD filtering."""
    model = get_whisper_model()

    if language_code in ["hi", "as"]:
        print(f"Translating {language_code} audio to English...")
        segments, info = model.transcribe(
            file_path,
            beam_size=5,
            task="translate",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=True
        )
    else:
        segments, info = model.transcribe(
            file_path,
            beam_size=5,
            language="en",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=True
        )

    print(f"Detected language: {info.language} (probability: {info.language_probability:.2f})")

    lines = []
    for segment in segments:
        start_min = int(segment.start // 60)
        start_sec = int(segment.start % 60)
        start_ms = int((segment.start % 1) * 100)
        end_min = int(segment.end // 60)
        end_sec = int(segment.end % 60)
        end_ms = int((segment.end % 1) * 100)

        # Confidence from avg_logprob (higher = more confident)
        import math
        confidence = math.exp(segment.avg_logprob) * 100
        confidence = min(confidence, 99)  # Cap at 99%

        timestamp = f"[{start_min:02d}:{start_sec:02d}.{start_ms:02d} → {end_min:02d}:{end_sec:02d}.{end_ms:02d}]"
        lines.append(f"{timestamp} ({confidence:.0f}%) {segment.text.strip()}")

    return "\n".join(lines)
