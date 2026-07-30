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
                    "follow_up_needed": []
                }


def translate_summary_json(summary_json: dict, target_lang: str) -> dict:
    """Translates the full summary JSON back into the target language."""
    system_prompt = (
        f"You are an expert translator. Translate all textual values in the provided JSON object "
        f"from English to {target_lang}. Keep all JSON keys exactly the same. "
        f"Respond ONLY with a valid JSON object matching the input structure."
    )
    user_content = json.dumps(summary_json, ensure_ascii=False)

    for attempt in range(2):
        try:
            translated_raw = query_local_llm(system_prompt, user_content, json_mode=True)
            return json.loads(translated_raw)
        except json.JSONDecodeError:
            if attempt == 0:
                print("Translation JSON failed. Retrying...")
                continue
            else:
                print("Translation JSON failed after retry. Returning English version.")
                return summary_json


def process_meeting_pipeline(transcript: str, language: str) -> dict:
    """Full pipeline: translate if needed → summarize → translate back."""
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

    # Step 3: For non-English, translate summary back and keep both versions
    if language != "en":
        print(f"Translating summary back into {current_lang}...")
        native_summary_json = translate_summary_json(english_summary_json, current_lang)
        final_output = native_summary_json
        final_output["summary_en"] = english_summary_json
        return final_output

    return english_summary_json
