Module: ai_engine.py (The Orchestrator)
1. Trách nhiệm (Responsibility)
ai_engine.py là trung tâm điều khiển của hệ thống Vina-Doctor-AI. Nhiệm vụ chính của nó là quản lý toàn bộ vòng đời của một phiên xử lý dữ liệu y khoa, từ lúc nhận file âm thanh cho đến khi xuất bản báo cáo đa ngôn ngữ định dạng JSON. Nó đảm bảo các module thành phần hoạt động đúng thứ tự và xử lý các tình huống ngoại lệ (error handling).

2. Cách dùng (Usage)
Đây là entry-point chính mà Backend API sẽ gọi để thực hiện nghiệp vụ Scribe.
python
from ai_engine.orchestrator import AIEngine

# Khởi tạo engine với các cấu hình mặc định
engine = AIEngine()

# Thực hiện quy trình scribe toàn phần
final_output = engine.run_full_pipeline("path/to/consultation.wav")

3. Các hàm chính (Main Functions)
run_full_pipeline(audio_source): Hàm điều phối chính thực hiện chuỗi hành động:

Gọi audio.py để lấy transcript.

Gửi transcript qua text_cleaner.py để ẩn danh hóa.

Đẩy dữ liệu sạch vào clinical_agent để phân tích SOAP.

Trả về kết quả JSON cuối cùng.

select_best_model(task_type): Logic thông minh để chọn model phù hợp. Ví dụ: dùng Qwen cho tác vụ âm thanh nhanh và Gemini cho tác vụ suy luận hồ sơ bệnh án dài (Long-context).

handle_multilingual_request(data, target_langs): Điều phối việc dịch thuật báo cáo sang các ngôn ngữ yêu cầu (EN/FR/AR/VN) mà không làm mất đi tính chính xác của thuật ngữ y tế.

state_management(): Theo dõi trạng thái của pipeline (đang xử lý, hoàn thành, hoặc lỗi) để cập nhật cho Frontend qua WebSocket.

4. Lưu ý bảo mật (Security Notes)
Secret Management: Tất cả API Keys (DashScope, Google Cloud) được quản lý tập trung thông qua biến môi trường hoặc Vault, không hard-code trong module.

Fail-safe mechanism: Nếu một module AI bị lỗi (ví dụ: timeout API), Engine có nhiệm vụ chuyển hướng sang model dự phòng hoặc trả về thông báo lỗi an toàn (không lộ dữ liệu hệ thống).

Concurrency: Quản lý luồng xử lý đồng thời để đảm bảo khi nhiều bác sĩ cùng sử dụng, hệ thống không bị nghẽn hoặc lẫn lộn dữ liệu giữa các phiên khám.

5. Kết nối với các module khác
Thượng tầng: Nhận yêu cầu từ backend/api/v1/.

Hạ tầng: Điều phối trực tiếp audio.py (The Ears) và text_cleaner.py (The Guard).

Tác nhân: Giao tiếp với agents/extractor.py và agents/reporter.py để thực hiện suy luận lâm sàng.
