export type UserRole = 'super-admin' | 'director' | 'principal' | 'teacher';

export type StudentStatus = 'active' | 'suspended' | 'transferred' | 'graduated' | 'archived';

export interface StudentTransferRecord {
  date: string;
  from_school_id: string;
  to_school_id: string;
  reason?: string;
  authorized_by?: string;
}

export interface StudentPromotionRecord {
  date: string;
  from_class_id: string;
  to_class_id: string;
  session_id?: string;
  note?: string;
  authorized_by?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  school_id: string | null; // null for super-admin / director (statewide scope)
  assigned_class_id?: string; // e.g. 'cls-p6' for classroom teachers
  assigned_subject_id?: string; // for subject teachers
  student_id?: string;
  admission_number?: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface School {
  id: string;
  code: string;
  name: string;
  lga: string; // Local Government Area in Edo State
  address: string;
  head_teacher: string;
  /** Linked principal user account, when a principal is assigned. */
  principal_user_id?: string | null;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g. "2025/2026 Academic Session"
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export type Session = AcademicSession;

export interface Term {
  id: string;
  session_id: string;
  name: '1st Term' | '2nd Term' | '3rd Term';
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface ClassLevel {
  id: string;
  name: string; // "Primary 6", "Primary 5", "JSS 1", "SSS 1", etc.
  category: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  arm_count?: number;
  capacity?: number;
  class_teacher?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Core' | 'Vocational' | 'Language' | 'Science';
}

export interface Student {
  id: string;
  admission_number: string; // e.g., "EDS/EM/2026/014"
  full_name: string;
  gender: 'M' | 'F';
  class_id: string;
  school_id: string;
  guardian_name: string;
  guardian_phone: string;
  attendance_days: number;
  total_days: number;
  conduct_rating: string; // "Exceptional", "Very Good", "Good", "Satisfactory"
  status?: StudentStatus; // 'active' | 'suspended' | 'transferred' | 'graduated'
  suspension_reason?: string;
  transfer_history?: StudentTransferRecord[];
  promotion_history?: StudentPromotionRecord[];
}

export type QuestionType = 'objective' | 'structured' | 'theory';

export interface QuestionOption {
  key: string; // "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: string;
  examination_id: string;
  question_number: number;
  question_type: QuestionType;
  text: string;
  options?: QuestionOption[];
  correct_answer?: string; // For objective questions (e.g. "B")
  expected_answer?: string; // For theory / structured questions
  maximum_marks: number;
  answer_lines?: number; // Number of ruled answer lines provided for theory/structured questions (e.g. 4, 6, 8, 12 lines)
  verified: boolean;
}

export interface Examination {
  id: string;
  code: string;
  title: string;
  school_id: string | null; // null for centralized MINISTRY OF EDUCATION examinations
  subject_id: string;
  class_id: string;
  session_id: string;
  term_id: string;
  date: string;
  duration_minutes: number;
  maximum_marks: number;
  passing_percentage: number;
  question_paper_mode?: 'fixed' | 'variable'; // 'fixed' = same questions for all students; 'variable' = personalized varied subset of questions per student
  variable_question_count?: number; // Number of questions selected from question pool when question_paper_mode is 'variable'
  status: 'draft' | 'questions_verified' | 'scheme_locked' | 'submitted_for_approval' | 'changes_requested' | 'approved' | 'ready' | 'marked' | 'finalized' | 'rejected';
  created_by?: string; // user id
  created_by_name?: string;
  submitted_at?: string;
  submission_notes?: string;
  reviewed_by?: string; // principal/admin user id
  reviewed_by_name?: string;
  reviewed_at?: string;
  principal_feedback?: string;
  approval_status?: 'pending' | 'changes_requested' | 'approved' | 'rejected';
}

export interface MarkingCriterion {
  id: string;
  marking_scheme_id: string;
  question_id: string;
  label: string;
  guidance: string;
  marks: number;
  order_no: number;
}

export interface MarkingScheme {
  id: string;
  examination_id: string;
  version: number;
  status: 'draft' | 'approved' | 'locked';
  hash: string;
  is_hidden: boolean;
  is_deleted: boolean;
  hidden_at?: string;
  hidden_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  locked_at?: string;
  created_by: string;
  criteria: MarkingCriterion[];
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  question_id: string;
  label: string;
  guidance: string;
  marks: number;
  order_no: number;
}

export interface Rubric {
  id: string;
  examination_id: string;
  marking_scheme_id: string;
  version: number;
  status: 'generated' | 'approved' | 'locked';
  source_hash: string;
  source_scheme_hash: string;
  locked_by?: string;
  locked_at?: string;
  criteria: RubricCriterion[];
}

export interface StudentExamPaper {
  id: string;
  paper_code: string; // e.g. "EP-MTH-P6-001"
  examination_id: string;
  student_id: string;
  qr_code_payload: string;
  status: 'enrolled' | 'generated' | 'distributed' | 'collected' | 'scanned';
  assigned_question_ids?: string[]; // Unique varied order of questions for this candidate
  delivery_mode?: 'offline' | 'online_cbt';
  cbt_status?: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  cbt_started_at?: string;
  cbt_submitted_at?: string;
  cbt_answers?: Record<string, string>; // question_id -> candidate answer string
  cbt_score?: number;
  cbt_auto_marked?: boolean;
}

export interface MarkRevision {
  id: string;
  script_answer_id: string;
  old_score: number;
  new_score: number;
  actor: string;
  reason: string;
  timestamp: string;
}

export interface ScriptAnswer {
  id: string;
  script_id: string;
  question_id: string;
  student_raw_response: string;
  detected_mcq_choice?: string;
  proposed_score?: number;
  confidence?: number;
  evidence?: string;
  missing_concepts?: string[];
  reasoning?: string;
  final_score?: number;
  status: 'pending' | 'proposed' | 'finalized';
  revisions?: MarkRevision[];
}

export interface AnswerScript {
  id: string;
  paper_id: string;
  examination_id: string;
  student_id: string;
  intake_type: 'omr_scan' | 'manual_entry' | 'ocr_upload' | 'digital';
  status: 'received' | 'evaluating' | 'marked';
  review_status: 'pending_review' | 'examiner_approved';
  score: number;
  maximum_marks: number;
  answers: ScriptAnswer[];
  scanned_file_name?: string;
  scanned_file_data?: string;
  scanned_file_type?: string;
  scanned_file_size_bytes?: number;
  finalized_at?: string;
  finalized_by?: string;
  revisions?: MarkRevision[];
  created_at: string;
}

export interface Result {
  id: string;
  examination_id: string;
  student_id: string;
  raw_marks: number;
  maximum_marks: number;
  percentage: number;
  grade: string;
  position: number;
  status: 'draft' | 'reviewed' | 'finalized';
  finalized_at?: string;
  finalized_by?: string;
  correction_reason?: string;
}

export interface GradeScale {
  id: string;
  name: string; // e.g. "Primary Scale", "Junior Secondary Scale"
  min_percent: number;
  max_percent: number;
  grade: string; // "A", "B", "C", "D", "E", "F"
  remark: string; // "Excellent", "Very Good", "Good", etc.
  gpa_point: number;
}

export interface ReportCardSubjectEntry {
  subject_name: string;
  subject_code: string;
  raw_marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
  remark: string;
  position: number;
}

export interface ReportCard {
  id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  school_id: string;
  class_id: string;
  total_marks: number;
  max_possible: number;
  average_percent: number;
  position: number;
  total_students: number;
  attendance_present: number;
  attendance_total: number;
  conduct_grade: string;
  teacher_comment: string;
  principal_comment: string;
  promotion_status: 'Promoted' | 'Promoted on Trial' | 'Not Promoted' | 'Under Review';
  verification_code: string; // e.g. "EDS-RC-2026-9B8E-0042"
  issued_at: string;
  subjects: ReportCardSubjectEntry[];
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'APPROVE'
  | 'LOCK'
  | 'HIDE'
  | 'UNHIDE'
  | 'DELETE'
  | 'FINALIZE'
  | 'PROMOTE'
  | 'TRANSFER'
  | 'ARCHIVE'
  | 'GENERATE'
  | 'IMPORT'
  | 'LOGIN'
  | 'GENERATE'
  | 'OVERRIDE'
  | 'IMPORT'
  | 'ROLE_CHANGE'
  | 'PROMOTE'
  | 'TRANSFER'
  | 'SUSPEND'
  | 'ARCHIVE'
  | 'LOGIN';

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actor_role?: UserRole;
  lga?: string; // 18 LGAs of Edo State
  school_id?: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  description?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
}

export interface SystemContentConfig {
  board_name: string;
  system_title: string;
  portal_motto: string;
  state_name: string;
  subeb_logo_url?: string;
  ministry_logo_url?: string;
  portal_announcement: string;
  portal_announcement_active: boolean;
  support_email: string;
  support_phone: string;
  portal_address: string;
  footer_note: string;
  
  // Full Report Card Customization & Editorial Controls
  report_card_header_title: string;
  report_card_sub_header: string;
  report_card_motto: string;
  report_card_watermark_text: string;
  report_card_chairman_title: string;
  report_card_principal_signature_title: string;
  report_card_teacher_signature_title: string;
  report_card_disclaimer: string;
  report_card_next_term_begins: string;
  report_card_next_term_fees_notice: string;
  report_card_show_qr_code: boolean;
  report_card_show_positions: boolean;
  report_card_show_conduct: boolean;
  report_card_show_affective_domain: boolean;
  report_card_promotion_promoted_remark: string;
  report_card_promotion_trial_remark: string;
  report_card_promotion_repeat_remark: string;

  // Evaluation & Assessment weighting
  ca_weight_percentage: number;
  exam_weight_percentage: number;
  pass_mark_percentage: number;
  ai_discrepancy_threshold: number;

  // Signature & Stamp Images
  chairman_signature_url?: string;   // Base64 or URL of Chairman's signature/stamp
  principal_signature_url?: string;  // Base64 or URL of Principal's signature/stamp
  report_card_chairman_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'alert' | 'update' | 'policy' | 'schedule';
  target_audience: 'all' | 'examiners' | 'admins';
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface HandbookArticle {
  id: string;
  title: string;
  category: 'Examiner Manual' | 'Security & QR' | 'Grading Policy' | 'AI Theory Marking' | 'General FAQ';
  content: string;
  last_updated: string;
  author: string;
  is_published: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
  remark?: string;
}

export interface DailyRollCall {
  id: string;
  date: string; // YYYY-MM-DD
  school_id: string;
  class_id: string;
  taken_by_user_id: string;
  taken_by_name: string;
  session_id: string;
  term_id: string;
  records: StudentAttendanceRecord[];
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate_percent: number;
  created_at: string;
  updated_at: string;
  status: 'submitted' | 'draft';
}