from concept_ai_engine.processors.audio import AudioProcessor
from concept_ai_engine.processors.text_cleaner import TextCleaner
from concept_ai_engine.agents.clinical_agent import ClinicalAgent

class VinaDoctorOrchestrator:
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.cleaner = TextCleaner()
        self.agent = ClinicalAgent()

    def process_consultation(self, audio_file):
        # Bước 1: Nghe và chuyển thành chữ (Scribe Prompt)
        raw_data = self.audio_processor.transcribe(audio_file)
        
        # Bước 2: Làm sạch dữ liệu nhạy cảm
        safe_transcript = self.cleaner.anonymize(raw_data['transcript'])
        
        # Bước 3: Phân tích y khoa chuyên sâu (Clinical Prompt)
        # Tại đây bạn có thể chọn dùng Qwen cho độ chính xác cao nhất
        final_report = self.agent.analyze(safe_transcript)
        
        return {
            "status": "success",
            "data": final_report
        }
