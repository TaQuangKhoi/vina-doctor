# ai_engine/agents/clinical_agent.py
from concept_ai_engine.prompts.clinical_prompts import CLINICAL_MASTER_PROMPT

class ClinicalAgent:
    def process(self, clean_text):
        # Gọi API (Gemini/Qwen) và truyền CLINICAL_MASTER_PROMPT vào phần 'system'
        pass