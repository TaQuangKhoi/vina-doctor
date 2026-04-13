from concept_ai_engine.prompts.scribe_prompts import MEDICAL_MASTER_PROMPT
import dashscope

def run_scribe(audio_path):
    # Gọi API Qwen2.5-Audio trên DashScope
    # Truyền MEDICAL_MASTER_PROMPT vào tham số 'content' của role 'system'
    messages = [
        {"role": "system", "content": MEDICAL_MASTER_PROMPT},
        {"role": "user", "content": [{"audio": audio_path}, {"text": "Transcribe this medical session."}]}
    ]
    # ... logic gọi API ...
