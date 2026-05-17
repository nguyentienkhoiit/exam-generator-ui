# 🎓 Thesis Defense Slides - RAG System

---

## 1. Title

* FPT University
* AUTOMATIC MCQ GENERATION USING RAG & LLM
* Nguyen Tien Khoi
* Supervisor: Assoc. Prof. Phan Duy Hung / Dr. Vu Thu Diep

---

## 2. Problem

* Tạo câu hỏi tốn thời gian

* Khó đảm bảo chất lượng & độ nhất quán

* Tài liệu PDF:

  * Khó khai thác
  * Không chuyển trực tiếp thành câu hỏi

* LLM-only:

  * Hallucination
  * Không bám tài liệu

👉 Cần hệ thống tạo câu hỏi chính xác, linh hoạt

---

## 3. Objective

* Xây dựng hệ thống tạo MCQ từ PDF

* Áp dụng RAG:

  * Giảm hallucination
  * Tăng accuracy

* Hỗ trợ giáo viên chỉnh sửa

👉 Giảm workload, tăng chất lượng

---

## 4. Contribution

* Pipeline end-to-end: PDF → MCQ

* Hybrid Retrieval:

  * Vector + BM25

* Ranking:

  * Fusion + MMR

* Prompt + JSON output

* Teacher-in-the-loop

👉 Tăng relevance & usability

---

## 5. Technologies

* Backend: Spring Boot

* Frontend: AngularJS

* Retrieval:

  * pgvector
  * Elasticsearch

* LLM:

  * Deepseek (Ollama)

* Pipeline:

  * PDF → Chunking → Embedding

---

## 6. System Architecture

* 5 layers:

  1. Client
  2. API
  3. Ingestion
  4. Retrieval
  5. Generation

👉 Flow: PDF → Retrieval → LLM → Output

---

## 7. Data Ingestion

* PDF → Text extraction

* Cleaning (normalize text)

* Chunking:

  * ~600 tokens + overlap

* Embedding → Vector

* Index:

  * pgvector + BM25

👉 Chuẩn bị dữ liệu cho retrieval

---

## 8. Hybrid Retrieval

* Dense: semantic

* BM25: keyword

* Hybrid:

  * Kết hợp 2 nguồn
  * Tăng recall

* α-Fusion

👉 Retrieval ổn định hơn

---

## 9. Ranking Strategy

* Normalize scores

* Fusion:

  * Vector + BM25

* MMR:

  * Giảm trùng lặp
  * Tăng diversity

* Rerank (optional)

👉 Context tốt hơn cho LLM

---

## 10. Prompt & LLM

* Input:

  * Top-k chunks
  * Task yêu cầu

* Prompt:

  * Instruction + Context + Task

* LLM:

  * Deepseek

* Output:

  * JSON schema

👉 Context quyết định chất lượng output

---

## 12. Experimental Setup
- Dataset: t01, t02, t03
- Metrics:
  - Recall@k
  - Precision@k
  - MRR
- 3 experiments:
  - Chunking
  - Retrieval
  - Answer Quality

---

## 13. Experiment 1: Chunking
- Evaluate chunk size and quality
- Metrics:
  - numChunks
  - avgWords
  - redundancyRate

---

## 14. Exp 1 - Conclusion
- Chunk size ổn định (~295 words)
- Không có chunk quá ngắn/dài
- Không có redundancy
→ Phù hợp cho retrieval

---

## 15. Experiment 2: Retrieval
- Methods:
  - Dense Only
  - BM25 Only
  - Hybrid
  - Hybrid + MMR
- Metrics:
  - Recall@12
  - Precision@12
  - MRR

---

## 16. Exp 2 - Conclusion
- Hybrid ổn định hơn từng phương pháp riêng
- Dense và BM25 có thế mạnh khác nhau
- MMR chưa luôn cải thiện hiệu năng

---

## 17. Experiment 3: Answer Quality
- Evaluate output using:
  - Correctness
  - Clarity
  - Difficulty Match
  - Explanation Quality

---

## 18. Exp 3 - Conclusion
- Câu trả lời có độ chính xác cao
- Độ rõ ràng tốt
- Explanation còn có thể cải thiện

---

## 19. Overall Conclusion
- Hybrid retrieval hiệu quả
- Pipeline hoạt động ổn định
- Kết hợp nhiều kỹ thuật giúp cải thiện chất lượng

---

## 20. Limitations & Future Work
- Dataset nhỏ
- Chưa tối ưu sâu hyperparameters
- Future:
  - Better reranker
  - Larger dataset
  - Fine-tuning model