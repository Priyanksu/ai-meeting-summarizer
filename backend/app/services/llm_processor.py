# import json
# import requests

# OLLAMA_URL = "http://localhost:11434/api/chat"

# def query_local_llm(system_prompt: str, user_content: str, json_mode: bool = False) -> str:
#     """Interacts directly with the local running Ollama instance."""
#     payload = {
#         "model": "llama3.1",
#         "messages": [
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": user_content}
#         ],
#         "stream": False
#     }
#     if json_mode:
#         payload["format"] = "json"
        
#     response = requests.post(OLLAMA_URL, json=payload)
#     response.raise_for_status()
#     return response.json()["message"]["content"]

# def translate_text(text: str, source_lang: str, target_lang: str) -> str:
#     """Translates individual blocks of text locally using Llama-3.1."""
#     system_prompt = f"You are an expert translator. Translate the following text from {source_lang} to {target_lang}. Maintain formal professional business language. Respond ONLY with the raw translation text without commentary."
#     return query_local_llm(system_prompt, text)

# def generate_english_summary(english_transcript: str) -> dict:
#     """Generates a structured meeting summary based on the English transcript text."""
#     system_prompt = (
#         "You are an expert meeting secretary. Summarize the provided meeting transcript. "
#         "You MUST respond ONLY with a valid JSON object matching this exact schema: "
#         '{"executive_summary": "string", "key_discussion_points": ["string"], "action_items": ["string"], "decisions_taken": ["string"], "pending_issues": ["string"]}'
#     )
    
#     raw_json = query_local_llm(system_prompt, english_transcript, json_mode=True)
#     return json.loads(raw_json)


# def translate_summary_json(summary_json: dict, target_lang: str) -> dict:
#     """Translates the full summary JSON back into the target language in ONE request."""
#     system_prompt = (
#         f"You are an expert translator. Translate all textual values in the provided JSON object "
#         f"from English to {target_lang}. Keep all JSON keys exactly the same. "
#         f"Respond ONLY with a valid JSON object matching the input structure."
#     )
#     user_content = json.dumps(summary_json, ensure_ascii=False)
#     translated_raw = query_local_llm(system_prompt, user_content, json_mode=True)
#     return json.loads(translated_raw)

# def process_meeting_pipeline(transcript: str, language: str) -> dict:
#     language_map = {"en": "English", "hi": "Hindi", "as": "Assamese"}
#     current_lang = language_map.get(language, "English")
    
#     # Step 1: Translate non-English audio transcript to English
#     if language != "en":
#         print(f"Translating {current_lang} transcript to English...")
#         english_transcript = translate_text(transcript, current_lang, "English")
#     else:
#         english_transcript = transcript
        
#     # Step 2: Generate English structured summary
#     print("Generating structured summary fields...")
#     summary_json = generate_english_summary(english_transcript)
    
#     # Step 3: Translate summary JSON back in ONE call
#     if language != "en":
#         print(f"Translating summary back into {current_lang} in one single pass...")
#         summary_json = translate_summary_json(summary_json, current_lang)
        
#     return summary_json

# # def process_meeting_pipeline(transcript: str, language: str) -> dict:
# #     """Orchestrates the entire translation and summarization pipeline workflow."""
# #     language_map = {"en": "English", "hi": "Hindi", "as": "Assamese"}
# #     current_lang = language_map.get(language, "English")
    
# #     # Step 1: Translate to English if the audio wasn't English
# #     if language != "en":
# #         print(f"Translating {current_lang} transcript to English for accurate logical processing...")
# #         english_transcript = translate_text(transcript, current_lang, "English")
# #     else:
# #         english_transcript = transcript
        
# #     # Step 2: Generate the core summary in English
# #     print("Generating structured summary fields...")
# #     summary_json = generate_english_summary(english_transcript)
    
# #     # Step 3: If original language was non-English, translate the content inside the dictionary back
# #     if language != "en":
# #         print(f"Translating summary sections back into {current_lang}...")
# #         summary_json["executive_summary"] = translate_text(summary_json["executive_summary"], "English", current_lang)
# #         summary_json["key_discussion_points"] = [translate_text(pt, "English", current_lang) for pt in summary_json["key_discussion_points"]]
# #         summary_json["action_items"] = [translate_text(item, "English", current_lang) for item in summary_json["action_items"]]
# #         summary_json["decisions_taken"] = [translate_text(dec, "English", current_lang) for dec in summary_json["decisions_taken"]]
# #         summary_json["pending_issues"] = [translate_text(iss, "English", current_lang) for iss in summary_json["pending_issues"]]
        
# #     return summary_json

import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"

def query_local_llm(system_prompt: str, user_content: str, json_mode: bool = False) -> str:
    """Interacts directly with the local running Ollama instance."""
    payload = {
        "model": "llama3.1",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "stream": False
    }
    if json_mode:
        payload["format"] = "json"
        
    response = requests.post(OLLAMA_URL, json=payload)
    response.raise_for_status()
    return response.json()["message"]["content"]

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translates individual blocks of text locally using Llama-3.1."""
    system_prompt = f"You are an expert translator. Translate the following text from {source_lang} to {target_lang}. Maintain formal professional business language. Respond ONLY with the raw translation text without commentary."
    return query_local_llm(system_prompt, text)

def generate_english_summary(english_transcript: str) -> dict:
    """Generates a structured meeting summary based on the English transcript text."""
    system_prompt = (
        "You are an expert meeting secretary. Summarize the provided meeting transcript. "
        "You MUST respond ONLY with a valid JSON object matching this exact schema: "
        '{"executive_summary": "string", "key_discussion_points": ["string"], "action_items": ["string"], "decisions_taken": ["string"], "pending_issues": ["string"]}'
    )
    
    raw_json = query_local_llm(system_prompt, english_transcript, json_mode=True)
    return json.loads(raw_json)

def translate_summary_json(summary_json: dict, target_lang: str) -> dict:
    """Translates the full summary JSON back into the target language in ONE request."""
    system_prompt = (
        f"You are an expert translator. Translate all textual values in the provided JSON object "
        f"from English to {target_lang}. Keep all JSON keys exactly the same. "
        f"Respond ONLY with a valid JSON object matching the input structure."
    )
    user_content = json.dumps(summary_json, ensure_ascii=False)
    translated_raw = query_local_llm(system_prompt, user_content, json_mode=True)
    return json.loads(translated_raw)

def process_meeting_pipeline(transcript: str, language: str) -> dict:
    language_map = {"en": "English", "hi": "Hindi", "as": "Assamese"}
    current_lang = language_map.get(language, "English")
    
    # Step 1: Translate non-English audio transcript to English
    if language != "en":
        print(f"Translating {current_lang} transcript to English...")
        english_transcript = translate_text(transcript, current_lang, "English")
    else:
        english_transcript = transcript
        
    # Step 2: Generate English structured summary
    print("Generating structured summary fields...")
    english_summary_json = generate_english_summary(english_transcript)
    
    # Step 3: If non-English, translate to native language AND retain English translation
    if language != "en":
        print(f"Translating summary back into {current_lang} in one single pass...")
        native_summary_json = translate_summary_json(english_summary_json, current_lang)
        
        # Merge native summary with english translation key
        final_output = native_summary_json
        final_output["summary_en"] = english_summary_json
        return final_output
        
    return english_summary_json