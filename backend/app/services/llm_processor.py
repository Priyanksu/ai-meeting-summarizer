import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "qwen2.5:3b"
REQUEST_TIMEOUT = 300  # 5 minute timeout for LLM requests


def query_local_llm(system_prompt: str, user_content: str, json_mode: bool = False) -> str:
    """Sends a prompt to the local Ollama instance with timeout and retry."""
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "stream": False
    }
    if json_mode:
        payload["format"] = "json"

    response = requests.post(OLLAMA_URL, json=payload, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json()["message"]["content"]


def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translates text using the local LLM."""
    system_prompt = (
        f"You are an expert translator. Translate the following text from {source_lang} to {target_lang}. "
        f"Maintain formal professional business language. Respond ONLY with the raw translation text without commentary."
    )
    return query_local_llm(system_prompt, text)


def generate_english_summary(english_transcript: str) -> dict:
    """Generates a detailed structured meeting summary with retry on JSON failure."""
    system_prompt = (
        "You are an expert meeting secretary who creates thorough, detailed summaries. "
        "Analyze the provided meeting transcript carefully. "
        "You MUST respond ONLY with a valid JSON object matching this exact schema: "
        '{"executive_summary": "A detailed 3-5 paragraph overview of the entire meeting", '
        '"key_discussion_points": ["Detailed description of each major topic discussed with context and nuance"], '
        '"action_items": ["Specific action item with responsible person if mentioned and deadline if mentioned"], '
        '"decisions_taken": ["Each decision made with the reasoning behind it"], '
        '"pending_issues": ["Unresolved issues with current status and blockers"], '
        '"participants_mentioned": ["Names or roles of people mentioned"], '
        '"meeting_tone": "Overall tone - e.g. productive, contentious, brainstorming", '
        '"follow_up_needed": ["Items that need follow-up with suggested next steps"]}'
    )

    # Try up to 2 times in case of bad JSON
    for attempt in range(2):
        try:
            raw_json = query_local_llm(system_prompt, english_transcript, json_mode=True)
            return json.loads(raw_json)
        except json.JSONDecodeError:
            if attempt == 0:
                print("LLM returned invalid JSON. Retrying...")
                continue
            else:
                print("JSON parsing failed after retry. Returning raw text.")
                return {
                    "executive_summary": raw_json,
                    "key_discussion_points": [],
                    "action_items": [],
                    "decisions_taken": [],
                    "pending_issues": [],
                    "participants_mentioned": [],
                    "meeting_tone": "Unknown",
                }

def process_meeting_pipeline(transcript: str, language: str) -> dict:
    """Full pipeline: translate if needed → summarize."""
    language_map = {"en": "English", "hi": "Hindi", "as": "Assamese"}
    current_lang = language_map.get(language, "English")

    # Step 1: Translate non-English transcript to English (if needed)
    if language != "en":
        print(f"Translating {current_lang} transcript to English...")
        english_transcript = translate_text(transcript, current_lang, "English")
    else:
        english_transcript = transcript

    # Step 2: Generate detailed English summary
    print("Generating structured summary...")
    english_summary_json = generate_english_summary(english_transcript)

    return english_summary_json