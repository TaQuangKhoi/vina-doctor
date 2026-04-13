ai_engine/
├── prompts/
│   ├── __init__.py            
│   ├── scribe_prompts.py   <-- Chứa Master Medical Scribe Prompt (Dán vào module Audio), Prompt này đóng vai trò là "Người phiên dịch y khoa", Qwen2.5-Audio-Turbo.
│   └── clinical_prompts.py <-- Chứa Master Clinical Agent Prompt (Dán vào module Agents), Prompt này là "Bác sĩ chuyên khoa", Qwen-2.5-72B/Max.
├── processors/
    ├──__init__.py              <-- (Quản lý các bộ xử lý thô (Audio và Text)
│   ├── audio.py            <-- Import scribe_prompts
│   └── text_cleaner.py
├── agents/
    ├──__init__.py
│   └── clinical_agent.py   <-- Import clinical_prompts
├── __init__.py                
└── orchestrator.py         <-- Điều phối toàn bộ

main.py
from ai_engine import VinaDoctorOrchestrator
