# import os
# from faster_whisper import WhisperModel

# # If you have an NVIDIA GPU setup with CUDA installed, set device to "cuda"
# device = "cuda" if os.getenv("USE_CUDA") == "true" else "cpu"
# compute_type = "float16" if device == "cuda" else "int8"

# # Global dictionary cache to keep the model loaded in RAM/VRAM
# _whisper_models = {}

# def get_whisper_model(language: str):
#     """Loads and caches the correct offline model depending on the language selection."""
#     model_key = "assamese" if language == "as" else "multilingual"
    
#     if model_key not in _whisper_models:
#         if model_key == "assamese":
#             print("Loading local Assamese optimized Whisper model... Please wait.")
#             _whisper_models[model_key] = WhisperModel(
#                 "DrishtiSharma/whisper-large-v2-assamese-700-steps", 
#                 device=device, 
#                 compute_type=compute_type
#             )
#         else:
#             print("Loading local Multilingual Whisper large-v3 model... Please wait.")
#             _whisper_models[model_key] = WhisperModel(
#                 "large-v3", 
#                 device=device, 
#                 compute_type=compute_type
#             )
            
#     return _whisper_models[model_key]

# def transcribe_audio_file(file_path: str, language_code: str) -> str:
#     """Processes the saved audio file and returns text."""
#     model = get_whisper_model(language_code)
    
#     # Enforce static language parameters for standard tracks
#     lang_param = None if language_code == "as" else language_code
    
#     segments, info = model.transcribe(file_path, beam_size=5, language=lang_param)
    
#     transcript = " ".join([segment.text for segment in segments])
#     return transcript



import os
from faster_whisper import WhisperModel

device = "cuda" if os.getenv("USE_CUDA") == "true" else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

_whisper_models = {}

def get_whisper_model():
    """Loads and caches the single standard multilingual Whisper model."""
    if "multilingual" not in _whisper_models:
        print("Loading local Multilingual Whisper large-v3 model... Please wait.")
        _whisper_models["multilingual"] = WhisperModel(
            "large-v3", 
            device=device, 
            compute_type=compute_type
        )
    return _whisper_models["multilingual"]

# def transcribe_audio_file(file_path: str, language_code: str) -> str:
#     """Processes the saved audio file and returns text."""
#     model = get_whisper_model()
    
#     # Pass 'as' directly to Whisper transcribe
#     segments, info = model.transcribe(file_path, beam_size=5, language=language_code)
    
#     transcript = " ".join([segment.text for segment in segments])
#     return transcript

def transcribe_audio_file(file_path: str, language_code: str) -> str:
    """Processes the saved audio file and returns text."""
    model = get_whisper_model()
    
    # If the user selects Hindi ('hi') or Assamese ('as'), we tell Whisper
    # to translate the audio directly into English text on the fly.
    if language_code in ["hi", "as"]:
        print(f"Directly translating {language_code} audio to English text...")
        segments, info = model.transcribe(file_path, beam_size=5, task="translate")
    else:
        # Standard English transcription track
        segments, info = model.transcribe(file_path, beam_size=5, language="en")
    
    transcript = " ".join([segment.text for segment in segments])
    return transcript