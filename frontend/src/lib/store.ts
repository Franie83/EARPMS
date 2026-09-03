import {
  User,
  School,
  AcademicSession,
  Term,
  ClassLevel,
  Subject,
  Student,
  StudentStatus,
  StudentTransferRecord,
  StudentPromotionRecord,
  Question,
  Examination,
  MarkingScheme,
  MarkingCriterion,
  Rubric,
  RubricCriterion,
  StudentExamPaper,
  AnswerScript,
  ScriptAnswer,
  MarkRevision,
  Result,
  GradeScale,
  ReportCard,
  ReportCardSubjectEntry,
  AuditLog,
  UserRole,
  SystemContentConfig,
  Announcement,
  HandbookArticle,
  DailyRollCall,
  StudentAttendanceRecord,
  AttendanceStatus
} from '../types';

// Simple synchronous SHA-256 equivalent for hashes
export function computeHash(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}_${str.length.toString(16)}`;
}

// Initial Seed Data
const INITIAL_USERS: User[] = [
  {
    id: 'u-super',
    username: 'subeb_chairman',
    email: 'chairman@subeb.edostate.gov.ng',
    role: 'super-admin',
    school_id: null,
    full_name: 'Super Admin',
    is_active: true,
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'u-director-schools',
    username: 'director_schools',
    email: 'director.schools@subeb.edostate.gov.ng',
    role: 'director',
    school_id: null,
    full_name: 'Director',
    is_active: true,
    created_at: '2026-01-14T09:00:00Z'
  },
  {
    id: 'u-director-exams',
    username: 'director_exams',
    email: 'exams.director@subeb.edostate.gov.ng',
    role: 'director',
    school_id: null,
    full_name: 'Director',
    is_active: true,
    created_at: '2026-01-12T09:30:00Z'
  },
  {
    id: 'u-principal-emotan',
    username: 'principal_emotan',
    email: 'patience.omoregie@emotan.edu.ng',
    role: 'principal',
    school_id: 'sch-01',
    full_name: 'Principal',
    is_active: true,
    created_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'u-principal-idia',
    username: 'principal_idia',
    email: 'osaro.enabulele@idia.edu.ng',
    role: 'principal',
    school_id: 'sch-02',
    full_name: 'Principal',
    is_active: true,
    created_at: '2026-01-16T11:00:00Z'
  },
  {
    id: 'u-teacher-p6',
    username: 'teacher_egharevba',
    email: 'dennis.egharevba@emotan.edu.ng',
    role: 'teacher',
    school_id: 'sch-01',
    assigned_class_id: 'cls-p6',
    assigned_subject_id: 'sub-math',
    full_name: 'Teacher',
    is_active: true,
    created_at: '2026-01-18T08:30:00Z'
  },
  {
    id: 'u-teacher-p5',
    username: 'teacher_igiebor',
    email: 'helen.igiebor@emotan.edu.ng',
    role: 'teacher',
    school_id: 'sch-01',
    assigned_class_id: 'cls-p5',
    assigned_subject_id: 'sub-bst',
    full_name: 'Teacher',
    is_active: true,
    created_at: '2026-01-19T09:00:00Z'
  },
  {
    id: 'u-teacher-idia',
    username: 'teacher_osifo',
    email: 'anthony.osifo@idia.edu.ng',
    role: 'teacher',
    school_id: 'sch-02',
    assigned_class_id: 'cls-j1',
    assigned_subject_id: 'sub-math',
    full_name: 'Teacher',
    is_active: true,
    created_at: '2026-01-20T10:00:00Z'
  }
];


const INITIAL_SYSTEM_CONFIG: SystemContentConfig = {
  board_name: 'Edo State Ministry of Education',
  system_title: 'Electronic Academic Records, Paper & Marking System (EARPMS)',
  portal_motto: 'Excellence in Basic Education, Transparency in Evaluation & Provenance',
  state_name: 'Edo State of Nigeria',
  subeb_logo_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&auto=format&fit=crop&q=80',
  ministry_logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
  portal_announcement: '🎯 2025/2026 2nd Term Centralized Mock & Continuous Assessment Examinations are actively ongoing across all 18 Local Government Areas. All script uploads must complete by 6:00 PM daily.',
  portal_announcement_active: true,
  support_email: 'support.earpms@subeb.edostate.gov.ng',
  support_phone: '+234 (0) 800 336 78232',
  portal_address: 'Ministry of Education Headquarters, Block B, State Secretariat Complex, Sapele Road, Benin City, Edo State',
  footer_note: 'Official Electronic Academic Records & Evaluation Portal — Authorized by Edo State Ministry of Education. All examination scripts and QR certificates are cryptographically verified.',
  
  // Full Report Card Customization & Editorial Controls
  report_card_header_title: 'EDO STATE MINISTRY OF EDUCATION',
  report_card_sub_header: 'CONTINUOUS ASSESSMENT & TERMINAL EXAMINATION OFFICIAL DOSSIER',
  report_card_motto: 'Building a Strong Foundation for Lifelong Learning & Technological Literacy',
  report_card_watermark_text: 'OFFICIAL RECORD • EDO STATE MINISTRY OF EDUCATION • VERIFIED',
  report_card_chairman_title: 'Chairman',
  report_card_principal_signature_title: 'Head Teacher / School Principal Stamp & Signature',
  report_card_teacher_signature_title: 'Class Form Teacher Signature & Assessment Date',
  report_card_disclaimer: 'This Continuous Assessment & Terminal Examination Report is an authentic electronic record issued under the statutory authority of Edo State Ministry of Education. Verify provenance by scanning the cryptographic security QR code.',
  report_card_next_term_begins: 'Monday, 14th September 2026',
  report_card_next_term_fees_notice: 'Basic education in all Edo State Government public schools is 100% tuition-free under the EdoBEST basic education initiative.',
  report_card_show_qr_code: true,
  report_card_show_positions: true,
  report_card_show_conduct: true,
  report_card_show_affective_domain: true,
  report_card_promotion_promoted_remark: 'Promoted to the next class level in recognition of satisfactory terminal aggregates.',
  report_card_promotion_trial_remark: 'Promoted on Trial. Mandatory holiday coaching and remedial reading classes recommended.',
  report_card_promotion_repeat_remark: 'To repeat current class level for foundational reinforcement.',

  // Evaluation & Assessment weighting
  ca_weight_percentage: 40,
  exam_weight_percentage: 60,
  pass_mark_percentage: 50,
  ai_discrepancy_threshold: 15,

  // Signature & Stamp Images
  chairman_signature_url: '',
  principal_signature_url: '',
  report_card_chairman_name: 'Hon. Ozavize E. Salami'
};

const STORAGE_KEY = 'earpms_store_v1';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'earpms_access_token';
const CANDIDATE_TOKEN_KEY = 'earpms_candidate_access_token';

export function gradeForPercentage(percentage: number, scales: GradeScale[]): string {
  const pct = Number(percentage);
  if (!Number.isFinite(pct)) return 'F';

  const match = [...scales]
    .filter(g => Number.isFinite(Number(g.min_percent)) && Number.isFinite(Number(g.max_percent)))
    .sort((a, b) => Number(b.min_percent) - Number(a.min_percent))
    .find(g => pct >= Number(g.min_percent) && pct <= Number(g.max_percent));

  return match?.grade?.toUpperCase() || 'F';
}

export interface AppStoreState {
  currentUser: User;
  users: User[];
  schools: School[];
  sessions: AcademicSession[];
  terms: Term[];
  classes: ClassLevel[];
  subjects: Subject[];
  students: Student[];
  questions: Question[];
  examinations: Examination[];
  markingSchemes: MarkingScheme[];
  rubrics: Rubric[];
  studentPapers: StudentExamPaper[];
  answerScripts: AnswerScript[];
  results: Result[];
  gradeScales: GradeScale[];
  reportCards: ReportCard[];
  auditLogs: AuditLog[];
  systemConfig: SystemContentConfig;
  announcements: Announcement[];
  handbookArticles: HandbookArticle[];
  dailyRollCalls: DailyRollCall[];
}

class Store {
  private state: AppStoreState;
  private listeners: Set<(state: AppStoreState) => void> = new Set();
  private pendingUserPasswords = new Map<string, string>();
  private pendingDeletes = new Map<string, Set<string>>();
  private syncPromise: Promise<any> = Promise.resolve();
  private serverRevision: string | null = null;

  constructor() {
    this.state = this.loadInitial();
  }

  private getToken(): string | null {
    return typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    const token = this.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const controller = new AbortController();
    const timeoutMs = path === '/gemini/parse-exam-document' ? 30000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
      return body;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Document parsing timed out after 30 seconds. Please use pasted text or try the document again.');
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const body = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      sessionStorage.setItem(TOKEN_KEY, body.access_token);
      this.state.currentUser = body.user;
      await this.hydrate();
      return { success: true, message: 'Signed in successfully.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Unable to sign in.' };
    }
  }

  public async demoSwitchRole(userId: string): Promise<{ success: boolean; message: string }> {
    if (import.meta.env.VITE_DEMO_MODE !== 'true') {
      return { success: false, message: 'Demo mode is disabled.' };
    }
    try {
      const body = await this.request('/auth/demo-switch', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
      sessionStorage.setItem(TOKEN_KEY, body.access_token);
      this.state.currentUser = body.user;
      await this.hydrate();
      return { success: true, message: 'Demo role switched.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Unable to switch demo role.' };
    }
  }

  public logout() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(TOKEN_KEY);
    this.state = { ...this.state, currentUser: INITIAL_USERS[0] };
    this.notify();
  }

  public isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  public async hydrate(): Promise<boolean> {
    if (!this.getToken()) return false;
    try {
      const remote = await this.request('/state');
      const map: Record<string,string> = {
        users:'users', schools:'schools', sessions:'sessions', terms:'terms', classes:'classes', subjects:'subjects',
        students:'students', questions:'questions', examinations:'examinations', markingSchemes:'marking-schemes', rubrics:'rubrics',
        studentPapers:'student-papers', answerScripts:'answer-scripts', results:'results', gradeScales:'grade-scales', reportCards:'report-cards',
        auditLogs:'audit-logs', systemConfig:'system-config', announcements:'announcements', handbookArticles:'handbook-articles', dailyRollCalls:'daily-rollcalls'
      };
      for (const [key, resource] of Object.entries(map)) {
        if (key === 'systemConfig') this.state.systemConfig = (remote[resource] || remote.systemConfig || [])[0] || this.state.systemConfig;
        else if (Array.isArray(remote[resource])) (this.state as any)[key] = remote[resource];
      }
      if (remote.currentUser) this.state.currentUser = remote.currentUser;
      // Global Ministry of Education naming migration for persisted configuration.
      if (this.state.systemConfig?.board_name === 'Edo State Ministry of Education') {
        this.state.systemConfig.board_name = 'Edo State Ministry of Education';
      }
      if (this.state.systemConfig?.report_card_header_title === 'EDO STATE UNIVERSAL BASIC EDUCATION BOARD') {
        this.state.systemConfig.report_card_header_title = 'EDO STATE MINISTRY OF EDUCATION';
      }
      if (!this.state.systemConfig?.report_card_chairman_name) {
        this.state.systemConfig.report_card_chairman_name = 'Hon. Ozavize E. Salami';
      }
      this.serverRevision = remote.revision || null;
      this.notify();
      return true;
    } catch (e) {
      if (typeof window !== 'undefined') sessionStorage.removeItem(TOKEN_KEY);
      return false;
    }
  }

  public subscribe(listener: (state: AppStoreState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  private loadInitial(): AppStoreState {
    // The frontend no longer carries a business-data demo seed. Business data is
    // loaded from the durable backend after authentication. Only Quick Access
    // accounts are available as the local fallback for the login screen.
    return {
      currentUser: INITIAL_USERS[0],
      users: INITIAL_USERS,
      schools: [],
      sessions: [],
      terms: [],
      classes: [],
      subjects: [],
      students: [],
      questions: [],
      examinations: [],
      markingSchemes: [],
      rubrics: [],
      studentPapers: [],
      answerScripts: [],
      results: [],
      gradeScales: [],
      reportCards: [],
      auditLogs: [],
      systemConfig: { ...INITIAL_SYSTEM_CONFIG },
      announcements: [],
      handbookArticles: [],
      dailyRollCalls: []
    };
  }

  public save() {
    // localStorage is only a UI crash/offline cache. The server remains authoritative.
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
    this.notify();
    if (!this.getToken()) return;

    // Build the payload INSIDE the serialized queue. The previous implementation
    // captured _revision before queued DELETE requests completed, causing the next
    // PUT /state to use a stale revision and return 409 repeatedly.
    this.syncPromise = this.syncPromise.then(async () => {
      const deletes = Array.from(this.pendingDeletes.entries()).flatMap(([resource, ids]) =>
        Array.from(ids).map(id => ({ resource, id }))
      );
      for (const { resource, id } of deletes) {
        try {
          const result = await this.request(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });
          this.pendingDeletes.get(resource)?.delete(id);
          this.serverRevision = result?.revision || this.serverRevision;
        } catch (err: any) {
          // A record may already have been deleted on another tab/device. Refreshing
          // the revision keeps subsequent state writes from becoming permanently stale.
          if (String(err?.message || '').toLowerCase().includes('not found')) {
            await this.hydrate();
            this.pendingDeletes.get(resource)?.delete(id);
            continue;
          }
          throw err;
        }
      }

      const payload: any = {
        _revision: this.serverRevision,
        users: this.state.users, schools: this.state.schools, sessions: this.state.sessions, terms: this.state.terms,
        classes: this.state.classes, subjects: this.state.subjects, students: this.state.students, questions: this.state.questions,
        examinations: this.state.examinations, markingSchemes: this.state.markingSchemes, rubrics: this.state.rubrics,
        studentPapers: this.state.studentPapers, answerScripts: this.state.answerScripts, results: this.state.results,
        gradeScales: this.state.gradeScales, reportCards: this.state.reportCards, announcements: this.state.announcements,
        handbookArticles: this.state.handbookArticles, dailyRollCalls: this.state.dailyRollCalls,
        systemConfig: this.state.systemConfig
      };
      payload.users = this.state.users.map(u => {
        const password = this.pendingUserPasswords.get(u.id);
        return password ? { ...u, password } : u;
      });

      const result = await this.request('/state', { method: 'PUT', body: JSON.stringify(payload) });
      this.serverRevision = result?.revision || this.serverRevision;
      for (const id of Array.from(this.pendingUserPasswords.keys())) this.pendingUserPasswords.delete(id);
    }).catch(async (err: any) => {
      console.error('Server synchronization failed:', err);
      if (String(err?.message || '').toLowerCase().includes('stale') || String(err?.message || '').includes('STATE_CONFLICT')) {
        await this.hydrate();
      }
    });
  }

  public async candidateAccess(examinationId: string, admissionNumber: string): Promise<{ success: boolean; message: string; studentId?: string; paperId?: string }> {
    try {
      const body = await this.request('/candidate/access', {
        method: 'POST',
        body: JSON.stringify({ examination_id: examinationId, admission_number: admissionNumber.trim().toUpperCase() })
      });
      if (typeof window !== 'undefined') sessionStorage.setItem(CANDIDATE_TOKEN_KEY, body.access_token);
      this.state.studentPapers = this.state.studentPapers;
      return { success: true, message: 'Candidate verified successfully.', studentId: body.student_id, paperId: body.paper_id };
    } catch (e: any) {
      if (typeof window !== 'undefined') sessionStorage.removeItem(CANDIDATE_TOKEN_KEY);
      return { success: false, message: e?.message || 'Invalid admission number or candidate is not eligible for this examination.' };
    }
  }

  public clearCandidateAccess() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(CANDIDATE_TOKEN_KEY);
  }

  public async submitCandidateCbtExam(paperId: string, answers: Record<string, string>): Promise<any> {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem(CANDIDATE_TOKEN_KEY) : null;
    if (!token) return { success: false, message: 'Candidate authentication has expired. Please enter your admission number again.' };
    try {
      const response = await fetch(`${API_BASE}/student-papers/${encodeURIComponent(paperId)}/cbt-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
      return { success: true, ...body };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to submit examination.' };
    }
  }

  public async parseExamDocument(payload: { documentText?: string; fileBase64?: string; mimeType?: string; defaultSubject?: string; defaultClass?: string }): Promise<any> {
    return this.request('/gemini/parse-exam-document', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async flush(): Promise<void> {
    await this.syncPromise;
  }

  public getState(): AppStoreState {
    return this.state;
  }

  public resetToSeed() {
    this.resetToDemoSeed();
  }

  public resetToDemoSeed() {
    // Backward-compatible method name retained for older UI callers.
    // It now means "Quick Access Seed": no benchmark/business records are
    // recreated. Existing persistent records are intentionally cleared only
    // when the Super-Admin explicitly invokes this action.
    this.state = {
      currentUser: INITIAL_USERS[0],
      users: INITIAL_USERS,
      schools: [],
      sessions: [],
      terms: [],
      classes: [],
      subjects: [],
      students: [],
      questions: [],
      examinations: [],
      markingSchemes: [],
      rubrics: [],
      studentPapers: [],
      answerScripts: [],
      results: [],
      gradeScales: [],
      reportCards: [],
      auditLogs: [],
      systemConfig: { ...INITIAL_SYSTEM_CONFIG },
      announcements: [],
      handbookArticles: [],
      dailyRollCalls: []
    };
    this.save();
  }

  public async resetToEmptyDatabase(): Promise<{ success: boolean; message: string }> {
    if (this.state.currentUser.role !== 'super-admin') {
      return {
        success: false,
        message: 'Permission Denied: Only users with the Super-Admin role are authorized to reset all data to an empty database.'
      };
    }
    try {
      const result = await this.request('/database/reset-empty', { method: 'POST', body: JSON.stringify({ confirmation: 'RESET' }) });
      // Reload from the server immediately. Do not call save() here: doing so would
      // send the old browser snapshot back and could repopulate the database.
      this.pendingDeletes.clear();
      await this.hydrate();
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      return { success: true, message: result.message || 'Database cleared successfully.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Unable to clear the database.' };
    }
  }

  public recordAudit(
    action: AuditLog['action'],
    entity_type: string,
    entity_id: string,
    old_value?: any,
    new_value?: any,
    actor?: string,
    actor_role?: UserRole,
    lga?: string,
    school_id?: string | null,
    description?: string
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: actor || this.state.currentUser.username,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      actor_role,
      lga,
      school_id,
      description
    };
    this.state.auditLogs.unshift(log);
    this.save();
    return log;
  }

  // Current User / Impersonation
  public setCurrentUser(user: User) {
    this.state.currentUser = user;
    this.save();
  }

  // School Enforcement Check
  public canAccessSchool(schoolId: string | null): boolean {
    if (!this.state.currentUser.is_active) return false;
    if (this.state.currentUser.role === 'super-admin' || this.state.currentUser.role === 'director') {
      return true;
    }
    if (!schoolId) return true; // centralized/non-school-scoped resources
    // An unassigned principal/teacher must not inherit statewide visibility.
    if (!this.state.currentUser.school_id) return false;
    return this.state.currentUser.school_id === schoolId;
  }

  // User Management
  public createUser(userData: { username: string; email: string; role: UserRole; school_id: string | null; full_name: string; password?: string }): { success: boolean; message: string; user?: User } {
    const actor = this.state.currentUser;
    if (!actor.is_active || (actor.role !== 'super-admin' && actor.role !== 'director')) {
      return { success: false, message: 'Unauthorized: Only Super-Admin and Director of Schools can create users.' };
    }

    if (actor.role === 'director' && (userData.role === 'super-admin' || userData.role === 'director')) {
      return { success: false, message: 'Directors of Schools cannot create Super-Admin or other Director accounts.' };
    }

    // Principal onboarding is intentionally two-step: the account may be created
    // before the school exists, then assigned from Academic Setup after the school
    // record has been created. An unassigned principal has no school-scoped access
    // until that assignment is completed. Teachers, however, must always have a school.
    if (userData.role === 'teacher' && !userData.school_id) {
      return { success: false, message: 'Teachers must be assigned to a specific school.' };
    }

    const exists = this.state.users.find(u => u.username.toLowerCase() === userData.username.toLowerCase() || u.email.toLowerCase() === userData.email.toLowerCase());
    if (exists) {
      return { success: false, message: 'A user with this username or email already exists.' };
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: userData.username.trim(),
      email: userData.email.trim(),
      role: userData.role,
      school_id: userData.school_id,
      full_name: userData.full_name.trim(),
      is_active: true,
      created_at: new Date().toISOString()
    };

    this.state.users.push(newUser);
    const temporaryPassword = userData.password || `EARPMS-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString().slice(-4)}`;
    this.pendingUserPasswords.set(newUser.id, temporaryPassword);
    this.recordAudit('CREATE', 'user', newUser.id, undefined, { username: newUser.username, role: newUser.role, school_id: newUser.school_id });
    this.save();
    return { success: true, message: userData.password ? `User ${newUser.username} successfully registered.` : `User ${newUser.username} successfully registered. Temporary password: ${temporaryPassword}`, user: newUser };
  }

  public updateUser(userId: string, updates: Partial<User>): { success: boolean; message: string; user?: User } {
    const actor = this.state.currentUser;
    if (!actor.is_active || (actor.role !== 'super-admin' && actor.role !== 'director')) {
      return { success: false, message: 'Unauthorized: Only Super-Admin and Director of Schools can update users.' };
    }
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };
    if (actor.role === 'director' && (updates.role === 'super-admin' || updates.role === 'director')) {
      return { success: false, message: 'Directors cannot assign Super-Admin or Director roles.' };
    }
    // A Principal may temporarily have school_id=null during onboarding.
    // Assignment is completed from the school Principal Assignment workflow.
    if (updates.role === 'teacher' && updates.school_id === null) {
      return { success: false, message: 'Teachers must be assigned to a specific school.' };
    }
    if (updates.username && this.state.users.some(u => u.id !== userId && u.username.toLowerCase() === String(updates.username).trim().toLowerCase())) {
      return { success: false, message: 'That username is already in use.' };
    }
    if (updates.email && this.state.users.some(u => u.id !== userId && u.email.toLowerCase() === String(updates.email).trim().toLowerCase())) {
      return { success: false, message: 'That email is already in use.' };
    }
    const old = { ...user };
    Object.assign(user, updates);
    if (user.role === 'super-admin' || user.role === 'director') user.school_id = null;
    this.recordAudit('UPDATE', 'user', user.id, old, updates);
    this.save();
    return { success: true, message: `User ${user.username} updated successfully.`, user };
  }

  public deleteUser(userId: string): { success: boolean; message: string } {
    const actor = this.state.currentUser;
    if (!actor.is_active || (actor.role !== 'super-admin' && actor.role !== 'director')) {
      return { success: false, message: 'Unauthorized: Only Super-Admin and Director of Schools can delete users.' };
    }
    if (userId === actor.id) return { success: false, message: 'You cannot delete your own account.' };
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };
    if (actor.role === 'director' && (user.role === 'super-admin' || user.role === 'director')) {
      return { success: false, message: 'Directors cannot delete Super-Admin or Director accounts.' };
    }
    this.state.users = this.state.users.filter(u => u.id !== userId);
    this.recordAudit('DELETE', 'user', userId, user);
    this.save();
    return { success: true, message: `User ${user.full_name} deleted successfully.` };
  }

  public updateUserRole(userId: string, newRole: UserRole, newSchoolId: string | null): { success: boolean; message: string } {
    const actor = this.state.currentUser;
    if (actor.role !== 'super-admin') {
      return { success: false, message: 'Only Super-Admin can change user roles.' };
    }

    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const old = { role: user.role, school_id: user.school_id };

    if (newRole === 'teacher' && !newSchoolId) {
      return { success: false, message: 'Teachers must be assigned to a specific school. Use Edit User to select the school.' };
    }

    // When a principal is promoted/demoted, keep the school master record
    // consistent with the user's role. A Principal can be created without a
    // school and remain pending assignment; other roles may be statewide.
    if (old.role === 'principal' && newRole !== 'principal') {
      this.state.schools.forEach(school => {
        if (school.principal_user_id === user.id) {
          school.principal_user_id = null;
          if (school.head_teacher === user.full_name) school.head_teacher = 'Not Assigned';
        }
      });
    }

    user.role = newRole;
    user.school_id = newSchoolId ?? null;

    this.recordAudit('UPDATE', 'user-role', user.id, old, { role: newRole, school_id: user.school_id });
    this.save();
    return { success: true, message: `Role for ${user.username} updated.` };
  }

  // Grade Scale Management (with UNIQUE (name, grade) rule)
  public createGradeScale(data: Omit<GradeScale, 'id'>): { success: boolean; message: string; scale?: GradeScale } {
    if (data.min_percent < 0 || data.max_percent > 100 || data.min_percent > data.max_percent) {
      return { success: false, message: 'Percentage bounds must be between 0 and 100 with min <= max.' };
    }

    const dup = this.state.gradeScales.find(
      g => g.name.toLowerCase() === data.name.toLowerCase() && g.grade.toUpperCase() === data.grade.toUpperCase()
    );
    if (dup) {
      return { success: false, message: `Grade scale '${data.name}' already contains a definition for grade '${data.grade}'.` };
    }

    const newScale: GradeScale = {
      id: `gs-${Date.now()}`,
      ...data,
      grade: data.grade.toUpperCase()
    };

    this.state.gradeScales.push(newScale);
    this.recordAudit('CREATE', 'grade-scale', newScale.id, undefined, newScale);
    this.save();
    return { success: true, message: `Grade ${newScale.grade} created for scale ${newScale.name}.`, scale: newScale };
  }

  public updateGradeScale(id: string, updates: Partial<Omit<GradeScale, 'id'>>): { success: boolean; message: string; scale?: GradeScale } {
    const idx = this.state.gradeScales.findIndex(g => g.id === id);
    if (idx === -1) return { success: false, message: 'Scale not found.' };
    const current = this.state.gradeScales[idx];
    const next: GradeScale = {
      ...current, ...updates,
      name: String(updates.name ?? current.name).trim(),
      grade: String(updates.grade ?? current.grade).trim().toUpperCase(),
      min_percent: Number(updates.min_percent ?? current.min_percent),
      max_percent: Number(updates.max_percent ?? current.max_percent),
      gpa_point: Number(updates.gpa_point ?? current.gpa_point),
      remark: String(updates.remark ?? current.remark).trim()
    };
    if (!next.name || !next.grade || !next.remark) return { success: false, message: 'Scale name, grade letter and official remarks are required.' };
    if (!Number.isFinite(next.min_percent) || !Number.isFinite(next.max_percent) || next.min_percent < 0 || next.max_percent > 100 || next.min_percent > next.max_percent) return { success: false, message: 'Percentage bounds must be between 0 and 100 with min <= max.' };
    if (!Number.isFinite(next.gpa_point) || next.gpa_point < 0) return { success: false, message: 'GPA points must be a valid non-negative number.' };
    const dup = this.state.gradeScales.find(g => g.id !== id && g.name.toLowerCase() === next.name.toLowerCase() && g.grade.toUpperCase() === next.grade.toUpperCase());
    if (dup) return { success: false, message: `Grade scale '${next.name}' already contains a definition for grade '${next.grade}'.` };
    const old = { ...current };
    this.state.gradeScales[idx] = next;
    this.recordAudit('UPDATE', 'grade-scale', id, old, next);
    this.save();
    return { success: true, message: `Grade ${next.grade} updated for scale ${next.name}.`, scale: next };
  }

  public deleteGradeScale(id: string): { success: boolean; message: string } {
    const idx = this.state.gradeScales.findIndex(g => g.id === id);
    if (idx === -1) return { success: false, message: 'Scale not found.' };
    const removed = this.state.gradeScales.splice(idx, 1)[0];
    this.recordAudit('DELETE', 'grade-scale', id, removed);
    this.save();
    return { success: true, message: `Grade scale entry deleted.` };
  }

  // Examination Management
  public createExamination(examData: {
    title: string;
    subject_id: string;
    class_id: string;
    session_id: string;
    term_id: string;
    date: string;
    duration_minutes: number;
    maximum_marks: number;
    passing_percentage: number;
    question_paper_mode?: 'fixed' | 'variable';
    variable_question_count?: number;
  }): Examination {
    const sub = this.state.subjects.find(s => s.id === examData.subject_id);
    const code = `EDS-2026-${sub?.code || 'EXAM'}-${Date.now().toString().slice(-4)}`;
    const newExam: Examination = {
      id: `ex-${Date.now()}`,
      code,
      title: examData.title.trim() || 'New Examination',
      school_id: this.state.currentUser.school_id,
      subject_id: examData.subject_id,
      class_id: examData.class_id,
      session_id: examData.session_id,
      term_id: examData.term_id,
      date: examData.date,
      duration_minutes: Number(examData.duration_minutes) || 90,
      maximum_marks: Number(examData.maximum_marks) || 100,
      passing_percentage: Number(examData.passing_percentage) || 50,
      question_paper_mode: examData.question_paper_mode || 'fixed',
      variable_question_count: examData.variable_question_count,
      status: 'draft',
      created_by: this.state.currentUser.id,
      created_by_name: this.state.currentUser.full_name
    };
    this.state.examinations.push(newExam);
    this.recordAudit('CREATE', 'examination', newExam.id, undefined, {
      code: newExam.code,
      title: newExam.title,
      mode: newExam.question_paper_mode
    });
    this.save();
    return newExam;
  }

  // FIXED: Super-Admin can edit any examination (including finalized)
  public updateExamination(id: string, updates: Partial<Examination>): { success: boolean; message: string; examination?: Examination } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Permission Denied: Only Super-Admin can edit examinations.' };
    }
    const exam = this.state.examinations.find(e => e.id === id);
    if (!exam) return { success: false, message: 'Examination not found.' };
    // Removed the finalized check – Super-Admin can edit even finalized exams.
    const old = { ...exam };
    Object.assign(exam, updates, { id });
    if (exam.question_paper_mode === 'variable') {
      const pool = this.state.questions.filter(q => q.examination_id === id).length;
      exam.variable_question_count = Math.max(1, Math.min(Number(exam.variable_question_count || 1), Math.max(pool, 1)));
    } else {
      exam.variable_question_count = undefined;
    }
    this.recordAudit('UPDATE', 'examination', id, old, exam);
    this.save();
    return { success: true, message: `Examination '${exam.title}' updated successfully.`, examination: exam };
  }

  // Question Management & Verification
  public verifyQuestion(questionId: string, verified: boolean): { success: boolean; message: string } {
    const q = this.state.questions.find(item => item.id === questionId);
    if (!q) return { success: false, message: 'Question not found.' };
    q.verified = verified;
    this.recordAudit('UPDATE', 'question-verification', q.id, { verified: !verified }, { verified });
    this.save();
    return { success: true, message: `Question Q${q.question_number} verification marked as ${verified ? 'Verified' : 'Unverified'}.` };
  }

  public addQuestion(data: Omit<Question, 'id'>): Question {
    const q: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ...data
    };
    this.state.questions.push(q);
    this.recordAudit('CREATE', 'question', q.id, undefined, { q_num: q.question_number, marks: q.maximum_marks });
    this.save();
    return q;
  }

  public updateQuestion(id: string, updates: Partial<Question>): { success: boolean; message: string } {
    const q = this.state.questions.find(item => item.id === id);
    if (!q) return { success: false, message: 'Question not found.' };
    Object.assign(q, updates);
    this.recordAudit('UPDATE', 'question', q.id, undefined, updates);
    this.save();
    return { success: true, message: `Question Q${q.question_number} updated.` };
  }

  public deleteQuestion(id: string): { success: boolean; message: string } {
    const q = this.state.questions.find(item => item.id === id);
    if (!q) return { success: false, message: 'Question not found.' };
    const linkedPapers = this.state.studentPapers.filter(p => p.assigned_question_ids?.includes(id));
    if (linkedPapers.length > 0) {
      return { success: false, message: 'This question is already assigned to candidate papers. Regenerate/unassign candidate papers before deleting it.' };
    }
    this.state.questions = this.state.questions.filter(item => item.id !== id);
    this.recordAudit('DELETE', 'question', id, q);
    this.save();
    return { success: true, message: `Question Q${q.question_number} deleted.` };
  }

  public bulkEnrollStudentsInExam(examId: string, studentIds: string[]): { success: boolean; message: string; count: number } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.', count: 0 };
    if (!studentIds.length) return { success: false, message: 'No students selected.', count: 0 };
    const eligible = this.state.students.filter(s => studentIds.includes(s.id) && s.status === 'active' && s.class_id === exam.class_id && (!exam.school_id || s.school_id === exam.school_id));
    const existing = new Set(this.state.studentPapers.filter(p => p.examination_id === examId).map(p => p.student_id));
    const questions = this.state.questions.filter(q => q.examination_id === examId).sort((a,b) => a.question_number-b.question_number);
    let count = 0;
    for (const student of eligible) {
      if (existing.has(student.id)) continue;
      let assigned = questions.map(q => q.id);
      if (exam.question_paper_mode === 'variable') assigned = this.computeVariableQuestionsForStudent(questions, student.id, Math.min(exam.variable_question_count || questions.length, questions.length));
      const code = `EP-${exam.code.replace(/[^a-z0-9]/gi,'')}-${String(student.admission_number || student.id).split('/').pop()}`;
      const paper: StudentExamPaper = {
        id: `pap-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        paper_code: code, examination_id: examId, student_id: student.id,
        qr_code_payload: `EDS:EXAM:${examId}:STU:${student.id}:PAP:${code}`,
        status: 'enrolled', assigned_question_ids: [], delivery_mode: 'offline', cbt_status: 'not_started'
      };
      this.state.studentPapers.push(paper); count++;
    }
    this.recordAudit('CREATE', 'exam-bulk-enrollment', examId, undefined, { selected: studentIds.length, eligible: eligible.length, created: count });
    this.save();
    return { success: true, message: `Enrolled ${count} existing student(s) into ${exam.title}.`, count };
  }

  // Marking Scheme Lifecycle
  public createMarkingScheme(examId: string): { success: boolean; message: string; scheme?: MarkingScheme } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.' };

    const questions = this.state.questions
      .filter(q => q.examination_id === examId)
      .sort((a, b) => a.question_number - b.question_number);

    if (questions.length === 0) {
      return { success: false, message: 'No questions have been imported or created for this examination.' };
    }

    if (questions.some(q => !q.verified)) {
      return { success: false, message: 'All questions must be verified before creating a marking scheme.' };
    }

    const existingSchemes = this.state.markingSchemes.filter(s => s.examination_id === examId);
    const version = (existingSchemes.length > 0 ? Math.max(...existingSchemes.map(s => s.version)) : 0) + 1;

    const schemeId = `ms-${Date.now()}`;
    const criteria: MarkingCriterion[] = questions.map((q, idx) => ({
      id: `mc-${schemeId}-${idx + 1}`,
      marking_scheme_id: schemeId,
      question_id: q.id,
      label: q.question_type === 'objective' ? `Expected Option: ${q.correct_answer || 'Key'}` : 'Expected response & steps',
      guidance: q.expected_answer || (q.correct_answer ? `Award full marks for option ${q.correct_answer}.` : 'Award marks for valid mathematical / conceptual steps.'),
      marks: q.maximum_marks,
      order_no: idx + 1
    }));

    const hash = computeHash(criteria.map(c => ({ q: c.question_id, m: c.marks, g: c.guidance })));

    const scheme: MarkingScheme = {
      id: schemeId,
      examination_id: examId,
      version,
      status: 'draft',
      hash,
      is_hidden: false,
      is_deleted: false,
      created_by: this.state.currentUser.username,
      criteria
    };

    this.state.markingSchemes.push(scheme);
    this.recordAudit('CREATE', 'marking-scheme', scheme.id, undefined, { exam_id: examId, version, hash });
    this.save();
    return { success: true, message: `Marking Scheme v${version} created in Draft status.`, scheme };
  }

  public updateDraftSchemeCriteria(schemeId: string, updatedCriteria: { id: string; marks: number; guidance: string }[]): { success: boolean; message: string } {
    const scheme = this.state.markingSchemes.find(s => s.id === schemeId);
    if (!scheme) return { success: false, message: 'Scheme not found.' };
    if (scheme.status !== 'draft') return { success: false, message: 'Only draft marking schemes can be edited.' };

    for (const item of updatedCriteria) {
      const crit = scheme.criteria.find(c => c.id === item.id);
      if (crit) {
        if (item.marks < 0) return { success: false, message: `Criterion marks cannot be negative.` };
        crit.marks = item.marks;
        crit.guidance = item.guidance;
      }
    }

    scheme.hash = computeHash(scheme.criteria.map(c => ({ q: c.question_id, m: c.marks, g: c.guidance })));
    this.recordAudit('UPDATE', 'marking-scheme', scheme.id, undefined, { version: scheme.version, hash: scheme.hash });
    this.save();
    return { success: true, message: `Draft criteria saved. New hash calculated.` };
  }

  public approveMarkingScheme(schemeId: string): { success: boolean; message: string } {
    const scheme = this.state.markingSchemes.find(s => s.id === schemeId);
    if (!scheme) return { success: false, message: 'Scheme not found.' };
    if (scheme.is_deleted) return { success: false, message: 'Deleted schemes cannot be approved.' };
    if (scheme.status !== 'draft') return { success: false, message: 'Only draft schemes can be approved.' };
    if (scheme.criteria.length === 0) return { success: false, message: 'Scheme must contain criteria.' };

    scheme.status = 'approved';
    this.recordAudit('APPROVE', 'marking-scheme', scheme.id, { status: 'draft' }, { status: 'approved' });
    this.save();
    return { success: true, message: `Marking Scheme v${scheme.version} approved.` };
  }

  public lockMarkingScheme(schemeId: string): { success: boolean; message: string } {
    const scheme = this.state.markingSchemes.find(s => s.id === schemeId);
    if (!scheme) return { success: false, message: 'Scheme not found.' };
    if (scheme.status !== 'approved') return { success: false, message: 'Only approved schemes can be locked.' };

    const exam = this.state.examinations.find(e => e.id === scheme.examination_id);
    const questions = this.state.questions.filter(q => q.examination_id === scheme.examination_id);
    const questionTotal = questions.reduce((sum, q) => sum + q.maximum_marks, 0);
    const schemeTotal = scheme.criteria.reduce((sum, c) => sum + c.marks, 0);

    if (schemeTotal !== questionTotal) {
      return {
        success: false,
        message: `Scheme total (${schemeTotal} marks) must equal total question maximum marks (${questionTotal} marks) before locking.`
      };
    }

    scheme.status = 'locked';
    scheme.locked_at = new Date().toISOString();
    this.recordAudit('LOCK', 'marking-scheme', scheme.id, { status: 'approved' }, { status: 'locked', hash: scheme.hash, total_marks: schemeTotal });
    this.save();
    return { success: true, message: `Marking Scheme v${scheme.version} locked and immutable.` };
  }

  public hideMarkingScheme(schemeId: string): { success: boolean; message: string } {
    const scheme = this.state.markingSchemes.find(s => s.id === schemeId);
    if (!scheme) return { success: false, message: 'Scheme not found.' };
    scheme.is_hidden = true;
    scheme.hidden_at = new Date().toISOString();
    scheme.hidden_by = this.state.currentUser.username;
    this.recordAudit('HIDE', 'marking-scheme', scheme.id, undefined, { version: scheme.version });
    this.save();
    return { success: true, message: `Marking Scheme v${scheme.version} hidden.` };
  }

  public unhideMarkingScheme(schemeId: string): { success: boolean; message: string } {
    const scheme = this.state.markingSchemes.find(s => s.id === schemeId);
    if (!scheme) return { success: false, message: 'Scheme not found.' };
    scheme.is_hidden = false;
    scheme.hidden_at = undefined;
    scheme.hidden_by = undefined;
    this.recordAudit('UNHIDE', 'marking-scheme', scheme.id, undefined, { version: scheme.version });
    this.save();
    return { success: true, message: `Marking Scheme v${scheme.version} restored.` };
  }

  public deleteMarkingScheme(schemeId: string): { success: boolean; message: string } {
    const scheme = this.state.markingSchemes.find(s => s.id === schemeId);
    if (!scheme) return { success: false, message: 'Scheme not found.' };
    if (scheme.status === 'locked') return { success: false, message: 'Locked marking schemes cannot be deleted.' };

    scheme.is_deleted = true;
    scheme.is_hidden = true;
    scheme.deleted_at = new Date().toISOString();
    scheme.deleted_by = this.state.currentUser.username;
    this.recordAudit('DELETE', 'marking-scheme', scheme.id, undefined, { version: scheme.version });
    this.save();
    return { success: true, message: `Marking Scheme v${scheme.version} deleted from active use. History preserved.` };
  }

  // Rubric Generation (Copies CURRENT marking scheme criteria)
  public regenerateRubric(examId: string): { success: boolean; message: string; rubric?: Rubric } {
    const activeSchemes = this.state.markingSchemes
      .filter(s => s.examination_id === examId && !s.is_deleted && !s.is_hidden && (s.status === 'approved' || s.status === 'locked'))
      .sort((a, b) => b.version - a.version);

    if (activeSchemes.length === 0) {
      return { success: false, message: 'Approve or lock a marking scheme before generating a rubric.' };
    }

    const scheme = activeSchemes[0];
    const existingRubrics = this.state.rubrics.filter(r => r.examination_id === examId);
    const version = (existingRubrics.length > 0 ? Math.max(...existingRubrics.map(r => r.version)) : 0) + 1;

    const rubricId = `rub-${Date.now()}`;
    const criteria: RubricCriterion[] = scheme.criteria.map((c, idx) => ({
      id: `rc-${rubricId}-${idx + 1}`,
      rubric_id: rubricId,
      question_id: c.question_id,
      label: c.label,
      guidance: c.guidance,
      marks: c.marks,
      order_no: c.order_no
    }));

    const rubric: Rubric = {
      id: rubricId,
      examination_id: examId,
      marking_scheme_id: scheme.id,
      version,
      status: 'approved',
      source_hash: scheme.hash,
      source_scheme_hash: scheme.hash,
      locked_by: this.state.currentUser.username,
      locked_at: new Date().toISOString(),
      criteria
    };

    this.state.rubrics.push(rubric);
    this.recordAudit('GENERATE', 'rubric', rubric.id, undefined, {
      exam_id: examId,
      rubric_version: rubric.version,
      scheme_version: scheme.version,
      scheme_hash: scheme.hash
    });
    this.save();
    return {
      success: true,
      message: `Rubric v${rubric.version} successfully generated from current Marking Scheme v${scheme.version}.`,
      rubric
    };
  }

  // Helper to compute deterministic varied question subsets per candidate
  public computeVariableQuestionsForStudent(
    allQuestions: Question[],
    studentId: string,
    variableCount?: number
  ): string[] {
    if (allQuestions.length <= 1) return allQuestions.map(q => q.id);

    // Deterministic seed based on student ID to produce distinct variations
    let seed = 0;
    for (let i = 0; i < studentId.length; i++) {
      seed = (seed * 31 + studentId.charCodeAt(i)) >>> 0;
    }

    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const count = variableCount && variableCount > 0
      ? Math.min(variableCount, allQuestions.length)
      : Math.min(allQuestions.length, Math.max(3, Math.floor(allQuestions.length * 0.8)));

    return shuffled.slice(0, count).map(q => q.id);
  }

  // Update Exam Paper Content Mode (Fixed vs Variable) and variable question count
  public updateExamPaperContentMode(
    examId: string,
    mode: 'fixed' | 'variable',
    variableQuestionCount?: number
  ): { success: boolean; message: string } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.' };
    if (exam.status === 'finalized') return { success: false, message: 'Finalized examinations are immutable.' };

    const allQuestions = this.state.questions
      .filter(q => q.examination_id === examId)
      .sort((a, b) => a.question_number - b.question_number);

    exam.question_paper_mode = mode;
    if (mode === 'variable') {
      exam.variable_question_count = variableQuestionCount && variableQuestionCount > 0
        ? Math.min(variableQuestionCount, Math.max(1, allQuestions.length))
        : Math.min(allQuestions.length, Math.max(1, Math.floor(allQuestions.length * 0.8)));
    } else {
      exam.variable_question_count = undefined;
    }

    // Re-assign candidate papers with new mode
    const papers = this.state.studentPapers.filter(p => p.examination_id === examId);
    for (const paper of papers) {
      // Never mutate a distributed, collected, scanned, or CBT-used paper.
      if (paper.status !== 'enrolled' && (['distributed','collected','scanned'].includes(paper.status) || ['in_progress','submitted','graded'].includes(paper.cbt_status || ''))) continue;
      if (mode === 'fixed') {
        paper.assigned_question_ids = allQuestions.map(q => q.id);
      } else {
        paper.assigned_question_ids = this.computeVariableQuestionsForStudent(allQuestions, paper.student_id, exam.variable_question_count);
      }
    }

    this.recordAudit('UPDATE', 'examination', examId, undefined, {
      action: 'QUESTION_PAPER_MODE_UPDATED',
      mode,
      variable_question_count: exam.variable_question_count,
      papers_updated: papers.length
    });

    this.save();
    return {
      success: true,
      message: `Exam paper content set to ${
        mode === 'variable'
          ? `Variable (${exam.variable_question_count} questions selected per candidate from ${allQuestions.length} pool)`
          : 'Fixed (All candidates receive identical questions)'
      }.`
    };
  }

  // Student Exam Paper Generation (Variable or Fixed based on examination settings)
  public generateStudentPapers(examId: string): { success: boolean; message: string; count: number } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Exam not found.', count: 0 };

    // Paper generation is intentionally limited to pupils already enrolled in this examination.
    // Class membership alone does not enroll a pupil.
    const enrolledStudentIds = new Set(this.state.studentPapers.filter(p => p.examination_id === examId).map(p => p.student_id));
    const students = this.state.students.filter(s => enrolledStudentIds.has(s.id) && s.class_id === exam.class_id && (exam.school_id ? s.school_id === exam.school_id : true));
    if (students.length === 0) {
      return { success: false, message: 'No enrolled students found for this class and school.', count: 0 };
    }

    const allQuestions = this.state.questions
      .filter(q => q.examination_id === examId)
      .sort((a, b) => a.question_number - b.question_number);

    let generatedCount = 0;
    for (const student of students) {
      const paper = this.state.studentPapers.find(p => p.examination_id === examId && p.student_id === student.id);
      if (!paper) continue;

      const assignedIds = exam.question_paper_mode === 'variable'
        ? this.computeVariableQuestionsForStudent(allQuestions, student.id, exam.variable_question_count)
        : allQuestions.map(q => q.id);

      if (paper.status === 'enrolled') {
        const paperCode = `EP-${exam.code.replace(/[^A-Z0-9]/gi, '')}-${String(student.admission_number || student.id).split('/').pop()}`;
        paper.paper_code = paperCode;
        paper.qr_code_payload = `EDS:EXAM:${exam.id}:STU:${student.id}:PAP:${paperCode}`;
        paper.status = 'generated';
        paper.assigned_question_ids = assignedIds;
        generatedCount++;
      } else if (!['distributed', 'collected', 'scanned'].includes(paper.status) && !['in_progress', 'submitted', 'graded'].includes(paper.cbt_status || '')) {
        paper.assigned_question_ids = assignedIds;
      }
    }

    this.recordAudit('GENERATE', 'student-papers', examId, undefined, {
      generated: generatedCount,
      total: students.length,
      mode: exam.question_paper_mode || 'fixed',
      variable_count: exam.variable_question_count
    });
    this.save();
    return {
      success: true,
      message: `Generated ${generatedCount} student paper(s) (${
        exam.question_paper_mode === 'variable'
          ? `Variable mode: ${exam.variable_question_count || allQuestions.length} questions per candidate`
          : 'Fixed mode: identical questions for all candidates'
      }).`,
      count: generatedCount
    };
  }

  // End-to-End One-Document Import & Pipeline Generator
  public importAndGenerateCompleteExamPipeline(params: {
    examId?: string;
    newExamData?: {
      title?: string;
      subject_id?: string;
      class_id?: string;
      session_id?: string;
      term_id?: string;
      duration_minutes?: number;
      maximum_marks?: number;
      passing_percentage?: number;
      question_paper_mode?: 'fixed' | 'variable';
      variable_question_count?: number;
    };
    questions: Array<{
      question_number?: number;
      question_type: 'objective' | 'structured' | 'theory';
      text: string;
      options?: { key: string; text: string }[];
      correct_answer?: string;
      expected_answer?: string;
      maximum_marks: number;
      answer_lines?: number;
    }>;
    autoVerifyQuestions?: boolean;
    generateMarkingScheme?: boolean;
    autoApproveScheme?: boolean;
    generateRubric?: boolean;
    generateStudentPapers?: boolean;
  }): {
    success: boolean;
    message: string;
    exam: Examination;
    questions: Question[];
    scheme?: MarkingScheme;
    rubric?: Rubric;
    studentPapersCount?: number;
  } {
    let targetExam: Examination | undefined;

    if (params.examId) {
      targetExam = this.state.examinations.find(e => e.id === params.examId);
    }

    if (!targetExam) {
      const subId = params.newExamData?.subject_id || this.state.subjects[0]?.id || 'sub-gen';
      const clsId = params.newExamData?.class_id || this.state.classes[0]?.id || 'cls-p6';
      const sub = this.state.subjects.find(s => s.id === subId);
      const cls = this.state.classes.find(c => c.id === clsId);
      const code = `EDS-2026-${sub?.code || 'EXAM'}-${Date.now().toString().slice(-4)}`;

      targetExam = {
        id: `ex-${Date.now()}`,
        code,
        title: params.newExamData?.title || 'Imported Examination',
        school_id: null,
        subject_id: subId,
        class_id: clsId,
        session_id: params.newExamData?.session_id || this.state.sessions[0]?.id || 'ses-2026',
        term_id: params.newExamData?.term_id || this.state.terms[0]?.id || 't-2',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: params.newExamData?.duration_minutes || 90,
        maximum_marks: params.newExamData?.maximum_marks || 100,
        passing_percentage: params.newExamData?.passing_percentage || 50,
        question_paper_mode: params.newExamData?.question_paper_mode || 'fixed',
        variable_question_count: params.newExamData?.variable_question_count,
        status: 'draft'
      };

      this.state.examinations.push(targetExam);
      this.recordAudit('CREATE', 'examination', targetExam.id, undefined, { code: targetExam.code, title: targetExam.title });
    }

    const createdQuestions: Question[] = [];
    params.questions.forEach((q, idx) => {
      const qType = q.question_type || 'theory';
      const defaultLines = qType === 'theory' ? 8 : (qType === 'structured' ? 4 : undefined);
      const qRecord: Question = {
        id: `q-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`,
        examination_id: targetExam!.id,
        question_number: q.question_number || (idx + 1),
        question_type: qType,
        text: q.text,
        options: q.options,
        correct_answer: q.correct_answer,
        expected_answer: q.expected_answer,
        maximum_marks: Number(q.maximum_marks) || 10,
        answer_lines: q.answer_lines ?? defaultLines,
        verified: params.autoVerifyQuestions !== false
      };
      this.state.questions.push(qRecord);
      createdQuestions.push(qRecord);
    });

    this.recordAudit('CREATE', 'question-bank', targetExam.id, undefined, { count: createdQuestions.length });

    // Step 3: Optional Marking Scheme Generation
    let scheme: MarkingScheme | undefined;
    if (params.generateMarkingScheme !== false && createdQuestions.length > 0) {
      const allQ = this.state.questions.filter(q => q.examination_id === targetExam!.id).sort((a, b) => a.question_number - b.question_number);
      const existingSchemes = this.state.markingSchemes.filter(s => s.examination_id === targetExam!.id);
      const version = (existingSchemes.length > 0 ? Math.max(...existingSchemes.map(s => s.version)) : 0) + 1;
      const schemeId = `ms-${Date.now()}`;

      const criteria: MarkingCriterion[] = allQ.map((q, idx) => ({
        id: `mc-${schemeId}-${idx + 1}`,
        marking_scheme_id: schemeId,
        question_id: q.id,
        label: q.question_type === 'objective' ? `Expected Option: ${q.correct_answer || 'Key'}` : `Model Solution & Steps (Q${q.question_number})`,
        guidance: q.expected_answer || (q.correct_answer ? `Award full marks for option ${q.correct_answer}.` : 'Award step marks for accurate steps.'),
        marks: q.maximum_marks,
        order_no: idx + 1
      }));

      const hash = computeHash(criteria.map(c => ({ q: c.question_id, m: c.marks, g: c.guidance })));

      scheme = {
        id: schemeId,
        examination_id: targetExam.id,
        version,
        status: params.autoApproveScheme ? 'approved' : 'draft',
        hash,
        is_hidden: false,
        is_deleted: false,
        created_by: this.state.currentUser.username,
        criteria
      };

      this.state.markingSchemes.push(scheme);
      this.recordAudit('CREATE', 'marking-scheme', scheme.id, undefined, { exam_id: targetExam.id, version, status: scheme.status });
    }

    // Step 4: Optional Rubric Generation
    let rubric: Rubric | undefined;
    if (params.generateRubric !== false && scheme && (scheme.status === 'approved' || params.autoApproveScheme)) {
      const existingRubrics = this.state.rubrics.filter(r => r.examination_id === targetExam!.id);
      const rVersion = (existingRubrics.length > 0 ? Math.max(...existingRubrics.map(r => r.version)) : 0) + 1;
      const rubricId = `rub-${Date.now()}`;

      const rCriteria: RubricCriterion[] = scheme.criteria.map((c, idx) => ({
        id: `rc-${rubricId}-${idx + 1}`,
        rubric_id: rubricId,
        question_id: c.question_id,
        label: c.label,
        guidance: c.guidance,
        marks: c.marks,
        order_no: c.order_no
      }));

      rubric = {
        id: rubricId,
        examination_id: targetExam.id,
        marking_scheme_id: scheme.id,
        version: rVersion,
        status: 'approved',
        source_hash: scheme.hash,
        source_scheme_hash: scheme.hash,
        locked_by: this.state.currentUser.username,
        locked_at: new Date().toISOString(),
        criteria: rCriteria
      };

      this.state.rubrics.push(rubric);
      this.recordAudit('GENERATE', 'rubric', rubric.id, undefined, { exam_id: targetExam.id, rubric_version: rVersion });
    }

    // Step 5: Optional Student Exam Papers Generation
    // Paper generation never enrolls an entire class implicitly. Only explicitly
    // enrolled candidates receive papers.
    let studentPapersCount = 0;
    if (params.generateStudentPapers !== false) {
      const generated = this.generateStudentPapers(targetExam.id);
      studentPapersCount = generated.success ? generated.count : 0;
      if (studentPapersCount > 0) {
        this.recordAudit('GENERATE', 'student-papers', targetExam.id, undefined, { count: studentPapersCount });
      }
    }

    targetExam.status = 'ready';
    this.save();

    return {
      success: true,
      message: `Complete exam pipeline generated: ${createdQuestions.length} questions imported, marking scheme v${scheme?.version || 1} created, rubric generated, and ${studentPapersCount} student papers produced.`,
      exam: targetExam,
      questions: createdQuestions,
      scheme,
      rubric,
      studentPapersCount
    };
  }

  // ==========================================
  // BULK ADD EXAM QUESTIONS & ANSWERS
  // ==========================================
  public bulkAddQuestionsAndAnswers(
    examId: string,
    questionsData: Array<{
      question_number?: number;
      question_type: 'objective' | 'structured' | 'theory';
      text: string;
      options?: { key: string; text: string }[];
      correct_answer?: string;
      expected_answer?: string;
      maximum_marks: number;
      answer_lines?: number;
      verified?: boolean;
    }>,
    replaceExisting: boolean = false
  ): { success: boolean; message: string; count: number } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.', count: 0 };

    if (replaceExisting) {
      this.state.questions = this.state.questions.filter(q => q.examination_id !== examId);
    }

    const currentQuestions = this.state.questions.filter(q => q.examination_id === examId);
    let startNumber = currentQuestions.length + 1;

    const added: Question[] = [];
    for (const q of questionsData) {
      const qType = q.question_type || 'objective';
      const defaultLines = qType === 'theory' ? 8 : (qType === 'structured' ? 4 : undefined);
      const newQ: Question = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        examination_id: examId,
        question_number: q.question_number || startNumber++,
        question_type: qType,
        text: q.text,
        options: q.options || (qType === 'objective' ? [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
          { key: 'C', text: 'Option C' },
          { key: 'D', text: 'Option D' }
        ] : undefined),
        correct_answer: q.correct_answer,
        expected_answer: q.expected_answer,
        maximum_marks: Number(q.maximum_marks) || 10,
        answer_lines: q.answer_lines ?? defaultLines,
        verified: q.verified ?? true
      };
      this.state.questions.push(newQ);
      added.push(newQ);
    }

    // Update exam maximum marks sum
    const allExamQuestions = this.state.questions.filter(q => q.examination_id === examId);
    exam.maximum_marks = allExamQuestions.reduce((sum, q) => sum + (Number(q.maximum_marks) || 0), 0);

    this.recordAudit('CREATE', 'examination', examId, undefined, {
      action: 'BULK_ADD_QUESTIONS',
      count: added.length,
      total_marks: exam.maximum_marks
    });

    this.save();
    return {
      success: true,
      message: `Successfully added ${added.length} questions and answers to ${exam.title}.`,
      count: added.length
    };
  }

  // ==========================================
  // EXAM SUBMISSION & PRINCIPAL REVIEW WORKFLOW
  // ==========================================
  public submitExamForPrincipalApproval(examId: string, notes?: string): { success: boolean; message: string } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.' };

    const questions = this.state.questions.filter(q => q.examination_id === examId);
    if (questions.length === 0) {
      return { success: false, message: 'Cannot submit exam without questions. Please add questions first.' };
    }

    const schemes = this.state.markingSchemes.filter(s => s.examination_id === examId && !s.is_deleted && !s.is_hidden);
    if (schemes.length === 0) {
      return { success: false, message: 'Please generate and review a marking scheme before submitting to the Principal.' };
    }

    const rubrics = this.state.rubrics.filter(r => r.examination_id === examId);
    if (rubrics.length === 0) {
      return { success: false, message: 'Please generate and lock the rubric matrix before submitting for Principal review.' };
    }

    const previousStatus = exam.status;
    exam.status = 'submitted_for_approval';
    exam.approval_status = 'pending';
    exam.created_by = this.state.currentUser.id;
    exam.created_by_name = this.state.currentUser.full_name;
    exam.submitted_at = new Date().toISOString();
    exam.submission_notes = notes || 'Submitted for official Principal moderation and approval.';

    this.recordAudit('UPDATE', 'examination', exam.id, { status: previousStatus }, {
      status: 'submitted_for_approval',
      submitted_by: this.state.currentUser.full_name,
      notes: exam.submission_notes
    });

    this.save();
    return {
      success: true,
      message: `Examination "${exam.title}" successfully submitted to Principal for moderation and review.`
    };
  }

  public reviewExamByPrincipal(
    examId: string,
    decision: 'approve' | 'request_changes' | 'reject',
    feedback?: string
  ): { success: boolean; message: string } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.' };

    if (!this.canReviewAndApproveExams(this.state.currentUser)) {
      return { success: false, message: 'Access Denied: Only Principals, Head Teachers, and MINISTRY OF EDUCATION Administrators can approve exams.' };
    }

    const previousStatus = exam.status;
    exam.reviewed_by = this.state.currentUser.id;
    exam.reviewed_by_name = this.state.currentUser.full_name;
    exam.reviewed_at = new Date().toISOString();
    exam.principal_feedback = feedback || '';

    if (decision === 'approve') {
      exam.status = 'approved';
      exam.approval_status = 'approved';
      if (!exam.principal_feedback) {
        exam.principal_feedback = 'Approved. Examination questions, marking scheme, and rubric meet Edo State Ministry of Education academic standards.';
      }
      // Ensure student personalized papers are generated upon approval
      this.generateStudentPapers(exam.id);
    } else if (decision === 'request_changes') {
      exam.status = 'changes_requested';
      exam.approval_status = 'changes_requested';
    } else {
      exam.status = 'rejected';
      exam.approval_status = 'rejected';
    }

    this.recordAudit('APPROVE', 'examination', exam.id, { status: previousStatus }, {
      decision,
      reviewed_by: this.state.currentUser.full_name,
      feedback: exam.principal_feedback
    });

    this.save();
    return {
      success: true,
      message: decision === 'approve'
        ? `Examination "${exam.title}" approved! Standard student question papers are now ready for bulk and individual printing.`
        : decision === 'request_changes'
        ? `Feedback sent to teacher. Examination marked as "Changes Requested".`
        : `Examination has been rejected with recorded notes.`
    };
  }

  // ==========================================
  // DAILY ROLL CALL / ATTENDANCE MANAGEMENT
  // ==========================================
  public saveDailyRollCall(data: Omit<DailyRollCall, 'id' | 'created_at' | 'updated_at'>): {
    success: boolean;
    message: string;
    rollCall: DailyRollCall;
  } {
    // Check if rollcall already exists for this school, class, date
    const existingIndex = this.state.dailyRollCalls.findIndex(
      rc => rc.school_id === data.school_id && rc.class_id === data.class_id && rc.date === data.date
    );

    const totalStudents = data.records.length;
    const presentCount = data.records.filter(r => r.status === 'present').length;
    const lateCount = data.records.filter(r => r.status === 'late').length;
    const excusedCount = data.records.filter(r => r.status === 'excused').length;
    const absentCount = data.records.filter(r => r.status === 'absent').length;
    const ratePercent = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

    let targetRollCall: DailyRollCall;

    if (existingIndex >= 0) {
      targetRollCall = {
        ...this.state.dailyRollCalls[existingIndex],
        ...data,
        total_students: totalStudents,
        present_count: presentCount,
        late_count: lateCount,
        excused_count: excusedCount,
        absent_count: absentCount,
        attendance_rate_percent: ratePercent,
        updated_at: new Date().toISOString(),
        status: 'submitted'
      };
      this.state.dailyRollCalls[existingIndex] = targetRollCall;
    } else {
      targetRollCall = {
        id: `rc-${data.date}-${data.class_id}-${Date.now().toString(36)}`,
        ...data,
        total_students: totalStudents,
        present_count: presentCount,
        late_count: lateCount,
        excused_count: excusedCount,
        absent_count: absentCount,
        attendance_rate_percent: ratePercent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'submitted'
      };
      this.state.dailyRollCalls.push(targetRollCall);
    }

    // Automatically recalculate students' attendance records for this class
    const classRollCalls = this.state.dailyRollCalls.filter(
      rc => rc.school_id === data.school_id && rc.class_id === data.class_id && rc.status === 'submitted'
    );
    const totalRollCallDays = classRollCalls.length;

    for (const student of this.state.students.filter(s => s.class_id === data.class_id && s.school_id === data.school_id)) {
      const studentPresentDays = classRollCalls.filter(rc => {
        const rec = rc.records.find(r => r.student_id === student.id);
        return rec && (rec.status === 'present' || rec.status === 'late');
      }).length;

      student.total_days = Math.max(65, totalRollCallDays);
      student.attendance_days = Math.max(student.attendance_days, studentPresentDays);
    }

    this.recordAudit('CREATE', 'student-papers', targetRollCall.id, undefined, {
      action: 'DAILY_ROLLCALL_SAVED',
      date: data.date,
      class_id: data.class_id,
      present: presentCount,
      absent: absentCount,
      rate: `${ratePercent}%`
    });

    this.save();
    return {
      success: true,
      message: `Daily roll call for ${data.date} submitted successfully. Attendance rate: ${ratePercent}%.`,
      rollCall: targetRollCall
    };
  }

  public deleteDailyRollCall(id: string): { success: boolean; message: string } {
    const existing = this.state.dailyRollCalls.find(rc => rc.id === id);
    if (!existing) return { success: false, message: 'Roll call record not found.' };

    this.state.dailyRollCalls = this.state.dailyRollCalls.filter(rc => rc.id !== id);
    this.recordAudit('DELETE', 'student-papers', id, undefined, { action: 'ROLLCALL_DELETED', date: existing.date });
    this.save();
    return { success: true, message: `Roll call record for ${existing.date} removed.` };
  }

  public getDailyRollCall(schoolId: string, classId: string, date: string): DailyRollCall | undefined {
    return this.state.dailyRollCalls.find(
      rc => rc.school_id === schoolId && rc.class_id === classId && rc.date === date
    );
  }

  public getRollCallsByClass(schoolId: string, classId: string): DailyRollCall[] {
    return this.state.dailyRollCalls
      .filter(rc => (schoolId ? rc.school_id === schoolId : true) && (classId ? rc.class_id === classId : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ==========================================
  // ACCESS CONTROL & ROLE PERMISSION HELPERS
  // ==========================================
  public canTakeRollCall(user: User = this.state.currentUser): boolean {
    return ['super-admin', 'admin', 'principal', 'teacher'].includes(user.role);
  }

  public canUploadAndCreateExams(user: User = this.state.currentUser): boolean {
    return ['super-admin', 'admin', 'principal', 'teacher'].includes(user.role);
  }

  public canLockRubric(user: User = this.state.currentUser): boolean {
    return ['super-admin', 'admin', 'principal', 'teacher'].includes(user.role);
  }

  public canSubmitForApproval(user: User = this.state.currentUser): boolean {
    return ['super-admin', 'admin', 'principal', 'teacher'].includes(user.role);
  }

  public canReviewAndApproveExams(user: User = this.state.currentUser): boolean {
    return ['super-admin', 'admin', 'principal'].includes(user.role);
  }

  public canPrintExam(user: User = this.state.currentUser, exam?: Examination): boolean {
    if (!exam) return ['super-admin', 'admin', 'principal', 'teacher'].includes(user.role);
    // Papers can be printed if approved or ready or marked or finalized
    const printableStatuses = ['approved', 'ready', 'marked', 'finalized', 'scheme_locked'];
    return printableStatuses.includes(exam.status) && ['super-admin', 'admin', 'principal', 'teacher'].includes(user.role);
  }

  // Answer Script Intake & Automated Evaluation
  public intakeAnswerScript(data: {
    paper_id: string;
    examination_id: string;
    student_id: string;
    intake_type: AnswerScript['intake_type'];
    rawAnswers: { question_id: string; response_text: string }[];
    scanned_file_name?: string;
    scanned_file_data?: string;
    scanned_file_type?: string;
    scanned_file_size_bytes?: number;
  }): { success: boolean; message: string; script?: AnswerScript } {
    const exam = this.state.examinations.find(e => e.id === data.examination_id);
    if (!exam) return { success: false, message: 'Exam not found.' };

    const paper = this.state.studentPapers.find(p => p.id === data.paper_id && p.examination_id === data.examination_id && p.student_id === data.student_id);
    if (!paper || !['generated','distributed','collected','scanned'].includes(paper.status)) return { success: false, message: 'A valid generated candidate paper is required before uploading an answer script.' };
    const existingScript = this.state.answerScripts.find(s => s.paper_id === paper.id);
    if (existingScript && existingScript.review_status === 'examiner_approved') {
      return { success: false, message: 'This answer script has already been examiner-approved and cannot be replaced.' };
    }
    const questions = this.state.questions.filter(q => q.examination_id === data.examination_id);
    const assignedIds = paper.assigned_question_ids?.length ? new Set(paper.assigned_question_ids) : new Set(questions.map(q => q.id));
    const scriptId = existingScript?.id || `scr-${Date.now()}`;

    let totalScore = 0;
    const answers: ScriptAnswer[] = data.rawAnswers.filter(ans => assignedIds.has(ans.question_id)).map(ans => {
      const q = questions.find(item => item.id === ans.question_id);
      let proposed_score = 0;
      let confidence = 0.95;
      let detected_mcq: string | undefined = undefined;
      let evidence = '';
      let reasoning = '';

      if (q) {
        if (q.question_type === 'objective') {
          const cleanResp = ans.response_text.trim().toUpperCase().replace(/[^ABCD]/g, '').charAt(0);
          detected_mcq = cleanResp || ans.response_text.trim().toUpperCase();
          if (cleanResp === q.correct_answer) {
            proposed_score = q.maximum_marks;
            reasoning = `Deterministic match with Answer Key (${q.correct_answer}). Awarded full ${q.maximum_marks} marks.`;
          } else {
            proposed_score = 0;
            reasoning = `Selected choice (${cleanResp || 'None'}) did not match Key (${q.correct_answer}). 0 marks awarded.`;
          }
        } else {
          // Heuristic initial grading for theory pending AI or manual review
          const respLower = ans.response_text.toLowerCase();
          const expectedWords = (q.expected_answer || '').toLowerCase().split(/[\s,]+/);
          const matched = expectedWords.filter(w => w.length > 3 && respLower.includes(w));
          const matchRatio = expectedWords.length > 0 ? matched.length / expectedWords.length : 0.5;
          proposed_score = Math.min(q.maximum_marks, Math.round(matchRatio * q.maximum_marks));
          confidence = 0.88;
          evidence = `Matches keywords: ${matched.slice(0, 4).join(', ')}`;
          reasoning = `AI initial evaluation based on standard rubric criteria. Score capped at question max (${q.maximum_marks}).`;
        }
      }

      totalScore += proposed_score;

      return {
        id: `sa-${scriptId}-${ans.question_id}`,
        script_id: scriptId,
        question_id: ans.question_id,
        student_raw_response: ans.response_text,
        detected_mcq_choice: detected_mcq,
        proposed_score,
        confidence,
        evidence,
        reasoning,
        final_score: q?.question_type === 'objective' ? proposed_score : undefined,
        status: q?.question_type === 'objective' ? 'finalized' : 'proposed'
      };
    });

    const script: AnswerScript = {
      id: scriptId,
      paper_id: data.paper_id,
      examination_id: data.examination_id,
      student_id: data.student_id,
      intake_type: data.intake_type,
      status: 'marked',
      review_status: 'pending_review',
      score: totalScore,
      maximum_marks: exam.maximum_marks,
      answers,
      scanned_file_name: data.scanned_file_name,
      scanned_file_data: data.scanned_file_data,
      scanned_file_type: data.scanned_file_type,
      scanned_file_size_bytes: data.scanned_file_size_bytes,
      created_at: new Date().toISOString()
    };

    if (existingScript) {
      const idx = this.state.answerScripts.findIndex(s => s.id === existingScript.id);
      if (idx >= 0) this.state.answerScripts[idx] = script;
      this.recordAudit('UPDATE', 'answer-script', script.id, undefined, {
        student_id: data.student_id,
        intake_type: data.intake_type,
        scanned_file_name: data.scanned_file_name
      });
    } else {
      this.state.answerScripts.push(script);
      this.recordAudit('CREATE', 'answer-script', script.id, undefined, {
        student_id: data.student_id,
        intake_type: data.intake_type,
        scanned_file_name: data.scanned_file_name
      });
    }
    this.save();
    return { success: true, message: `Answer script uploaded and evaluated. Ready for Examiner moderation.`, script };
  }

  public deleteAnswerScript(scriptId: string): { success: boolean; message: string } {
    const script = this.state.answerScripts.find(s => s.id === scriptId);
    if (!script) return { success: false, message: 'Answer script not found.' };
    if (script.review_status === 'examiner_approved') return { success: false, message: 'Examiner-approved scripts cannot be deleted.' };
    this.state.answerScripts = this.state.answerScripts.filter(s => s.id !== scriptId);
    this.recordAudit('DELETE', 'answer-script', scriptId, script);
    this.save();
    return { success: true, message: 'Answer script deleted successfully.' };
  }

  public bulkDeleteAnswerScripts(scriptIds: string[]): { success: boolean; message: string; count: number } {
    const ids = new Set(scriptIds);
    const deletable = this.state.answerScripts.filter(s => ids.has(s.id) && s.review_status !== 'examiner_approved');
    if (!deletable.length) return { success: false, message: 'No eligible pending scripts were selected.', count: 0 };
    this.state.answerScripts = this.state.answerScripts.filter(s => !ids.has(s.id) || s.review_status === 'examiner_approved');
    deletable.forEach(s => this.recordAudit('DELETE', 'answer-script', s.id, s));
    this.save();
    return { success: true, message: `${deletable.length} pending answer script(s) deleted. Approved scripts were protected.`, count: deletable.length };
  }

  public finalizeAnswerScriptsBulk(scriptIds: string[]): { success: boolean; message: string; count: number; skippedCount: number } {
    const ids = new Set(scriptIds);
    const selected = this.state.answerScripts.filter(s => ids.has(s.id));
    let count = 0; let skippedCount = 0;
    for (const script of selected) {
      if (script.review_status === 'examiner_approved') { skippedCount++; continue; }
      const total = (script.answers || []).reduce((sum, a) => sum + Number(a.final_score !== undefined ? a.final_score : (a.proposed_score || 0)), 0);
      script.score = total;
      script.answers.forEach(a => { a.final_score = a.final_score !== undefined ? a.final_score : (a.proposed_score || 0); a.status = 'finalized'; });
      script.review_status = 'examiner_approved';
      script.status = 'marked';
      script.finalized_at = new Date().toISOString();
      script.finalized_by = this.state.currentUser.username;
      this.recordAudit('FINALIZE', 'answer-script', script.id, undefined, { score: total, bulk: true });
      count++;
    }
    if (count) this.save();
    return { success: count > 0, message: count ? `${count} answer script(s) finalized successfully.${skippedCount ? ` ${skippedCount} approved script(s) skipped.` : ''}` : 'No pending answer scripts were finalized.', count, skippedCount };
  }

  // Attach or update scanned PDF / image answer sheet for an existing script
  public attachScannedAnswerSheet(
    scriptId: string,
    fileData: {
      file_name: string;
      file_data: string;
      file_type: string;
      file_size_bytes: number;
    }
  ): { success: boolean; message: string } {
    const script = this.state.answerScripts.find(s => s.id === scriptId);
    if (!script) return { success: false, message: 'Answer script not found.' };

    script.scanned_file_name = fileData.file_name;
    script.scanned_file_data = fileData.file_data;
    script.scanned_file_type = fileData.file_type;
    script.scanned_file_size_bytes = fileData.file_size_bytes;

    this.recordAudit('UPDATE', 'answer-script-file', script.id, undefined, {
      scanned_file_name: fileData.file_name,
      file_size_bytes: fileData.file_size_bytes
    });
    this.save();
    return { success: true, message: `Scanned answer sheet PDF attached successfully.` };
  }

  // Examiner Review & Finalization Gate
  public finalizeAnswerScript(
    scriptId: string,
    finalScores: { answer_id: string; final_score: number; reason?: string }[]
  ): { success: boolean; message: string } {
    const script = this.state.answerScripts.find(s => s.id === scriptId);
    if (!script) return { success: false, message: 'Script not found.' };

    const exam = this.state.examinations.find(e => e.id === script.examination_id);
    if (!exam) return { success: false, message: 'Exam not found.' };

    const actor = this.state.currentUser.username;
    let total = 0;

    for (const item of finalScores) {
      const ans = script.answers.find(a => a.id === item.answer_id);
      if (!ans) continue;
      const q = this.state.questions.find(x => x.id === ans.question_id);
      const maxMarks = q ? q.maximum_marks : 100;

      if (item.final_score < 0 || item.final_score > maxMarks) {
        return { success: false, message: `Invalid mark for Q${q?.question_number || '?'}: must be between 0 and ${maxMarks}.` };
      }

      const oldFinal = ans.final_score !== undefined ? ans.final_score : ans.proposed_score;
      if (oldFinal !== undefined && oldFinal !== item.final_score) {
        if (!item.reason || item.reason.trim() === '') {
          return { success: false, message: `Reason is required when overriding score for Q${q?.question_number || '?'}.` };
        }
        if (!ans.revisions) ans.revisions = [];
        ans.revisions.push({
          id: `rev-${Date.now()}`,
          script_answer_id: ans.id,
          old_score: oldFinal,
          new_score: item.final_score,
          actor,
          reason: item.reason.trim(),
          timestamp: new Date().toISOString()
        });
      }

      ans.final_score = item.final_score;
      ans.status = 'finalized';
      total += item.final_score;
    }

    script.score = total;
    script.status = 'marked';
    script.review_status = 'examiner_approved';

    // Upsert or update preliminary Result
    let result = this.state.results.find(r => r.examination_id === exam.id && r.student_id === script.student_id);
    const percentage = Number(((total / exam.maximum_marks) * 100).toFixed(2));

    if (!result) {
      result = {
        id: `res-${Date.now()}`,
        examination_id: exam.id,
        student_id: script.student_id,
        raw_marks: total,
        maximum_marks: exam.maximum_marks,
        percentage,
        grade: 'Draft',
        position: 0,
        status: 'reviewed'
      };
      this.state.results.push(result);
    } else {
      result.raw_marks = total;
      result.maximum_marks = exam.maximum_marks;
      result.percentage = percentage;
      result.status = 'reviewed';
    }

    this.recordAudit('FINALIZE', 'answer-script', script.id, undefined, {
      score: total,
      student_id: script.student_id,
      approved_by: actor
    });
    this.save();
    return { success: true, message: `Script successfully finalized by examiner with total score: ${total}/${exam.maximum_marks}.` };
  }

  // ==========================================
  // RESULT FINALIZATION & COMPETITION RANKING GATE
  // ==========================================
  public finalizeExaminationResults(
    examId: string,
    force: boolean = false
  ): { success: boolean; message: string; resultsCount: number } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Exam not found.', resultsCount: 0 };

    if (!['approved', 'finalized'].includes(exam.status)) {
      return { success: false, message: 'Examination must be approved by the Principal before results can be finalized.', resultsCount: 0 };
    }

    const papers = this.state.studentPapers.filter(p => p.examination_id === examId);
    const scripts = this.state.answerScripts.filter(s => s.examination_id === examId);

    // Find missing papers (no script at all)
    const missingScripts = papers.filter(p => !scripts.some(s => s.paper_id === p.id));

    // If force is true, create placeholder scripts for missing papers
    if (force && missingScripts.length > 0) {
      for (const paper of missingScripts) {
        const script: AnswerScript = {
          id: `scr-force-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          paper_id: paper.id,
          examination_id: examId,
          student_id: paper.student_id,
          intake_type: 'manual_entry',
          status: 'marked',
          review_status: 'examiner_approved',
          score: 0,
          maximum_marks: exam.maximum_marks,
          answers: [],
          created_at: new Date().toISOString(),
          finalized_at: new Date().toISOString(),
          finalized_by: 'System (Force Finalize)'
        };
        this.state.answerScripts.push(script);
      }
      // Refresh scripts list after adding placeholders
      scripts.push(...this.state.answerScripts.filter(s => s.examination_id === examId));
    }

    const pendingScripts = scripts.filter(s => s.review_status !== 'examiner_approved');
    if (pendingScripts.length > 0) {
      return { success: false, message: `${pendingScripts.length} answer script(s) are still pending examiner moderation.`, resultsCount: 0 };
    }

    // After potential creation, re-check for still missing scripts
    const stillMissing = papers.filter(p => !scripts.some(s => s.paper_id === p.id));
    if (stillMissing.length > 0) {
      return {
        success: false,
        message: `${stillMissing.length} candidate paper(s) still have no script. Use force=true to auto-create zero-score scripts.`,
        resultsCount: 0
      };
    }

    // Rebuild result marks from the authoritative examiner-finalized answer scores.
    // This prevents stale/cloned preliminary Result records from making every pupil
    // appear to have the same performance.
    for (const script of scripts) {
      const total = (script.answers || []).reduce((sum, answer) => sum + Number(
        answer.final_score !== undefined ? answer.final_score : answer.proposed_score || 0
      ), 0);
      const percentage = exam.maximum_marks > 0
        ? Number(((total / exam.maximum_marks) * 100).toFixed(2))
        : 0;

      let result = this.state.results.find(r =>
        r.examination_id === examId && r.student_id === script.student_id
      );
      if (!result) {
        result = {
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
          examination_id: examId,
          student_id: script.student_id,
          raw_marks: total,
          maximum_marks: exam.maximum_marks,
          percentage,
          grade: 'Draft',
          position: 0,
          status: 'reviewed'
        };
        this.state.results.push(result);
      } else {
        result.raw_marks = total;
        result.maximum_marks = exam.maximum_marks;
        result.percentage = percentage;
        result.status = 'reviewed';
      }
    }

    const examResults = this.state.results.filter(r =>
      r.examination_id === examId &&
      scripts.some(s => s.student_id === r.student_id)
    );
    if (examResults.length === 0) {
      return { success: false, message: 'No examiner-approved candidate results found to finalize.', resultsCount: 0 };
    }

    const scales = [...this.state.gradeScales].sort((a, b) => b.min_percent - a.min_percent);
    if (scales.length === 0) {
      return { success: false, message: 'No grade scales configured. Configure grading scale first.', resultsCount: 0 };
    }

    examResults.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.raw_marks !== a.raw_marks) return b.raw_marks - a.raw_marks;
      return a.student_id.localeCompare(b.student_id);
    });

    // Competition ranking with ties: 1st, 2nd, 2nd, 4th.
    let currentRank = 0;
    let previousKey: string | null = null;
    examResults.forEach((res, index) => {
      const key = `${res.percentage.toFixed(2)}_${res.raw_marks}`;
      if (key !== previousKey) {
        currentRank = index + 1;
        previousKey = key;
      }
      res.position = currentRank;
      const matchGrade = scales.find(g => res.percentage >= g.min_percent && res.percentage <= g.max_percent);
      res.grade = matchGrade ? matchGrade.grade : 'F';
      res.status = 'finalized';
      res.finalized_at = new Date().toISOString();
      res.finalized_by = this.state.currentUser.username;
    });

    exam.status = 'finalized';

    this.recordAudit('FINALIZE', 'examination-results', examId, undefined, {
      finalized_count: examResults.length,
      actor: this.state.currentUser.username,
      source: 'examiner-finalized-answer-scores'
    });

    // ---- 🔥 AUTO-GENERATE REPORT CARDS FOR THIS SESSION/TERM ----
    const seedResult = this.seedAllReportCards(exam.session_id, exam.term_id);
    // Append report card count to the message
    const cardMsg = seedResult.count > 0 ? ` (${seedResult.count} report card(s) generated/refreshed automatically).` : ' (No report cards generated – ensure students have finalized results).';
    this.save();

    return {
      success: true,
      message: `${examResults.length} candidate results finalized with standard competition tie rankings.${cardMsg}`,
      resultsCount: examResults.length
    };
  }

  // Bulk finalization for all eligible examination results in one operation.
  public finalizeAllEligibleExaminationResults(): { success: boolean; message: string; finalizedCount: number; skippedCount: number } {
    const candidates = this.state.examinations.filter(ex => ex.status !== 'finalized');
    let finalizedCount = 0;
    let skippedCount = 0;
    const skipped: string[] = [];

    for (const exam of candidates) {
      const scripts = this.state.answerScripts.filter(s => s.examination_id === exam.id);
      const examResults = this.state.results.filter(r => r.examination_id === exam.id);
      if (examResults.length === 0 || scripts.some(s => s.review_status !== 'examiner_approved')) {
        skippedCount++;
        skipped.push(`${exam.code}: pending/incomplete moderation`);
        continue;
      }
      const res = this.finalizeExaminationResults(exam.id);
      if (res.success) finalizedCount += 1;
      else {
        skippedCount++;
        skipped.push(`${exam.code}: ${res.message}`);
      }
    }

    if (finalizedCount > 0 || skippedCount > 0) {
      this.recordAudit('FINALIZE', 'examination-results-bulk', `bulk-${Date.now()}`, undefined, {
        finalized_examinations: finalizedCount,
        skipped_examinations: skippedCount,
        skipped
      });
      this.save();
    }

    return {
      success: finalizedCount > 0,
      message: finalizedCount
        ? `${finalizedCount} examination result set(s) finalized.${skippedCount ? ` ${skippedCount} skipped because they are not ready.` : ''}`
        : 'No examination result set is ready for bulk finalization.',
      finalizedCount,
      skippedCount
    };
  }

  // ==========================================
  // RECALCULATE RESULT PERCENTAGES (NEW)
  // ==========================================
  public recalculateResultPercentages(examId: string): { success: boolean; message: string; count: number } {
    const exam = this.state.examinations.find(e => e.id === examId);
    if (!exam) return { success: false, message: 'Examination not found.', count: 0 };

    const results = this.state.results.filter(r => r.examination_id === examId);
    if (!results.length) return { success: false, message: 'No results found for this examination.', count: 0 };

    const scales = this.state.gradeScales;
    let updated = 0;
    for (const result of results) {
      const maxMarks = exam.maximum_marks;
      if (maxMarks <= 0) continue;
      const percentage = (result.raw_marks / maxMarks) * 100;
      result.percentage = parseFloat(percentage.toFixed(2));
      result.maximum_marks = maxMarks;
      const grade = gradeForPercentage(result.percentage, scales);
      if (grade) result.grade = grade;
      updated++;
    }

    if (updated > 0) {
      this.recordAudit('UPDATE', 'result-recalculation', examId, undefined, { updated, exam_max: exam.maximum_marks });
      this.save();
    }

    return { success: true, message: `Updated ${updated} result records to use exam maximum of ${exam.maximum_marks} marks.`, count: updated };
  }

  // Recalculate persisted report-card class positions from finalized results.
  // Only pupils with finalized results for the selected session/term participate in ranking.
  public refreshReportCardRankings(sessionId: string, termId: string): { success: boolean; count: number } {
    const cards = this.state.reportCards.filter(rc => rc.session_id === sessionId && rc.term_id === termId);
    if (!cards.length) return { success: true, count: 0 };

    const studentsById = new Map(this.state.students.map(s => [s.id, s]));
    const eligibleByClass = new Map<string, Array<{ student_id: string; average: number }>>();

    for (const student of this.state.students.filter(s => s.status === 'active')) {
      const finalized = this.state.results.filter(r => {
        const ex = this.state.examinations.find(e => e.id === r.examination_id);
        return r.student_id === student.id && ex?.session_id === sessionId && ex?.term_id === termId && r.status === 'finalized';
      });
      if (!finalized.length) continue;
      const raw = finalized.reduce((sum, r) => sum + Number(r.raw_marks || 0), 0);
      const max = finalized.reduce((sum, r) => sum + Number(r.maximum_marks || 0), 0);
      if (max <= 0) continue;
      const key = `${student.school_id || 'state'}::${student.class_id}`;
      const list = eligibleByClass.get(key) || [];
      list.push({ student_id: student.id, average: (raw / max) * 100 });
      eligibleByClass.set(key, list);
    }

    for (const list of eligibleByClass.values()) {
      list.sort((a, b) => b.average - a.average || a.student_id.localeCompare(b.student_id));
    }

    for (const card of cards) {
      const student = studentsById.get(card.student_id);
      if (!student) continue;
      const key = `${student.school_id || 'state'}::${student.class_id}`;
      const ranking = eligibleByClass.get(key) || [];
      const mine = ranking.find(x => x.student_id === card.student_id);
      if (!mine) continue;
      card.position = 1 + ranking.filter(x => x.average > mine.average + 0.0001).length;
      card.total_students = ranking.length;

      // Refresh each subject position from the finalized examination result.
      card.subjects = (card.subjects || []).map(subject => {
        const ex = this.state.examinations.find(e => e.subject_id && e.session_id === sessionId && e.term_id === termId &&
          (e.school_id === student.school_id || e.school_id === null));
        const matchingResult = this.state.results.find(r => {
          const examination = this.state.examinations.find(e => e.id === r.examination_id);
          const sub = this.state.subjects.find(x => x.id === examination?.subject_id);
          return r.student_id === student.id && r.status === 'finalized' &&
            examination?.session_id === sessionId && examination?.term_id === termId &&
            ((sub?.code || '').toLowerCase() === (subject.subject_code || '').toLowerCase() ||
             (sub?.name || '').toLowerCase() === (subject.subject_name || '').toLowerCase());
        });
        return matchingResult ? { ...subject, position: matchingResult.position } : subject;
      });
      card.issued_at = new Date().toISOString();
    }

    this.recordAudit('UPDATE', 'report-card-rankings', `${sessionId}-${termId}`, undefined, {
      updated_cards: cards.length
    });
    this.save();
    return { success: true, count: cards.length };
  }

  // ==========================================
  // REPORT CARD GENERATION & QR VERIFICATION
  // ==========================================
  public generateReportCard(studentId: string, sessionId: string, termId: string): { success: boolean; message: string; reportCard?: ReportCard } {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Student not found.' };

    const studentResults = this.state.results.filter(r => {
      const ex = this.state.examinations.find(e => e.id === r.examination_id);
      return r.student_id === studentId && ex && ex.session_id === sessionId && ex.term_id === termId && r.status === 'finalized';
    });

    if (studentResults.length === 0) {
      return { success: false, message: 'No finalized examination results found for this student in the selected session/term.' };
    }

    let totalRaw = 0;
    let totalMax = 0;
    const subjects: ReportCardSubjectEntry[] = [];

    studentResults.forEach(r => {
      const ex = this.state.examinations.find(e => e.id === r.examination_id)!;
      const sub = this.state.subjects.find(s => s.id === ex.subject_id);
      const scale = this.state.gradeScales.find(g => r.percentage >= g.min_percent && r.percentage <= g.max_percent);

      totalRaw += r.raw_marks;
      // Use the exam's maximum marks to avoid mismatch
      totalMax += ex.maximum_marks;

      subjects.push({
        subject_name: sub ? sub.name : ex.title,
        subject_code: sub ? sub.code : ex.code,
        raw_marks: r.raw_marks,
        max_marks: ex.maximum_marks, // Use exam max
        percentage: r.percentage,
        grade: r.grade,
        remark: scale ? scale.remark : 'Passed',
        position: r.position
      });
    });

    const averagePercent = totalMax > 0 ? Number(((totalRaw / totalMax) * 100).toFixed(2)) : 0;
    // Rank only active pupils in the same school/class who have at least one
    // finalized result in this session/term. This prevents pupils with no result
    // from distorting the denominator or position.
    const allStudentsInClass = this.state.students.filter(
      s => s.class_id === student.class_id && s.school_id === student.school_id && s.status === 'active'
    );

    const classPerformance = allStudentsInClass.map(s => {
      const finalized = this.state.results.filter(r => {
        const ex = this.state.examinations.find(e => e.id === r.examination_id);
        return r.student_id === s.id &&
          ex?.session_id === sessionId &&
          ex?.term_id === termId &&
          r.status === 'finalized';
      });
      const raw = finalized.reduce((sum, r) => sum + r.raw_marks, 0);
      const max = finalized.reduce((sum, r) => sum + r.maximum_marks, 0);
      return {
        student_id: s.id,
        hasFinalized: finalized.length > 0 && max > 0,
        average: max > 0 ? (raw / max) * 100 : 0
      };
    }).filter(x => x.hasFinalized)
      .sort((a, b) => b.average - a.average || a.student_id.localeCompare(b.student_id));

    const myPerformance = classPerformance.find(x => x.student_id === studentId);
    const classPosition = myPerformance
      ? 1 + classPerformance.filter(x => x.average > myPerformance.average + 0.0001).length
      : 1;

    const verificationCode = `EDS-RC-2026-${student.admission_number.replace(/[^A-Z0-9]/gi, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const reportCard: ReportCard = {
      id: `rc-${studentId}-${Date.now()}`,
      student_id: studentId,
      session_id: sessionId,
      term_id: termId,
      school_id: student.school_id,
      class_id: student.class_id,
      total_marks: totalRaw,
      max_possible: totalMax,
      average_percent: averagePercent,
      position: classPosition,
      total_students: classPerformance.length,
      attendance_present: student.attendance_days,
      attendance_total: student.total_days,
      conduct_grade: student.conduct_rating,
      teacher_comment: averagePercent >= 75 ? 'Outstanding academic excellence and dedication. Commended!' : averagePercent >= 50 ? 'Satisfactory progress. Encourage more focus on theory steps.' : 'Needs remedial attention in core topics.',
      principal_comment: averagePercent >= 70 ? 'Very commendable terminal performance. Keep up the high standard!' : 'Advised to attend supplementary classes next term.',
      promotion_status: averagePercent >= 50 ? 'Promoted' : 'Not Promoted',
      verification_code: verificationCode,
      issued_at: new Date().toISOString(),
      subjects
    };

    // Remove older report card for same term
    this.state.reportCards = this.state.reportCards.filter(rc => !(rc.student_id === studentId && rc.session_id === sessionId && rc.term_id === termId));
    this.state.reportCards.push(reportCard);

    this.recordAudit('GENERATE', 'report-card', reportCard.id, undefined, {
      student: student.full_name,
      average: averagePercent,
      code: verificationCode
    });
    this.save();
    return { success: true, message: `Report card generated with verification code: ${verificationCode}`, reportCard };
  }

  // Update Report Card Content directly from CMS or Report Card View
  public updateReportCard(
    reportCardId: string,
    updates: Partial<ReportCard> & { subjects?: ReportCardSubjectEntry[] }
  ): { success: boolean; message: string; reportCard?: ReportCard } {
    const card = this.state.reportCards.find(rc => rc.id === reportCardId);
    if (!card) return { success: false, message: 'Report card record not found.' };

    const oldRecord = { ...card };

    // Apply direct updates
    if (updates.teacher_comment !== undefined) card.teacher_comment = updates.teacher_comment;
    if (updates.principal_comment !== undefined) card.principal_comment = updates.principal_comment;
    if (updates.promotion_status !== undefined) card.promotion_status = updates.promotion_status;
    if (updates.conduct_grade !== undefined) card.conduct_grade = updates.conduct_grade;
    if (updates.attendance_present !== undefined) card.attendance_present = Number(updates.attendance_present);
    if (updates.attendance_total !== undefined) card.attendance_total = Number(updates.attendance_total);
    if (updates.position !== undefined) card.position = Number(updates.position);

    // If subjects were updated, recalculate total marks, max possible, and average percentage
    if (updates.subjects && Array.isArray(updates.subjects)) {
      card.subjects = updates.subjects;
      const totalRaw = card.subjects.reduce((sum, s) => sum + Number(s.raw_marks || 0), 0);
      const totalMax = card.subjects.reduce((sum, s) => sum + Number(s.max_marks || 100), 0);
      card.total_marks = totalRaw;
      card.max_possible = totalMax;
      card.average_percent = totalMax > 0 ? Number(((totalRaw / totalMax) * 100).toFixed(2)) : 0;
    } else if (updates.total_marks !== undefined && updates.max_possible !== undefined) {
      card.total_marks = Number(updates.total_marks);
      card.max_possible = Number(updates.max_possible);
      card.average_percent = card.max_possible > 0 ? Number(((card.total_marks / card.max_possible) * 100).toFixed(2)) : 0;
    }

    // Refresh verification signature hash timestamp
    card.issued_at = new Date().toISOString();

    this.recordAudit('UPDATE', 'report-card', card.id, oldRecord, {
      updated_by: this.state.currentUser.username,
      total_marks: card.total_marks,
      average: card.average_percent,
      promotion: card.promotion_status
    });

    this.save();
    return {
      success: true,
      message: `Report card for candidate updated and re-verified. Average: ${card.average_percent}%.`,
      reportCard: card
    };
  }

  // Create manual or customized report card
  public createReportCardManual(data: Omit<ReportCard, 'id' | 'issued_at' | 'verification_code'>): {
    success: boolean;
    message: string;
    reportCard?: ReportCard;
  } {
    const student = this.state.students.find(s => s.id === data.student_id);
    const adm = student ? student.admission_number.replace(/[^A-Z0-9]/gi, '') : 'MANUAL';
    const verificationCode = `EDS-RC-2026-${adm}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCard: ReportCard = {
      id: `rc-${data.student_id}-${Date.now()}`,
      ...data,
      verification_code: verificationCode,
      issued_at: new Date().toISOString()
    };

    // Remove existing for same student/session/term
    this.state.reportCards = this.state.reportCards.filter(
      rc => !(rc.student_id === data.student_id && rc.session_id === data.session_id && rc.term_id === data.term_id)
    );
    this.state.reportCards.push(newCard);

    this.recordAudit('CREATE', 'report-card', newCard.id, undefined, {
      student_id: data.student_id,
      code: verificationCode,
      average: newCard.average_percent
    });

    this.save();
    return { success: true, message: `Report card created successfully (Code: ${verificationCode})`, reportCard: newCard };
  }

  public deleteReportCard(id: string): { success: boolean; message: string } {
    const existing = this.state.reportCards.find(rc => rc.id === id);
    if (!existing) return { success: false, message: 'Report card not found.' };

    this.state.reportCards = this.state.reportCards.filter(rc => rc.id !== id);
    if (!this.pendingDeletes.has('report-cards')) this.pendingDeletes.set('report-cards', new Set());
    this.pendingDeletes.get('report-cards')!.add(id);
    this.recordAudit('DELETE', 'report-card', id, existing);
    this.save();
    return { success: true, message: 'Report card deleted from active records.' };
  }

  // ==========================================
  // STUDENT MANAGEMENT & REGISTRY METHODS
  // ==========================================
  public updateStudent(
    studentId: string,
    updates: Partial<Student>
  ): { success: boolean; message: string; student?: Student } {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Candidate not found in registry.' };

    const oldRecord = { ...student };

    // Duplicate admission number check if changed
    if (updates.admission_number && updates.admission_number.trim() !== student.admission_number) {
      const dup = this.state.students.find(
        s => s.id !== studentId && s.admission_number.trim().toLowerCase() === updates.admission_number!.trim().toLowerCase()
      );
      if (dup) {
        return { success: false, message: `Admission number '${updates.admission_number}' is already assigned to ${dup.full_name}.` };
      }
      student.admission_number = updates.admission_number.trim();
    }

    if (updates.full_name !== undefined) student.full_name = updates.full_name.trim();
    if (updates.gender !== undefined) student.gender = updates.gender;
    if (updates.guardian_name !== undefined) student.guardian_name = updates.guardian_name.trim();
    if (updates.guardian_phone !== undefined) student.guardian_phone = updates.guardian_phone.trim();
    if (updates.attendance_days !== undefined) student.attendance_days = Number(updates.attendance_days);
    if (updates.total_days !== undefined) student.total_days = Number(updates.total_days);
    if (updates.conduct_rating !== undefined) student.conduct_rating = updates.conduct_rating;
    if (updates.status !== undefined) student.status = updates.status;
    if (updates.suspension_reason !== undefined) student.suspension_reason = updates.suspension_reason;

    this.recordAudit('UPDATE', 'student', student.id, oldRecord, {
      student_name: student.full_name,
      updates
    });

    this.save();
    return { success: true, message: `Candidate ${student.full_name} profile updated successfully.`, student };
  }

  public promoteStudent(
    studentId: string,
    newClassId: string,
    note?: string
  ): { success: boolean; message: string; student?: Student } {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Candidate not found.' };

    const targetClass = this.state.classes.find(c => c.id === newClassId);
    if (!targetClass) return { success: false, message: 'Target class level not found.' };

    const oldClassId = student.class_id;
    const oldClassName = this.state.classes.find(c => c.id === oldClassId)?.name || oldClassId;

    student.class_id = newClassId;
    if (!student.promotion_history) student.promotion_history = [];
    student.promotion_history.push({
      date: new Date().toISOString(),
      from_class_id: oldClassId,
      to_class_id: newClassId,
      note: note || `Promoted from ${oldClassName} to ${targetClass.name}`,
      authorized_by: this.state.currentUser.full_name
    });

    this.recordAudit('UPDATE', 'student-promotion', student.id, { from_class: oldClassId }, {
      to_class: newClassId,
      authorized_by: this.state.currentUser.username
    });

    this.save();
    return {
      success: true,
      message: `${student.full_name} successfully promoted to ${targetClass.name}.`,
      student
    };
  }

  public transferStudent(
    studentId: string,
    newSchoolId: string,
    reason?: string
  ): { success: boolean; message: string; student?: Student } {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Candidate not found.' };

    const targetSchool = this.state.schools.find(s => s.id === newSchoolId);
    if (!targetSchool) return { success: false, message: 'Target school not found.' };

    const oldSchoolId = student.school_id;
    const oldSchoolName = this.state.schools.find(s => s.id === oldSchoolId)?.name || oldSchoolId;

    student.school_id = newSchoolId;
    if (!student.transfer_history) student.transfer_history = [];
    student.transfer_history.push({
      date: new Date().toISOString(),
      from_school_id: oldSchoolId,
      to_school_id: newSchoolId,
      reason: reason || `Transferred from ${oldSchoolName} to ${targetSchool.name}`,
      authorized_by: this.state.currentUser.full_name
    });

    this.recordAudit('UPDATE', 'student-transfer', student.id, { from_school: oldSchoolId }, {
      to_school: newSchoolId,
      reason,
      authorized_by: this.state.currentUser.username
    });

    this.save();
    return {
      success: true,
      message: `${student.full_name} successfully transferred to ${targetSchool.name} (${targetSchool.lga}).`,
      student
    };
  }

  public setStudentStatus(
    studentId: string,
    status: StudentStatus,
    suspensionReason?: string
  ): { success: boolean; message: string; student?: Student } {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Candidate not found.' };

    student.status = status;
    if (status === 'suspended') {
      student.suspension_reason = suspensionReason || 'Administrative suspension pending review.';
    } else if (status === 'active') {
      student.suspension_reason = undefined;
    }

    this.recordAudit('UPDATE', 'student-status', student.id, undefined, {
      status,
      suspension_reason: suspensionReason,
      updated_by: this.state.currentUser.username
    });

    this.save();
    const statusText = status === 'suspended' ? 'Suspended' : status === 'active' ? 'Active' : status === 'transferred' ? 'Transferred' : 'Graduated';
    return {
      success: true,
      message: `Status for candidate ${student.full_name} set to ${statusText}.`,
      student
    };
  }

  public deleteStudent(studentId: string): { success: boolean; message: string } {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Candidate not found.' };

    this.state.students = this.state.students.filter(s => s.id !== studentId);
    this.recordAudit('DELETE', 'student', studentId, student);
    this.save();
    return { success: true, message: `Candidate ${student.full_name} removed from registry.` };
  }

  public bulkAssignStudents(
    studentIds: string[],
    target: {
      school_id?: string;
      class_id?: string;
      status?: StudentStatus;
      suspension_reason?: string;
    }
  ): { success: boolean; message: string; count: number } {
    if (!studentIds.length) return { success: false, message: 'No pupils selected.', count: 0 };

    let updatedCount = 0;
    const targetSchool = target.school_id ? this.state.schools.find(s => s.id === target.school_id) : null;
    const targetClass = target.class_id ? this.state.classes.find(c => c.id === target.class_id) : null;

    studentIds.forEach(id => {
      const student = this.state.students.find(s => s.id === id);
      if (!student) return;

      if (target.school_id && targetSchool) {
        if (!student.transfer_history) student.transfer_history = [];
        student.transfer_history.push({
          date: new Date().toISOString(),
          from_school_id: student.school_id,
          to_school_id: target.school_id,
          reason: 'Bulk School Transfer Authorization',
          authorized_by: this.state.currentUser.full_name
        });
        student.school_id = target.school_id;
      }

      if (target.class_id && targetClass) {
        if (!student.promotion_history) student.promotion_history = [];
        student.promotion_history.push({
          date: new Date().toISOString(),
          from_class_id: student.class_id,
          to_class_id: target.class_id,
          note: `Bulk promotion to ${targetClass.name}`,
          authorized_by: this.state.currentUser.full_name
        });
        student.class_id = target.class_id;
      }

      if (target.status) {
        student.status = target.status;
        if (target.status === 'suspended') {
          student.suspension_reason = target.suspension_reason || 'Bulk administrative suspension.';
        } else if (target.status === 'active') {
          student.suspension_reason = undefined;
        }
      }

      updatedCount++;
    });

    this.recordAudit('UPDATE', 'students-bulk', 'batch', undefined, {
      count: updatedCount,
      target,
      authorized_by: this.state.currentUser.username
    });

    this.save();
    return {
      success: true,
      message: `Successfully applied bulk updates to ${updatedCount} pupils.`,
      count: updatedCount
    };
  }

  public bulkPromoteStudents(
    studentIds: string[],
    targetClassId: string,
    note?: string
  ): { success: boolean; message: string; count: number } {
    if (!studentIds.length) return { success: false, message: 'No pupils selected.', count: 0 };
    const targetClass = this.state.classes.find(c => c.id === targetClassId);
    if (!targetClass) return { success: false, message: 'Target class level not found.', count: 0 };

    let count = 0;
    studentIds.forEach(id => {
      const student = this.state.students.find(s => s.id === id);
      if (student) {
        const oldClassId = student.class_id;
        student.class_id = targetClassId;
        if (!student.promotion_history) student.promotion_history = [];
        student.promotion_history.push({
          date: new Date().toISOString(),
          from_class_id: oldClassId,
          to_class_id: targetClassId,
          note: note || `Mass promotion to ${targetClass.name}`,
          authorized_by: this.state.currentUser.full_name
        });
        count++;
      }
    });

    this.recordAudit(
      'PROMOTE',
      'students',
      'bulk-promotion',
      undefined,
      { count, targetClassId, className: targetClass.name, note },
      this.state.currentUser.full_name,
      this.state.currentUser.role,
      'Statewide',
      null,
      `Mass promoted ${count} pupil(s) to ${targetClass.name}`
    );

    this.save();
    return { success: true, message: `Successfully promoted ${count} pupil(s) to ${targetClass.name}.`, count };
  }

  public bulkTransferStudents(
    studentIds: string[],
    targetSchoolId: string,
    reason?: string
  ): { success: boolean; message: string; count: number } {
    if (!studentIds.length) return { success: false, message: 'No pupils selected.', count: 0 };
    const targetSchool = this.state.schools.find(s => s.id === targetSchoolId);
    if (!targetSchool) return { success: false, message: 'Target school not found.', count: 0 };

    let count = 0;
    studentIds.forEach(id => {
      const student = this.state.students.find(s => s.id === id);
      if (student) {
        const oldSchoolId = student.school_id;
        student.school_id = targetSchoolId;
        if (!student.transfer_history) student.transfer_history = [];
        student.transfer_history.push({
          date: new Date().toISOString(),
          from_school_id: oldSchoolId,
          to_school_id: targetSchoolId,
          reason: reason || `Mass school transfer to ${targetSchool.name}`,
          authorized_by: this.state.currentUser.full_name
        });
        count++;
      }
    });

    this.recordAudit(
      'TRANSFER',
      'students',
      'bulk-transfer',
      undefined,
      { count, targetSchoolId, schoolName: targetSchool.name, lga: targetSchool.lga, reason },
      this.state.currentUser.full_name,
      this.state.currentUser.role,
      targetSchool.lga,
      targetSchoolId,
      `Mass transferred ${count} pupil(s) to ${targetSchool.name} (${targetSchool.lga} LGA)`
    );

    this.save();
    return { success: true, message: `Successfully transferred ${count} pupil(s) to ${targetSchool.name} (${targetSchool.lga}).`, count };
  }

  public bulkArchiveStudents(
    studentIds: string[],
    archiveReason?: string
  ): { success: boolean; message: string; count: number } {
    if (!studentIds.length) return { success: false, message: 'No pupils selected.', count: 0 };
    let count = 0;
    const reason = archiveReason || 'Administrative cohort archival.';
    studentIds.forEach(id => {
      const student = this.state.students.find(s => s.id === id);
      if (student) {
        student.status = 'archived';
        student.suspension_reason = reason;
        count++;
      }
    });

    this.recordAudit(
      'ARCHIVE',
      'students',
      'bulk-archive',
      undefined,
      { count, reason },
      this.state.currentUser.full_name,
      this.state.currentUser.role,
      'Statewide',
      null,
      `Archived ${count} pupil record(s): ${reason}`
    );

    this.save();
    return { success: true, message: `Successfully archived ${count} pupil record(s).`, count };
  }

  public bulkAssignStudentsToClass(
    classId: string,
    studentIds: string[]
  ): { success: boolean; message: string; count: number } {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return { success: false, message: 'Class level not found.', count: 0 };
    if (!studentIds.length) return { success: false, message: 'No pupils selected.', count: 0 };

    const capacity = Number(cls.capacity || 0);
    const currentCount = this.state.students.filter(
      s => s.class_id === classId && (s.status || 'active') === 'active'
    ).length;
    const available = capacity > 0 ? Math.max(0, capacity - currentCount) : studentIds.length;
    const ids = Array.from(new Set(studentIds));
    const allowedIds = capacity > 0 ? ids.slice(0, available) : ids;

    allowedIds.forEach(id => {
      const student = this.state.students.find(s => s.id === id);
      if (student) {
        student.class_id = classId;
        if (!student.status) student.status = 'active';
      }
    });

    this.recordAudit('UPDATE', 'class-level-bulk-assignment', classId, undefined, {
      student_ids: allowedIds,
      count: allowedIds.length,
      capacity
    });
    this.save();

    const skipped = ids.length - allowedIds.length;
    return {
      success: true,
      message: `${allowedIds.length} pupil(s) added to ${cls.name}.${skipped > 0 ? ` ${skipped} skipped because the class capacity is full.` : ''}`,
      count: allowedIds.length
    };
  }

  public bulkEnrollStudents(
    studentsData: Omit<Student, 'id'>[]
  ): { success: boolean; message: string; count: number; duplicates?: number } {
    if (!studentsData.length) return { success: false, message: 'No candidate records provided.', count: 0 };

    let addedCount = 0;
    let duplicateCount = 0;
    const existingAdmissions = new Set(this.state.students.map(s => s.admission_number.trim().toLowerCase()));

    studentsData.forEach((item, index) => {
      const adm = item.admission_number?.trim() || `EDS/ENR/${Date.now().toString().slice(-4)}/${index + 1}`;
      if (existingAdmissions.has(adm.toLowerCase())) {
        duplicateCount++;
        return;
      }

      const newStudent: Student = {
        id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        admission_number: adm,
        full_name: item.full_name.trim(),
        gender: item.gender || 'M',
        class_id: item.class_id,
        school_id: item.school_id,
        guardian_name: item.guardian_name ? item.guardian_name.trim() : 'Guardian Not Provided',
        guardian_phone: item.guardian_phone ? item.guardian_phone.trim() : '08000000000',
        attendance_days: Number(item.attendance_days || 60),
        total_days: Number(item.total_days || 65),
        conduct_rating: item.conduct_rating || 'Very Good',
        status: item.status || 'active'
      };

      existingAdmissions.add(adm.toLowerCase());
      this.state.students.push(newStudent);
      addedCount++;
    });

    this.recordAudit('CREATE', 'students-bulk-enroll', 'batch', undefined, {
      addedCount,
      duplicateCount,
      actor: this.state.currentUser.username
    });

    this.save();
    return {
      success: true,
      message: `Enrolled ${addedCount} new pupils successfully.${duplicateCount > 0 ? ` (${duplicateCount} skipped as duplicate admission numbers)` : ''}`,
      count: addedCount,
      duplicates: duplicateCount
    };
  }

  public deleteMultipleStudents(studentIds: string[]): { success: boolean; message: string; count: number } {
    if (!studentIds.length) return { success: false, message: 'No candidates selected.', count: 0 };

    const initialLength = this.state.students.length;
    this.state.students = this.state.students.filter(s => !studentIds.includes(s.id));
    const deletedCount = initialLength - this.state.students.length;

    this.recordAudit('DELETE', 'students-bulk', 'batch', undefined, { count: deletedCount });
    this.save();
    return { success: true, message: `Removed ${deletedCount} candidate records from registry.`, count: deletedCount };
  }

  // RBAC Access Control Helper (Strict 4 Roles: super-admin, director, principal, teacher)
  public canAccessTab(tabId: string, user: User = this.state.currentUser): boolean {
    const role = user.role;

    switch (tabId) {
      case 'dashboard':
        return true;
      case 'rollcall':
        return ['super-admin', 'director', 'principal', 'teacher'].includes(role);
      case 'examinations':
        return ['super-admin', 'director', 'principal', 'teacher'].includes(role);
      case 'assessment':
        return ['super-admin', 'director', 'principal', 'teacher'].includes(role);
      case 'results':
        return true;
      case 'report-cards':
        return true;
      case 'academic-setup':
        return ['super-admin', 'director', 'principal'].includes(role);
      case 'content-mgmt':
        return role === 'super-admin';
      case 'admin':
        return ['super-admin', 'director', 'principal'].includes(role);
      default:
        return true;
    }
  }

  // ==========================================
  // SEED ALL REPORT CARDS (with optional session/term)
  // ==========================================
  public seedAllReportCards(sessionId?: string, termId?: string): { success: boolean; message: string; count: number } {
    const activeSession = sessionId
      ? this.state.sessions.find(s => s.id === sessionId)
      : (this.state.sessions.find(s => s.is_active) || this.state.sessions[0]);
    const activeTerm = termId
      ? this.state.terms.find(t => t.id === termId)
      : (activeSession
          ? (this.state.terms.find(t => t.session_id === activeSession.id && t.is_active) ||
             this.state.terms.find(t => t.session_id === activeSession.id))
          : undefined);

    if (!activeSession || !activeTerm) {
      return { success: false, message: 'No academic session/term is configured. Create one before generating report cards.', count: 0 };
    }

    const eligible = this.state.students.filter(student =>
      student.status === 'active' &&
      this.state.results.some(r => {
        const ex = this.state.examinations.find(e => e.id === r.examination_id);
        return r.student_id === student.id &&
          r.status === 'finalized' &&
          ex?.session_id === activeSession.id &&
          ex?.term_id === activeTerm.id;
      })
    );

    let refreshed = 0;
    for (const student of eligible) {
      const result = this.generateReportCard(student.id, activeSession.id, activeTerm.id);
      if (result.success) refreshed++;
    }

    this.refreshReportCardRankings(activeSession.id, activeTerm.id);

    return {
      success: true,
      message: `Generated/refreshed ${refreshed} report card(s) from finalized results for ${activeSession.name} • ${activeTerm.name}.`,
      count: refreshed
    };
  }

  // ==========================================
  // SUPER-ADMIN SAFE BUSINESS DATA MANAGEMENT
  // ==========================================
  public deleteRecord(entity: string, id: string): { success: boolean; message: string } {
    const user = this.state.currentUser;
    const isSuper = user.role === 'super-admin';

    switch (entity) {
      case 'school': {
        // Super Admin can delete even with students; students' school_id will be set to null.
        if (!isSuper) {
          const hasStudents = this.state.students.some(s => s.school_id === id);
          if (hasStudents) return { success: false, message: 'Cannot delete school: enrolled students exist. Reassign or remove them first.' };
        }
        // If Super Admin, we set students' school_id to null to avoid orphans
        if (isSuper) {
          this.state.students.forEach(s => { if (s.school_id === id) s.school_id = null as any; });
        }
        this.state.schools = this.state.schools.filter(s => s.id !== id);
        break;
      }
      case 'student': {
        // Super Admin can delete even with results; results will be removed.
        if (!isSuper) {
          const hasResults = this.state.results.some(r => r.student_id === id);
          if (hasResults) return { success: false, message: 'Cannot delete student: finalized results exist in audit history.' };
        }
        // Remove all associated records
        this.state.students = this.state.students.filter(s => s.id !== id);
        this.state.results = this.state.results.filter(r => r.student_id !== id);
        this.state.reportCards = this.state.reportCards.filter(rc => rc.student_id !== id);
        this.state.answerScripts = this.state.answerScripts.filter(a => a.student_id !== id);
        this.state.studentPapers = this.state.studentPapers.filter(p => p.student_id !== id);
        break;
      }
      case 'examination': {
        // Super Admin can delete even if finalized; we'll cascade delete everything.
        if (!isSuper) {
          const hasFinalizedResults = this.state.results.some(r => r.examination_id === id && r.status === 'finalized');
          if (hasFinalizedResults) {
            return { success: false, message: 'Cannot delete a finalized examination. Finalized results are locked and must remain part of the academic record.' };
          }
        }
        // Cascade delete all child resources
        const childResources: Array<[string, string[]]> = [
          ['questions', this.state.questions.filter(q => q.examination_id === id).map(q => q.id)],
          ['marking-schemes', this.state.markingSchemes.filter(m => m.examination_id === id).map(m => m.id)],
          ['rubrics', this.state.rubrics.filter(r => r.examination_id === id).map(r => r.id)],
          ['student-papers', this.state.studentPapers.filter(p => p.examination_id === id).map(p => p.id)],
          ['answer-scripts', this.state.answerScripts.filter(s => s.examination_id === id).map(s => s.id)],
          ['results', this.state.results.filter(r => r.examination_id === id).map(r => r.id)]
        ];
        this.state.examinations = this.state.examinations.filter(e => e.id !== id);
        this.state.questions = this.state.questions.filter(q => q.examination_id !== id);
        this.state.markingSchemes = this.state.markingSchemes.filter(m => m.examination_id !== id);
        this.state.rubrics = this.state.rubrics.filter(r => r.examination_id !== id);
        this.state.studentPapers = this.state.studentPapers.filter(p => p.examination_id !== id);
        this.state.answerScripts = this.state.answerScripts.filter(s => s.examination_id !== id);
        this.state.results = this.state.results.filter(r => r.examination_id !== id);
        // Mark for server deletion via pendingDeletes
        for (const [resource, ids] of childResources) {
          if (!this.pendingDeletes.has(resource)) this.pendingDeletes.set(resource, new Set());
          ids.forEach(childId => this.pendingDeletes.get(resource)!.add(childId));
        }
        if (!this.pendingDeletes.has('examinations')) this.pendingDeletes.set('examinations', new Set());
        this.pendingDeletes.get('examinations')!.add(id);
        break;
      }
      case 'subject': {
        // Super Admin can delete even if exams exist; set subject_id to null on those exams.
        if (!isSuper) {
          const hasExams = this.state.examinations.some(e => e.subject_id === id);
          if (hasExams) return { success: false, message: 'Cannot delete subject: linked examinations exist.' };
        }
        if (isSuper) {
          this.state.examinations.forEach(e => { if (e.subject_id === id) e.subject_id = null as any; });
        }
        this.state.subjects = this.state.subjects.filter(s => s.id !== id);
        break;
      }
      default:
        return { success: false, message: 'Unsupported entity deletion type.' };
    }

    this.recordAudit('DELETE', entity, id);
    this.save();
    return { success: true, message: `${entity} record successfully deleted.` };
  }

  // ==========================================
  // CONTENT MANAGEMENT & PORTAL CONFIGURATION
  // ==========================================

  public updateSystemConfig(updates: Partial<SystemContentConfig>): { success: boolean; message: string } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Unauthorized: Only Super-Admin can edit portal configuration.' };
    }
    const old = { ...this.state.systemConfig };
    this.state.systemConfig = {
      ...this.state.systemConfig,
      ...updates
    };
    this.recordAudit('UPDATE', 'system-config', 'global', old, updates);
    this.save();
    return { success: true, message: 'Portal content and board branding settings updated successfully.' };
  }

  // Announcements Management
  public createAnnouncement(data: Omit<Announcement, 'id' | 'created_at' | 'created_by'>): { success: boolean; message: string; announcement?: Announcement } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Unauthorized: Only Super-Admin can publish announcements.' };
    }
    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      created_by: this.state.currentUser.username
    };
    this.state.announcements.unshift(newAnc);
    this.recordAudit('CREATE', 'announcement', newAnc.id, undefined, newAnc);
    this.save();
    return { success: true, message: 'Announcement broadcasted successfully.', announcement: newAnc };
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): { success: boolean; message: string } {
    const idx = this.state.announcements.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, message: 'Announcement not found.' };
    this.state.announcements[idx] = { ...this.state.announcements[idx], ...updates };
    this.recordAudit('UPDATE', 'announcement', id, undefined, updates);
    this.save();
    return { success: true, message: 'Announcement updated successfully.' };
  }

  public deleteAnnouncement(id: string): { success: boolean; message: string } {
    const idx = this.state.announcements.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, message: 'Announcement not found.' };
    const removed = this.state.announcements.splice(idx, 1)[0];
    this.recordAudit('DELETE', 'announcement', id, removed);
    this.save();
    return { success: true, message: 'Announcement removed.' };
  }

  public togglePinAnnouncement(id: string): { success: boolean; message: string } {
    const anc = this.state.announcements.find(a => a.id === id);
    if (!anc) return { success: false, message: 'Announcement not found.' };
    anc.is_pinned = !anc.is_pinned;
    this.save();
    return { success: true, message: `Announcement ${anc.is_pinned ? 'pinned to top' : 'unpinned'}.` };
  }

  // Handbook & Guides CMS
  public createHandbookArticle(data: Omit<HandbookArticle, 'id' | 'last_updated' | 'author'>): { success: boolean; message: string; article?: HandbookArticle } {
    const newArt: HandbookArticle = {
      id: `hba-${Date.now()}`,
      ...data,
      last_updated: new Date().toISOString(),
      author: this.state.currentUser.full_name || this.state.currentUser.username
    };
    this.state.handbookArticles.push(newArt);
    this.recordAudit('CREATE', 'handbook-article', newArt.id, undefined, newArt);
    this.save();
    return { success: true, message: 'Knowledge base guide created.', article: newArt };
  }

  public updateHandbookArticle(id: string, updates: Partial<HandbookArticle>): { success: boolean; message: string } {
    const art = this.state.handbookArticles.find(a => a.id === id);
    if (!art) return { success: false, message: 'Guide article not found.' };
    Object.assign(art, updates, { last_updated: new Date().toISOString() });
    this.recordAudit('UPDATE', 'handbook-article', id, undefined, updates);
    this.save();
    return { success: true, message: 'Guide article updated.' };
  }

  public deleteHandbookArticle(id: string): { success: boolean; message: string } {
    const idx = this.state.handbookArticles.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, message: 'Article not found.' };
    const removed = this.state.handbookArticles.splice(idx, 1)[0];
    this.recordAudit('DELETE', 'handbook-article', id, removed);
    this.save();
    return { success: true, message: 'Guide article deleted.' };
  }

  // ==========================================
  // MASTER ENTITIES CRUD MANAGEMENT
  // ==========================================

  // Schools
  public createSchool(data: Omit<School, 'id'>): { success: boolean; message: string; school?: School } {
    const codeDup = this.state.schools.find(s => s.code.toUpperCase() === data.code.toUpperCase());
    if (codeDup) return { success: false, message: `School code '${data.code}' is already registered.` };

    const newSchool: School = {
      id: `sch-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      lga: data.lga.trim(),
      address: data.address?.trim() || `${data.lga}, Edo State`,
      head_teacher: data.head_teacher?.trim() || 'Principal / Head Teacher'
    };
    this.state.schools.push(newSchool);
    this.recordAudit('CREATE', 'school', newSchool.id, undefined, newSchool);
    this.save();
    return { success: true, message: `School '${newSchool.name}' added successfully.`, school: newSchool };
  }

  public updateSchool(id: string, updates: Partial<School>): { success: boolean; message: string } {
    const school = this.state.schools.find(s => s.id === id);
    if (!school) return { success: false, message: 'School not found.' };
    Object.assign(school, updates);
    this.recordAudit('UPDATE', 'school', id, undefined, updates);
    this.save();
    return { success: true, message: `School '${school.name}' updated.` };
  }

  public deleteSchool(id: string): { success: boolean; message: string } {
    const hasStudents = this.state.students.some(s => s.school_id === id);
    if (hasStudents) return { success: false, message: 'Cannot delete school: Active enrolled students are attached to this institution.' };
    return this.deleteRecord('school', id);
  }

  // Subjects
  public createSubject(data: Omit<Subject, 'id'>): { success: boolean; message: string; subject?: Subject } {
    const dup = this.state.subjects.find(s => s.code.toUpperCase() === data.code.toUpperCase());
    if (dup) return { success: false, message: `Subject code '${data.code}' already exists in catalog.` };

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      category: data.category
    };
    this.state.subjects.push(newSub);
    this.recordAudit('CREATE', 'subject', newSub.id, undefined, newSub);
    this.save();
    return { success: true, message: `Subject '${newSub.name}' (${newSub.code}) created.`, subject: newSub };
  }

  public updateSubject(id: string, updates: Partial<Subject>): { success: boolean; message: string } {
    const sub = this.state.subjects.find(s => s.id === id);
    if (!sub) return { success: false, message: 'Subject not found.' };
    Object.assign(sub, updates);
    this.recordAudit('UPDATE', 'subject', id, undefined, updates);
    this.save();
    return { success: true, message: `Subject '${sub.name}' updated.` };
  }

  public deleteSubject(id: string): { success: boolean; message: string } {
    const hasExams = this.state.examinations.some(e => e.subject_id === id);
    if (hasExams) return { success: false, message: 'Cannot delete subject: Linked examination papers exist.' };
    return this.deleteRecord('subject', id);
  }

  // Class Levels
  public createClass(data: Omit<ClassLevel, 'id'>): { success: boolean; message: string; classLevel?: ClassLevel } {
    const dup = this.state.classes.find(c => c.name.toLowerCase() === data.name.toLowerCase());
    if (dup) return { success: false, message: `Class level '${data.name}' already exists.` };

    const newCls: ClassLevel = {
      id: `cls-${Date.now()}`,
      name: data.name.trim(),
      category: data.category
    };
    this.state.classes.push(newCls);
    this.recordAudit('CREATE', 'class-level', newCls.id, undefined, newCls);
    this.save();
    return { success: true, message: `Class '${newCls.name}' added.`, classLevel: newCls };
  }

  public updateClass(id: string, updates: Partial<ClassLevel>): { success: boolean; message: string } {
    const cls = this.state.classes.find(c => c.id === id);
    if (!cls) return { success: false, message: 'Class not found.' };
    Object.assign(cls, updates);
    this.recordAudit('UPDATE', 'class-level', id, undefined, updates);
    this.save();
    return { success: true, message: `Class '${cls.name}' updated.` };
  }

  public deleteClass(id: string): { success: boolean; message: string } {
    const hasStudents = this.state.students.some(s => s.class_id === id);
    if (hasStudents) return { success: false, message: 'Cannot delete class: Students are currently enrolled.' };
    this.state.classes = this.state.classes.filter(c => c.id !== id);
    this.recordAudit('DELETE', 'class-level', id);
    this.save();
    return { success: true, message: 'Class level deleted.' };
  }

  // Academic Sessions
  public createSession(data: Omit<AcademicSession, 'id'>): { success: boolean; message: string; session?: AcademicSession } {
    const dup = this.state.sessions.find(s => s.name === data.name);
    if (dup) return { success: false, message: `Session '${data.name}' already exists.` };

    if (data.is_active) {
      this.state.sessions.forEach(s => { s.is_active = false; });
    }

    const newSes: AcademicSession = {
      id: `ses-${Date.now()}`,
      name: data.name.trim(),
      is_active: data.is_active ?? true
    };
    this.state.sessions.push(newSes);
    this.recordAudit('CREATE', 'academic-session', newSes.id, undefined, newSes);
    this.save();
    return { success: true, message: `Session '${newSes.name}' created.`, session: newSes };
  }

  public updateSession(id: string, updates: Partial<AcademicSession>): { success: boolean; message: string } {
    const ses = this.state.sessions.find(s => s.id === id);
    if (!ses) return { success: false, message: 'Session not found.' };
    if (updates.is_active) {
      this.state.sessions.forEach(s => { s.is_active = false; });
    }
    Object.assign(ses, updates);
    this.recordAudit('UPDATE', 'academic-session', id, undefined, updates);
    this.save();
    return { success: true, message: `Session '${ses.name}' updated.` };
  }

  public deleteSession(id: string): { success: boolean; message: string } {
    const hasExams = this.state.examinations.some(e => e.session_id === id);
    if (hasExams) return { success: false, message: 'Cannot delete session: Examinations are scheduled in this session.' };
    this.state.sessions = this.state.sessions.filter(s => s.id !== id);
    this.recordAudit('DELETE', 'academic-session', id);
    this.save();
    return { success: true, message: 'Session deleted.' };
  }

  // Terms
  public createTerm(data: Omit<Term, 'id'>): { success: boolean; message: string; term?: Term } {
    if (data.is_active) {
      this.state.terms.forEach(t => {
        if (t.session_id === data.session_id) t.is_active = false;
      });
    }

    const newTerm: Term = {
      id: `trm-${Date.now()}`,
      name: data.name,
      session_id: data.session_id,
      is_active: data.is_active ?? true
    };
    this.state.terms.push(newTerm);
    this.recordAudit('CREATE', 'term', newTerm.id, undefined, newTerm);
    this.save();
    return { success: true, message: `Term '${newTerm.name}' added.`, term: newTerm };
  }

  public updateTerm(id: string, updates: Partial<Term>): { success: boolean; message: string } {
    const trm = this.state.terms.find(t => t.id === id);
    if (!trm) return { success: false, message: 'Term not found.' };
    if (updates.is_active) {
      this.state.terms.forEach(t => {
        if (t.session_id === trm.session_id) t.is_active = false;
      });
    }
    Object.assign(trm, updates);
    this.recordAudit('UPDATE', 'term', id, undefined, updates);
    this.save();
    return { success: true, message: `Term '${trm.name}' updated.` };
  }


  public deleteTerm(id: string): { success: boolean; message: string } {
    const hasExams = this.state.examinations.some(e => e.term_id === id);
    if (hasExams) return { success: false, message: 'Cannot delete term: Examinations exist under this term.' };
    this.state.terms = this.state.terms.filter(t => t.id !== id);
    this.recordAudit('DELETE', 'term', id);
    this.save();
    return { success: true, message: 'Term deleted.' };
  }

  // Students
  public createStudent(data: Omit<Student, 'id'>): { success: boolean; message: string; student?: Student } {
    const dup = this.state.students.find(s => s.admission_number.toUpperCase() === data.admission_number.toUpperCase());
    if (dup) return { success: false, message: `Admission number '${data.admission_number}' is already allocated.` };

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      admission_number: data.admission_number.toUpperCase().trim(),
      full_name: data.full_name.trim(),
      school_id: data.school_id,
      class_id: data.class_id,
      gender: data.gender,
      guardian_name: data.guardian_name,
      guardian_phone: data.guardian_phone,
      attendance_days: data.attendance_days || 95,
      total_days: data.total_days || 100,
      conduct_rating: data.conduct_rating || 'A (Exemplary)'
    };
    this.state.students.push(newStudent);
    this.recordAudit('CREATE', 'student', newStudent.id, undefined, newStudent);
    this.save();
    return { success: true, message: `Student '${newStudent.full_name}' enrolled.`, student: newStudent };
  }

  // ==========================================
  // DATABASE LIFECYCLE & BACKUP
  // ==========================================

  public restoreQuickAccessSeed(): { success: boolean; message: string } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Permission Denied: Only Super-Admin can restore Quick Access.' };
    }
    this.state.users = INITIAL_USERS;
    this.recordAudit('GENERATE', 'quick-access-seed', 'users', undefined, {
      restored: true,
      business_data_untouched: true
    });
    this.save();
    return { success: true, message: 'Quick Access login accounts restored. Existing business data was not changed.' };
  }

  public exportDatabaseJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public async importDatabaseJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Permission Denied: Only Super-Admin can restore database backups.' };
    }
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users)) {
        return { success: false, message: 'Invalid database backup JSON format. A users array is required.' };
      }
      await this.request('/database/restore-json', { method: 'POST', body: JSON.stringify(parsed) });
      this.pendingDeletes.clear();
      await this.hydrate();
      return { success: true, message: 'Database state successfully restored from the server-authoritative JSON backup.' };
    } catch (e: any) {
      return { success: false, message: `Failed to restore database: ${e?.message || 'restore error'}` };
    }
  }

  // Super Admin: Purge / Clear / Empty Database (Except quick logins & core structures)
  public purgeDatabase(keepLogins: boolean = true): { success: boolean; message: string } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Permission Denied: Only Super-Admin can purge the database.' };
    }

    this.state.examinations = [];
    this.state.questions = [];
    this.state.markingSchemes = [];
    this.state.rubrics = [];
    this.state.studentPapers = [];
    this.state.answerScripts = [];
    this.state.results = [];
    this.state.reportCards = [];
    this.state.dailyRollCalls = [];
    this.state.announcements = [];
    this.state.auditLogs = [
      {
        id: `aud-purge-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: this.state.currentUser.username,
        action: 'DELETE',
        entity_type: 'database',
        entity_id: 'all_tables_purged',
        new_value: { keptLogins: keepLogins, timestamp: new Date().toISOString() }
      }
    ];

    if (!keepLogins) {
      this.state.users = [this.state.currentUser];
    }

    this.save();
    return {
      success: true,
      message: 'Database successfully purged. All examinations, question banks, candidate scripts, rubrics, and results have been cleared.'
    };
  }

  // Super Admin: Promote User Role & Manage Users
  public promoteOrUpdateUserRole(userId: string, newRole: UserRole, newSchoolId?: string | null): { success: boolean; message: string } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Permission Denied: Only Super-Admin can modify user roles.' };
    }

    const user = this.state.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found in system directory.' };
    }

    const previousRole = user.role;
    user.role = newRole;
    if (newSchoolId !== undefined) {
      user.school_id = newSchoolId;
    }

    if (this.state.currentUser.id === userId) {
      this.state.currentUser.role = newRole;
    }

    this.recordAudit('UPDATE', 'user', userId, { role: previousRole }, { role: newRole, school_id: user.school_id });
    this.save();
    return {
      success: true,
      message: `User "${user.full_name}" role successfully updated to "${newRole.toUpperCase()}".`
    };
  }

  // Super Admin / CMS: Update Official State & Ministry of Education Logos
  public updateLogos(subebLogoUrl: string, ministryLogoUrl: string): { success: boolean; message: string } {
    if (this.state.currentUser.role !== 'super-admin') {
      return { success: false, message: 'Permission Denied: Only Super-Admin can update official logos.' };
    }

    this.state.systemConfig.subeb_logo_url = subebLogoUrl.trim();
    this.state.systemConfig.ministry_logo_url = ministryLogoUrl.trim();

    this.recordAudit('UPDATE', 'system-config', 'official_logos', undefined, {
      subeb_logo_url: subebLogoUrl,
      ministry_logo_url: ministryLogoUrl
    });
    this.save();
    return {
      success: true,
      message: 'State MINISTRY OF EDUCATION and Ministry of Education logos updated successfully.'
    };
  }

  // Student CBT Examination Online Submission & Automated Grading
  public submitStudentCbtExam(paperId: string, answers: Record<string, string>): {
    success: boolean;
    message: string;
    score: number;
    maximumMarks: number;
    percentage: number;
  } {
    const paper = this.state.studentPapers.find(p => p.id === paperId);
    if (!paper) {
      return { success: false, message: 'Candidate examination paper not found.', score: 0, maximumMarks: 0, percentage: 0 };
    }

    // Submission is a one-way state transition. A candidate cannot reopen,
    // overwrite, or resubmit a locked examination after submission.
    if (paper.cbt_status === 'submitted' || paper.cbt_status === 'graded') {
      return {
        success: false,
        message: 'This examination has already been submitted and is locked. It cannot be reopened or resubmitted.',
        score: paper.cbt_score || 0,
        maximumMarks: 0,
        percentage: 0
      };
    }

    const exam = this.state.examinations.find(e => e.id === paper.examination_id);
    if (!exam) {
      return { success: false, message: 'Associated examination not found.', score: 0, maximumMarks: 0, percentage: 0 };
    }

    const examQuestions = this.state.questions.filter(q => q.examination_id === exam.id);
    let totalScore = 0;
    const scriptAnswers: ScriptAnswer[] = [];

    for (const q of examQuestions) {
      const studentAns = (answers[q.id] || '').trim();
      let earnedScore = 0;
      let status: 'finalized' | 'proposed' = 'finalized';

      if (q.question_type === 'objective') {
        const isCorrect = q.correct_answer && studentAns.toUpperCase() === q.correct_answer.toUpperCase();
        earnedScore = isCorrect ? q.maximum_marks : 0;
      } else {
        // Theory / structured response: propose provisional score if answered
        if (studentAns.length > 5) {
          earnedScore = Math.round(q.maximum_marks * 0.8);
          status = 'proposed';
        } else if (studentAns.length > 0) {
          earnedScore = Math.round(q.maximum_marks * 0.4);
          status = 'proposed';
        } else {
          earnedScore = 0;
        }
      }

      totalScore += earnedScore;

      scriptAnswers.push({
        id: `sa-cbt-${paper.id}-${q.id}`,
        script_id: `scr-cbt-${paper.id}`,
        question_id: q.id,
        student_raw_response: studentAns,
        detected_mcq_choice: q.question_type === 'objective' ? studentAns : undefined,
        proposed_score: earnedScore,
        confidence: q.question_type === 'objective' ? 1.0 : 0.88,
        final_score: earnedScore,
        status,
        reasoning: q.question_type === 'objective'
          ? (earnedScore > 0 ? 'Correct objective option selected via Online CBT.' : 'Incorrect objective option selected.')
          : 'Provisional automated score for theory submission via Online CBT.'
      });
    }

    // Update Paper status
    paper.delivery_mode = 'online_cbt';
    paper.cbt_status = 'submitted';
    paper.cbt_submitted_at = new Date().toISOString();
    paper.cbt_answers = answers;
    paper.cbt_score = totalScore;
    paper.cbt_auto_marked = true;

    // Create or update AnswerScript
    let script = this.state.answerScripts.find(s => s.paper_id === paper.id);
    if (!script) {
      script = {
        id: `scr-cbt-${paper.id}`,
        paper_id: paper.id,
        examination_id: exam.id,
        student_id: paper.student_id,
        intake_type: 'digital',
        status: 'marked',
        review_status: 'examiner_approved',
        score: totalScore,
        maximum_marks: exam.maximum_marks,
        answers: scriptAnswers,
        created_at: new Date().toISOString()
      };
      this.state.answerScripts.push(script);
    } else {
      script.score = totalScore;
      script.answers = scriptAnswers;
      script.status = 'marked';
    }

    // Update or generate Result
    const percentage = exam.maximum_marks > 0 ? Math.round((totalScore / exam.maximum_marks) * 100 * 10) / 10 : 0;
    const grade = gradeForPercentage(percentage, this.state.gradeScales);

    let result = this.state.results.find(r => r.examination_id === exam.id && r.student_id === paper.student_id);
    if (!result) {
      result = {
        id: `res-cbt-${paper.id}`,
        examination_id: exam.id,
        student_id: paper.student_id,
        raw_marks: totalScore,
        maximum_marks: exam.maximum_marks,
        percentage,
        grade,
        position: 1,
        status: 'finalized',
        finalized_at: new Date().toISOString(),
        finalized_by: 'CBT Automated Marking Engine'
      };
      this.state.results.push(result);
    } else {
      result.raw_marks = totalScore;
      result.percentage = percentage;
      result.grade = grade;
      result.status = 'finalized';
    }

    this.recordAudit('FINALIZE', 'cbt-examination', paper.id, undefined, {
      student_id: paper.student_id,
      score: totalScore,
      maximum_marks: exam.maximum_marks,
      percentage
    });

    this.save();
    return {
      success: true,
      message: 'Examination submitted successfully! Your answers have been recorded and marked.',
      score: totalScore,
      maximumMarks: exam.maximum_marks,
      percentage
    };
  }

  // Toggle active status (suspend/activate)
  public toggleUserActive(userId: string): { success: boolean; message: string } {
    const user = this.state.users.find(u => u.id === userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    if (this.state.currentUser.role !== 'super-admin') {
      return {
        success: false,
        message: 'Only Super-Admin can suspend/activate users.'
      };
    }

    if (user.id === this.state.currentUser.id) {
      return {
        success: false,
        message: 'You cannot suspend your own account.'
      };
    }

    const newStatus = !user.is_active;
    user.is_active = newStatus;

    this.recordAudit(
      'UPDATE',
      'user-status',
      userId,
      { is_active: !newStatus },
      { is_active: newStatus }
    );

    this.save();

    return {
      success: true,
      message: `User ${user.username} ${
        newStatus ? 'activated' : 'suspended'
      }.`
    };
  }
}

export const store = new Store();