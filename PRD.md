# เอกสารข้อกำหนดความต้องการของระบบ (Product Requirements Document - PRD)
**ชื่อโปรเจกต์:** Helpdesk AI
**ประเภทโปรเจกต์:** โครงงานจบการศึกษา (Senior Project / Graduation Project)

---

## 1. ภาพรวมของระบบ (Product Overview)
**Helpdesk AI** เป็นระบบจัดการปัญหา (Ticketing System) สำหรับงานสนับสนุนลูกค้าที่มีความชาญฉลาด โดยนำเอา Generative AI (Gemini) และเทคโนโลยี Retrieval-Augmented Generation (RAG) ที่ทำงานร่วมกับ Vector Embeddings มาประยุกต์ใช้ ระบบนี้จะช่วยตอบคำถามของลูกค้าได้อย่างรวดเร็วและแม่นยำ พร้อมทั้งเป็นผู้ช่วยให้กับพนักงาน (Support Agents) ในการแก้ไขปัญหาที่ซับซ้อนได้อย่างมีประสิทธิภาพ

## 2. กลุ่มเป้าหมายและบทบาทผู้ใช้งาน (Target Audience & Roles)
ระบบมีการควบคุมการเข้าถึงแบบ Role-Based Access Control (RBAC) โดยแบ่งผู้ใช้งานเป็น 3 กลุ่มหลัก ได้แก่:
1. **ลูกค้า (Customer - `CUSTOMER`)**: ผู้ใช้งานที่ต้องการความช่วยเหลือ หรือแจ้งปัญหาเกี่ยวกับการใช้งานระบบ/บริการ
2. **พนักงานช่วยเหลือ (Support Agent - `AGENT`)**: พนักงานที่รับผิดชอบในการดูแล ตอบคำถาม และจัดการแก้ไขปัญหา (Tickets) ให้กับลูกค้า
3. **ผู้ดูแลระบบ (Administrator - `ADMIN`)**: ผู้ดูแลระบบที่มีหน้าที่จัดการฐานความรู้ (Knowledge Base) ดูแลเรื่องสิทธิ์ผู้ใช้งาน (User Roles) และควบคุมการทำงานรวมของระบบ

## 3. ฟีเจอร์หลัก (Core Features & Requirements)

### 3.1. การจัดการผู้ใช้งานและระบบยืนยันตัวตน (User Management & Authentication)
- ระบบลงทะเบียน (Registration) และเข้าสู่ระบบ (Login) ที่มีความปลอดภัย
- ระบบการเปลี่ยนหน้า (Dashboard Redirection) อัตโนมัติตาม Role ของผู้ใช้งานเมื่อเข้าสู่ระบบ

### 3.2. ระบบการจัดการปัญหาอัจฉริยะ (Intelligent Ticketing System)
- **การสร้าง Ticket (Ticket Creation)**: ลูกค้าสามารถเปิด Ticket เพื่อแจ้งปัญหา โดยระบุหัวข้อ (Title) คำอธิบาย (Description) และสามารถแนบรูปภาพเพิ่มเติมได้ (`imageUrls`)
- **การวิเคราะห์อารมณ์ด้วย AI (AI Sentiment Analysis)**: ระบบจะวิเคราะห์อารมณ์จากข้อความอธิบายปัญหาใน Ticket อัตโนมัติ (ให้คะแนนตั้งแต่ -1.0 ถึง 1.0) เพื่อช่วยให้ Agent สามารถประเมินความไม่พอใจของลูกค้าและจัดลำดับความสำคัญ (Prioritize) ได้อย่างเหมาะสม
- **การจัดการ Ticket (Ticket Management)**: Ticket จะมีการเก็บสถานะการทำงาน (Workflow Statuses) เช่น `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` และระดับความเร่งด่วน (Urgency Levels) เช่น `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **การมอบหมายงาน (Ticket Assignment)**: Agent สามารถรับมอบหมายให้ดูแลและจัดการแก้ไข Ticket ต่างๆ ได้

### 3.3. ผู้ช่วยอัจฉริยะด้วย AI (AI-Powered Assistant & RAG Integration)
- **การจัดการฐานความรู้ (Knowledge Base Management)**: Admin สามารถอัปโหลดไฟล์เอกสารเข้าระบบ โดยระบบจะทำการสกัดข้อความ (Extract Text) แบ่งข้อมูลออกเป็นส่วนย่อย (Chunks) และแปลงให้เป็น Vector Embeddings โดยอัตโนมัติ
- **การค้นหาเชิงความหมาย (Semantic Search)**: ใช้ส่วนขยาย `pgvector` บน PostgreSQL ในการค้นหาความคล้ายคลึง (Similarity Search) จาก Knowledge Base อย่างแม่นยำ
- **แชทบอทสำหรับลูกค้า (Customer AI Chatbot)**: Widget แชทบอทแบบลอยตัว (Floating Widget) ที่ให้ลูกค้าสอบถามข้อมูลได้ทันที โดย AI จะดึงข้อมูล (Context) จาก Knowledge Base มาตอบก่อน หากไม่พบข้อมูลที่ตรงกัน AI จะสามารถใช้ความรู้ทั่วไป (General Knowledge) เพื่อตอบคำถามพื้นฐานแทนได้ (Fallback Mode)
- **ระบบช่วยร่างข้อความตอบกลับ (Agent Suggested Replies)**: AI จะช่วย Agent ในการอ่านประวัติการสนทนา (Ticket History) ตรวจสอบหมวดหมู่ (Category) และอารมณ์ (Sentiment) แล้วทำการช่วยร่างข้อความตอบกลับที่ดูเป็นมืออาชีพให้ด้วยการกดเพียงคลิกเดียวผ่านระบบ `TriageService`

### 3.4. ระบบการสื่อสาร (Communication & Messaging)
- การสื่อสารแบบต่อเนื่อง (Thread-based Messaging) ภายในแต่ละ Ticket โดยจะมีการแยกระบุชัดเจนว่าข้อความนั้นถูกส่งมาจากมนุษย์หรือถูกตอบด้วย AI (`isAI`)

---

## 4. โครงสร้างทางเทคนิค (Technical Architecture)

### 4.1. ระบบฝั่งส่วนหน้า (Frontend)
- **Framework**: Next.js (App Router, TypeScript)
- **Styling & UI**: Tailwind CSS ร่วมกับการใช้ CSS Variables เพื่อควบคุม Theme อย่างสม่ำเสมอ
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand (เช่น ไฟล์ `auth.store.ts`)

### 4.2. ระบบฝั่งเซิร์ฟเวอร์ (Backend)
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **Vector Database**: PostgreSQL พร้อมใช้งาน Extension `pgvector` สำหรับจัดเก็บและคิวรี (Querying) ข้อมูล Vector Embeddings ขนาด 768 มิติ
- **ORM**: Prisma
- **AI Integration**: Google Gemini API (ใช้งานในกระบวนการ Text Streaming, Sentiment Analysis และกระบวนการสร้าง Embeddings)

### 4.3. โครงสร้างพื้นฐาน (Infrastructure & Deployment)
- การเตรียมสภาพแวดล้อมผ่าน Docker (`docker-compose.yml`) เพื่ออำนวยความสะดวกในการเปิดระบบ Database และเชื่อมต่อ `pgvector` อย่างรวดเร็ว

---

## 5. โครงสร้างฐานข้อมูล (Database Schema Architecture - Prisma)
- **`User`**: จัดเก็บข้อมูลรหัสผ่าน สิทธิ์ (Role) และโปรไฟล์ของผู้ใช้งาน
- **`Ticket`**: เอนทิตี (Entity) หลักที่เก็บรายละเอียดปัญหา, ผู้รับผิดชอบ (Assignee), สถานะ (Status), ความสำคัญ (Priority) และอารมณ์ความรู้สึก (Sentiment)
- **`Message`**: บันทึกประวัติการสนทนา (Chat History) ภายในแต่ละ Ticket
- **`KnowledgeDocument`**: บันทึกประวัติการอัปโหลดไฟล์เอกสารและสถานะการประมวลผล (Processing Status: `PROCESSING`, `SUCCESS`, `FAILED`)
- **`KnowledgeChunk`**: จัดเก็บข้อความที่ถูกตัดแบ่งชิ้น (Fragmented Text) และพิกัด Vector Embeddings แบบ `Unsupported("vector(768)")` เพื่อรองรับกระบวนการ RAG Pipeline
