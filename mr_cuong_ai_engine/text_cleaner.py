import re

class TextCleaner:
    def __init__(self):
        # Regex cơ bản cho số điện thoại và các thực thể nhạy cảm
        self.phone_pattern = re.compile(r'(\d{3,4}[.\s]?\d{3}[.\s]?\d{3})')
        
    def anonymize(self, raw_transcript):
        """Ẩn danh hóa dữ liệu trước khi gửi lên LLM ngoại vi."""
        cleaned_text = raw_transcript
        # Ví dụ ẩn danh số điện thoại
        cleaned_text = self.phone_pattern.sub("[PHONE_NUMBER]", cleaned_text)
        
        # Tip: Ở mức độ Hackathon, chúng ta có thể dùng một dictionary để map 
        # các từ viết tắt y khoa phổ biến tại VN.
        return cleaned_text