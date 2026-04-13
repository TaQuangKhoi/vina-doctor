Module: agents.py (The Clinical Brain)
1. Trách nhiệm (Responsibility)
Module agents.py chịu trách nhiệm về logic nghiệp vụ y tế. Sau khi dữ liệu âm thanh đã được làm sạch và ẩn danh, các Agent tại đây sẽ thực hiện các tác vụ tư duy cấp cao:

Clinical Extraction Agent: Trích xuất các thực thể y tế (triệu chứng, loại thuốc, liều lượng).

Reasoning Agent: Phân tích mối liên hệ giữa các triệu chứng để gợi ý chẩn đoán sơ bộ.

Reporting Agent: Đóng gói toàn bộ thông tin vào định dạng SOAP chuẩn quốc tế và thực hiện dịch thuật đa ngôn ngữ (EN/FR/AR/VN).

2. Cách dùng (Usage)
Module này được ai_engine.py gọi sau khi đã có bản transcript "sạch".

from ai_engine.agents import ClinicalAgent

agent = ClinicalAgent(provider="qwen-2.5-72b") 
clinical_data = agent.analyze_transcript(cleaned_text)

3. Các hàm chính (Main Functions)
extract_entities(text): Sử dụng Prompting kỹ thuật cao để bóc tách: Chief Complaint, History of Present Illness, Medications.

map_icd10_codes(diagnosis): Đối chiếu chẩn đoán với bảng mã ICD-10 quốc tế để đảm bảo tính chuẩn hóa dữ liệu.

generate_soap_note(extracted_data): Sắp xếp dữ liệu theo đúng cấu trúc Subjective, Objective, Assessment, Plan.

translate_report(soap_note, target_languages): Chuyển đổi báo cáo sang đa ngôn ngữ nhưng vẫn giữ nguyên độ chính xác của các thuật ngữ chuyên ngành.

4. Lưu ý bảo mật (Security Notes)
Prompt Injection Defense: Thiết kế System Prompt chặt chẽ để ngăn chặn việc AI đưa ra các lời khuyên y tế sai lệch hoặc bị can thiệp bởi các câu lệnh lạ trong transcript của bệnh nhân.

Hallucination Check: Áp dụng kỹ thuật Chain-of-Thought (Chuỗi suy nghĩ) để AI giải trình logic trước khi đưa ra kết luận, giảm thiểu tình trạng "vẽ" thêm bệnh.

Data Minimization: Agent chỉ làm việc với dữ liệu đã được text_cleaner.py xử lý, đảm bảo không bao giờ tiếp xúc trực tiếp với danh tính thật của người dùng.

5. Kết nối với các module khác
Đầu vào: Nhận văn bản đã làm sạch từ text_cleaner.md.

Đầu ra: Trả về đối tượng JSON hoàn chỉnh (Clinical JSON) cho ai_engine.md để chuyển về Frontend hoặc lưu vào Database.

Kiến trúc: Có thể kết nối với một Vector Database (RAG) nếu cần đối chiếu với các phác đồ điều trị chuyên sâu của Bộ Y tế.
