
import React, { useState } from 'react';
import {
  Settings2,
  Building2,
  Megaphone,
  BookOpen,
  Sliders,
  Database,
  RefreshCw,
  Trash2,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  ShieldCheck,
  Globe,
  Layers,
  FileText,
  Save,
  RotateCcw,
  Pin,
  Eye,
  EyeOff,
  Search,
  Filter,
  School as SchoolIcon,
  GraduationCap,
  Calendar,
  Award,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { store, AppStoreState, gradeForPercentage } from '../lib/store';
import {
  SystemContentConfig,
  Announcement,
  HandbookArticle,
  School,
  Subject,
  ClassLevel,
  AcademicSession,
  Term,
  GradeScale,
  ReportCard,
  ReportCardSubjectEntry
} from '../types';

interface ContentManagementViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
  onNavigate?: (tab: string, extra?: any) => void;
}

export const ContentManagementView: React.FC<ContentManagementViewProps> = ({
  storeState,
  onRefresh,
  onNavigate
}) => {
  const {
    systemConfig,
    announcements,
    handbookArticles,
    schools,
    subjects,
    classes,
    sessions,
    terms,
    gradeScales,
    reportCards,
    students,
    currentUser
  } = storeState;

  const isSuperAdmin = currentUser.role === 'super-admin';

  const [activeTab, setActiveTab] = useState<'branding' | 'reportcard' | 'announcements' | 'policies' | 'handbook' | 'entities' | 'lifecycle'>('branding');

  // Notifications / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // ----------------------------------------------------
  // 1. BRANDING & PORTAL CONFIG STATE
  // ----------------------------------------------------
  const [brandingForm, setBrandingForm] = useState<SystemContentConfig>({ ...systemConfig });
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBranding(true);
    const res = store.updateSystemConfig(brandingForm);
    setIsSavingBranding(false);
    if (res.success) {
      showFeedback('success', res.message);
      onRefresh();
    } else {
      showFeedback('error', res.message);
    }
  };

  const handleStampFileChange = (type: 'chairman' | 'principal', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBrandingForm(prev => type === 'chairman'
          ? { ...prev, chairman_signature_url: dataUrl }
          : { ...prev, principal_signature_url: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (type: 'subeb' | 'ministry', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (type === 'subeb') {
          setBrandingForm(prev => ({ ...prev, subeb_logo_url: dataUrl }));
        } else {
          setBrandingForm(prev => ({ ...prev, ministry_logo_url: dataUrl }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // 1B. REPORT CARD & TEMPLATE CMS STATE & HANDLERS
  // ----------------------------------------------------
  const [reportCardTemplateForm, setReportCardTemplateForm] = useState({
    report_card_header_title: systemConfig.report_card_header_title || 'EDO STATE MINISTRY OF EDUCATION',
    report_card_sub_header: systemConfig.report_card_sub_header || 'CONTINUOUS ASSESSMENT & TERMINAL REPORT SHEET',
    report_card_motto: systemConfig.report_card_motto || 'Developing the child, transforming the nation',
    report_card_watermark_text: systemConfig.report_card_watermark_text || 'EDO-STATE-MINISTRY-OF-EDUCATION-OFFICIAL-SEAL',
    report_card_chairman_title: systemConfig.report_card_chairman_title || 'Executive Chairman, Edo State Ministry of Education',
    report_card_principal_signature_title: systemConfig.report_card_principal_signature_title || 'Head Teacher / Principal',
    report_card_teacher_signature_title: systemConfig.report_card_teacher_signature_title || 'Class Form Teacher',
    report_card_disclaimer: systemConfig.report_card_disclaimer || 'This official terminal academic record is generated and verified by the Edo State Ministry of Education Centralized Examination and Assessment System.',
    report_card_next_term_begins: systemConfig.report_card_next_term_begins || 'Monday, 15th September 2026',
    report_card_next_term_fees_notice: systemConfig.report_card_next_term_fees_notice || 'All standard public primary tuition is fully sponsored under the EdoBEST Basic Education Fund.',
    report_card_show_qr_code: systemConfig.report_card_show_qr_code !== false
  });

  const [selectedCmsStudentId, setSelectedCmsStudentId] = useState<string>(students[0]?.id || '');
  const [selectedCmsSessionId, setSelectedCmsSessionId] = useState<string>(sessions[0]?.id || '');
  const [selectedCmsTermId, setSelectedCmsTermId] = useState<string>(terms[0]?.id || '');
  
  // Find current card in CMS
  const currentCmsCard = reportCards.find(
    rc => rc.student_id === selectedCmsStudentId && rc.session_id === selectedCmsSessionId && rc.term_id === selectedCmsTermId
  );

  const [cmsCandidateForm, setCmsCandidateForm] = useState<{
    teacher_comment: string;
    principal_comment: string;
    conduct_grade: string;
    promotion_status: 'Promoted' | 'Promoted on Trial' | 'Not Promoted' | 'Under Review';
    attendance_present: number;
    attendance_total: number;
    position: number;
    subjects: ReportCardSubjectEntry[];
  }>({
    teacher_comment: '',
    principal_comment: '',
    conduct_grade: 'Very Good',
    promotion_status: 'Promoted',
    attendance_present: 60,
    attendance_total: 65,
    position: 1,
    subjects: []
  });

  // Sync candidate form whenever active selection or report card changes
  React.useEffect(() => {
    if (currentCmsCard) {
      const activeSubjects: ReportCardSubjectEntry[] = Array.isArray(currentCmsCard.subjects) && currentCmsCard.subjects.length > 0
        ? currentCmsCard.subjects
        : ((currentCmsCard as any).subject_entries || []).map((e: any) => ({
            subject_name: e.subject_name || 'Subject',
            subject_code: e.subject_code || 'SUB',
            raw_marks: e.total_score || e.raw_marks || 0,
            max_marks: 100,
            percentage: e.total_score || e.raw_marks || 0,
            grade: e.grade || 'C',
            remark: e.remark || 'Good',
            position: e.position || 1
          }));

      setCmsCandidateForm({
        teacher_comment: currentCmsCard.teacher_comment || '',
        principal_comment: currentCmsCard.principal_comment || '',
        conduct_grade: currentCmsCard.conduct_grade || 'Very Good',
        promotion_status: currentCmsCard.promotion_status || 'Promoted',
        attendance_present: currentCmsCard.attendance_present ?? 60,
        attendance_total: currentCmsCard.attendance_total ?? 65,
        position: currentCmsCard.position || 1,
        subjects: JSON.parse(JSON.stringify(activeSubjects))
      });
    } else {
      setCmsCandidateForm({
        teacher_comment: '',
        principal_comment: '',
        conduct_grade: 'Very Good',
        promotion_status: 'Promoted',
        attendance_present: 60,
        attendance_total: 65,
        position: 1,
        subjects: []
      });
    }
  }, [currentCmsCard?.id, selectedCmsStudentId, selectedCmsSessionId, selectedCmsTermId]);

  const handleSaveReportCardTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.updateSystemConfig(reportCardTemplateForm);
    if (res.success) {
      showFeedback('success', 'Global report card headers, motto, disclaimers, and signature titles updated successfully.');
      onRefresh();
    } else {
      showFeedback('error', res.message);
    }
  };

  const handleSaveCandidateCardFromCms = (e: React.FormEvent) => {
    e.preventDefault();
    let targetCard = currentCmsCard;
    if (!targetCard) {
      const genRes = store.generateReportCard(selectedCmsStudentId, selectedCmsSessionId, selectedCmsTermId);
      if (!genRes.success) {
        showFeedback('error', genRes.message);
        return;
      }
      targetCard = genRes.reportCard;
    }

    if (targetCard) {
      const res = store.updateReportCard(targetCard.id, {
        teacher_comment: cmsCandidateForm.teacher_comment,
        principal_comment: cmsCandidateForm.principal_comment,
        conduct_grade: cmsCandidateForm.conduct_grade,
        promotion_status: cmsCandidateForm.promotion_status,
        attendance_present: Number(cmsCandidateForm.attendance_present),
        attendance_total: Number(cmsCandidateForm.attendance_total),
        position: Number(cmsCandidateForm.position),
        subjects: cmsCandidateForm.subjects
      });

      if (res.success) {
        showFeedback('success', `Report card for ${students.find(s => s.id === selectedCmsStudentId)?.full_name} updated and digital verification hash re-issued.`);
        onRefresh();
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  const handleUpdateCmsSubjectScore = (index: number, raw: number) => {
    setCmsCandidateForm(prev => {
      const copy = [...prev.subjects];
      const target = { ...copy[index] };
      target.raw_marks = Number(raw);
      target.percentage = target.max_marks > 0 ? Number(((target.raw_marks / target.max_marks) * 100).toFixed(1)) : 0;
      target.grade = gradeForPercentage(target.percentage, gradeScales);
      copy[index] = target;
      return { ...prev, subjects: copy };
    });
  };

  const handleUpdateCmsSubjectRemark = (index: number, remark: string) => {
    setCmsCandidateForm(prev => {
      const copy = [...prev.subjects];
      copy[index] = { ...copy[index], remark };
      return { ...prev, subjects: copy };
    });
  };

  // ----------------------------------------------------
  // 2. ANNOUNCEMENTS STATE & MODALS
  // ----------------------------------------------------
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'alert' | 'schedule' | 'policy' | 'update'>('all');

  const [announcementForm, setAnnouncementForm] = useState<{
    title: string;
    content: string;
    category: 'alert' | 'update' | 'policy' | 'schedule';
    target_audience: 'all' | 'examiners' | 'admins';
    is_pinned: boolean;
    is_active: boolean;
  }>({
    title: '',
    content: '',
    category: 'update',
    target_audience: 'all',
    is_pinned: false,
    is_active: true
  });

  const handleCreateOrUpdateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      showFeedback('error', 'Title and content are required for announcement.');
      return;
    }

    if (editingAnnouncement) {
      const res = store.updateAnnouncement(editingAnnouncement.id, announcementForm);
      if (res.success) {
        showFeedback('success', res.message);
        setEditingAnnouncement(null);
        setShowAddAnnouncementModal(false);
        onRefresh();
      } else {
        showFeedback('error', res.message);
      }
    } else {
      const res = store.createAnnouncement(announcementForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowAddAnnouncementModal(false);
        setAnnouncementForm({
          title: '',
          content: '',
          category: 'update',
          target_audience: 'all',
          is_pinned: false,
          is_active: true
        });
        onRefresh();
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement broadcast?')) {
      const res = store.deleteAnnouncement(id);
      if (res.success) {
        showFeedback('success', res.message);
        onRefresh();
      }
    }
  };

  const handleTogglePinAnnouncement = (id: string) => {
    const res = store.togglePinAnnouncement(id);
    if (res.success) {
      showFeedback('success', res.message);
      onRefresh();
    }
  };

  // ----------------------------------------------------
  // 3. ACADEMIC POLICIES FORM
  // ----------------------------------------------------
  const [policyForm, setPolicyForm] = useState({
    ca_weight_percentage: systemConfig.ca_weight_percentage,
    exam_weight_percentage: systemConfig.exam_weight_percentage,
    pass_mark_percentage: systemConfig.pass_mark_percentage,
    ai_discrepancy_threshold: systemConfig.ai_discrepancy_threshold,
    report_card_chairman_title: systemConfig.report_card_chairman_title,
    report_card_disclaimer: systemConfig.report_card_disclaimer
  });

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    if (policyForm.ca_weight_percentage + policyForm.exam_weight_percentage !== 100) {
      showFeedback('error', 'Continuous Assessment (CA) % and Terminal Exam % must sum to exactly 100%.');
      return;
    }
    const res = store.updateSystemConfig(policyForm);
    if (res.success) {
      showFeedback('success', 'Academic evaluation weighting and policy settings saved.');
      onRefresh();
    } else {
      showFeedback('error', res.message);
    }
  };

  // ----------------------------------------------------
  // 4. HANDBOOK ARTICLES CMS
  // ----------------------------------------------------
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HandbookArticle | null>(null);
  const [selectedArticleView, setSelectedArticleView] = useState<HandbookArticle | null>(null);
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('all');

  const [articleForm, setArticleForm] = useState<{
    title: string;
    category: HandbookArticle['category'];
    content: string;
    is_published: boolean;
  }>({
    title: '',
    category: 'Examiner Manual',
    content: '',
    is_published: true
  });

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      showFeedback('error', 'Article title and body content are required.');
      return;
    }

    if (editingArticle) {
      const res = store.updateHandbookArticle(editingArticle.id, articleForm);
      if (res.success) {
        showFeedback('success', res.message);
        setEditingArticle(null);
        setShowAddArticleModal(false);
        onRefresh();
      } else {
        showFeedback('error', res.message);
      }
    } else {
      const res = store.createHandbookArticle(articleForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowAddArticleModal(false);
        setArticleForm({
          title: '',
          category: 'Examiner Manual',
          content: '',
          is_published: true
        });
        onRefresh();
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('Are you sure you want to delete this handbook article?')) {
      const res = store.deleteHandbookArticle(id);
      if (res.success) {
        showFeedback('success', res.message);
        if (selectedArticleView?.id === id) setSelectedArticleView(null);
        onRefresh();
      }
    }
  };

  // ----------------------------------------------------
  // 5. MASTER ENTITIES CMS SUB-TABS
  // ----------------------------------------------------
  const [entitySubTab, setEntitySubTab] = useState<'schools' | 'subjects' | 'classes' | 'sessions' | 'grades'>('schools');
  const [entitySearch, setEntitySearch] = useState('');

  // School modal
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolForm, setSchoolForm] = useState({ name: '', code: '', lga: 'Oredo', address: '', head_teacher: '' });

  // Subject modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<{ code: string; name: string; category: 'Core' | 'Vocational' | 'Language' | 'Science' }>({
    code: '',
    name: '',
    category: 'Core'
  });

  // Class modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassLevel | null>(null);
  const [classForm, setClassForm] = useState<{ name: string; category: 'Primary' | 'Junior Secondary' | 'Senior Secondary' }>({
    name: '',
    category: 'Primary'
  });

  // Session & Term modal
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ name: '', start_date: '', end_date: '', is_current: true });

  const [showTermModal, setShowTermModal] = useState(false);
  const [termForm, setTermForm] = useState<{ name: string; session_id: string; start_date: string; end_date: string; is_current: boolean }>({
    name: '2nd Term',
    session_id: sessions[0]?.id || '',
    start_date: '',
    end_date: '',
    is_current: true
  });

  // Entity Handlers
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchool) {
      const res = store.updateSchool(editingSchool.id, schoolForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowSchoolModal(false);
        setEditingSchool(null);
        onRefresh();
      } else showFeedback('error', res.message);
    } else {
      const res = store.createSchool(schoolForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowSchoolModal(false);
        setSchoolForm({ name: '', code: '', lga: 'Oredo', address: '', head_teacher: '' });
        onRefresh();
      } else showFeedback('error', res.message);
    }
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      const res = store.updateSubject(editingSubject.id, subjectForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowSubjectModal(false);
        setEditingSubject(null);
        onRefresh();
      } else showFeedback('error', res.message);
    } else {
      const res = store.createSubject(subjectForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowSubjectModal(false);
        setSubjectForm({ code: '', name: '', category: 'Core' });
        onRefresh();
      } else showFeedback('error', res.message);
    }
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      const res = store.updateClass(editingClass.id, classForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowClassModal(false);
        setEditingClass(null);
        onRefresh();
      } else showFeedback('error', res.message);
    } else {
      const res = store.createClass(classForm);
      if (res.success) {
        showFeedback('success', res.message);
        setShowClassModal(false);
        setClassForm({ name: '', category: 'Primary' });
        onRefresh();
      } else showFeedback('error', res.message);
    }
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.createSession(sessionForm);
    if (res.success) {
      showFeedback('success', res.message);
      setShowSessionModal(false);
      setSessionForm({ name: '', start_date: '', end_date: '', is_current: true });
      onRefresh();
    } else showFeedback('error', res.message);
  };

  const handleSaveTerm = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.createTerm(termForm);
    if (res.success) {
      showFeedback('success', res.message);
      setShowTermModal(false);
      setTermForm({ name: '3rd Term', session_id: sessions[0]?.id || '', start_date: '', end_date: '', is_current: true });
      onRefresh();
    } else showFeedback('error', res.message);
  };

  // ----------------------------------------------------
  // 6. SEED DATA & LIFECYCLE MANAGEMENT
  // ----------------------------------------------------
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExecuteResetToEmpty = async () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'RESET') {
      showFeedback('error', 'Confirmation keyword mismatch. Please type RESET exactly.');
      return;
    }
    const res = await store.resetToEmptyDatabase();
    setShowResetConfirmModal(false);
    setResetConfirmInput('');
    if (res.success) {
      showFeedback('success', res.message);
      onRefresh();
    } else {
      showFeedback('error', res.message);
    }
  };


  const handleExportDatabase = () => {
    const jsonStr = store.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `earpms_database_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('success', 'Database backup snapshot exported successfully.');
  };

  const handleImportJsonBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      showFeedback('error', 'Please paste valid JSON backup content.');
      return;
    }
    const res = await store.importDatabaseJson(importJsonText);
    if (res.success) {
      showFeedback('success', res.message);
      setShowImportModal(false);
      setImportJsonText('');
      onRefresh();
    } else {
      showFeedback('error', res.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  // Super Admin Security Guard
  if (currentUser.role !== 'super-admin') {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted: Super-Admin Privileges Required</h3>
        <p className="text-sm text-slate-600 mb-6">
          Application Content & Reset Controls are strictly accessible to the Super Administrator. Your current account role is <strong className="text-slate-800 uppercase">{currentUser.role}</strong>.
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="content-management-container" className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sliders className="w-3.5 h-3.5" />
              Super Admin Content Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Application Content & System Governance
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
              Comprehensive control over board identity, system announcements, academic weighting policies, user handbooks, core master entities, and complete database seed lifecycle management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="cms-export-backup-btn"
              onClick={handleExportDatabase}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Backup JSON
            </button>
            <button
              id="cms-import-backup-btn"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Restore Backup
            </button>
          </div>
        </div>

        {/* Global Keyword / Sentence / Element Search & Filter Bar */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search or filter down to a particular word, sentence, setting or element across CMS..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-800/90 border border-slate-600/80 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {globalSearchQuery && (
            <div className="text-xs text-indigo-200 font-semibold px-3 py-1 bg-indigo-900/60 border border-indigo-500/40 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" />
              Filtering by: "{globalSearchQuery}"
            </div>
          )}
        </div>

        {/* Global Feedback Bar */}
        {feedback && (
          <div
            id="cms-feedback-alert"
            className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              {feedback.type === 'info' && <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        <button
          id="tab-btn-branding"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          Board Identity & Branding
        </button>

        <button
          id="tab-btn-reportcard"
          onClick={() => setActiveTab('reportcard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'reportcard'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20 border border-orange-400'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 text-orange-500" />
          Report Card & Template CMS
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800 font-bold">
            {reportCards.length} Cards
          </span>
        </button>

        <button
          id="tab-btn-announcements"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Announcements & Broadcasts
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-200/80 text-slate-700 font-bold">
            {announcements.length}
          </span>
        </button>

        <button
          id="tab-btn-policies"
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'policies'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Academic Policies & Rules
        </button>

        <button
          id="tab-btn-handbook"
          onClick={() => setActiveTab('handbook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'handbook'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Help Center & Handbooks
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-200/80 text-slate-700 font-bold">
            {handbookArticles.length}
          </span>
        </button>

        <button
          id="tab-btn-entities"
          onClick={() => setActiveTab('entities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'entities'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Master Entities Directory
        </button>

        <button
          id="tab-btn-lifecycle"
          onClick={() => setActiveTab('lifecycle')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'lifecycle'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Database className="w-4 h-4" />
          Seed Data & Reset Controls
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOARD IDENTITY & BRANDING                                          */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Board Identity & Global Content Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control the displayed board header, institutional motto, banners, and report card signatories.</p>
              </div>
              <button
                type="button"
                onClick={() => setBrandingForm({ ...systemConfig })}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Revert
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              {/* Official Logos Customization Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Official State & Ministry of Education Logos
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ministry of Education Logo */}
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      1. Edo State Ministry of Education Official Logo / Crest
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {brandingForm.subeb_logo_url ? (
                          <img src={brandingForm.subeb_logo_url} alt="Ministry of Education Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={brandingForm.subeb_logo_url || ''}
                          onChange={(e) => setBrandingForm({ ...brandingForm, subeb_logo_url: e.target.value })}
                          placeholder="Image URL (https://...)"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium border border-slate-300 transition-colors">
                            Upload File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleLogoFileChange('subeb', e)}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setBrandingForm({ ...brandingForm, subeb_logo_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&auto=format&fit=crop&q=80' })}
                            className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                          >
                            Set Preset Crest
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ministry of Education Logo */}
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      2. Ministry of Education Official Emblem
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {brandingForm.ministry_logo_url ? (
                          <img src={brandingForm.ministry_logo_url} alt="Ministry Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">No Emblem</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={brandingForm.ministry_logo_url || ''}
                          onChange={(e) => setBrandingForm({ ...brandingForm, ministry_logo_url: e.target.value })}
                          placeholder="Image URL (https://...)"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium border border-slate-300 transition-colors">
                            Upload File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleLogoFileChange('ministry', e)}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setBrandingForm({ ...brandingForm, ministry_logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80' })}
                            className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                          >
                            Set Preset Emblem
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Official Chairman & Principal Stamps
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">Chairman Stamp</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-16 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {brandingForm.chairman_signature_url ? <img src={brandingForm.chairman_signature_url} alt="Chairman Stamp" className="w-full h-full object-contain p-1" /> : <span className="text-[9px] font-bold text-slate-400">No Stamp</span>}
                      </div>
                      <label className="text-[11px] px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium border border-slate-300">
                        Upload Stamp
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleStampFileChange('chairman', e)} />
                      </label>
                    </div>
                  </div>
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">Principal Stamp</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-16 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {brandingForm.principal_signature_url ? <img src={brandingForm.principal_signature_url} alt="Principal Stamp" className="w-full h-full object-contain p-1" /> : <span className="text-[9px] font-bold text-slate-400">No Stamp</span>}
                      </div>
                      <label className="text-[11px] px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium border border-slate-300">
                        Upload Stamp
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleStampFileChange('principal', e)} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chairman Name</label>
                  <input
                    type="text"
                    value={brandingForm.report_card_chairman_name || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, report_card_chairman_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Board Name</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.board_name}
                    onChange={(e) => setBrandingForm({ ...brandingForm, board_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">System Title & Acronym</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.system_title}
                    onChange={(e) => setBrandingForm({ ...brandingForm, system_title: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">State & Jurisdiction</label>
                <input
                  type="text"
                  required
                  value={brandingForm.state_name}
                  onChange={(e) => setBrandingForm({ ...brandingForm, state_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Board Motto / Vision Statement</label>
                <input
                  type="text"
                  value={brandingForm.portal_motto}
                  onChange={(e) => setBrandingForm({ ...brandingForm, portal_motto: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Portal Announcement */}
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-amber-600" />
                    Global Portal Marquee Banner
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-amber-800 font-medium">Active:</span>
                    <input
                      type="checkbox"
                      checked={brandingForm.portal_announcement_active}
                      onChange={(e) => setBrandingForm({ ...brandingForm, portal_announcement_active: e.target.checked })}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={brandingForm.portal_announcement}
                  onChange={(e) => setBrandingForm({ ...brandingForm, portal_announcement: e.target.value })}
                  placeholder="Broadcast message shown across the topbar and candidate portal..."
                  className="w-full px-3 py-2 text-xs border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Support & Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Support Email</label>
                  <input
                    type="email"
                    value={brandingForm.support_email}
                    onChange={(e) => setBrandingForm({ ...brandingForm, support_email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Support Telephone Hotline</label>
                  <input
                    type="text"
                    value={brandingForm.support_phone}
                    onChange={(e) => setBrandingForm({ ...brandingForm, support_phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Board Physical Headquarters Address</label>
                <input
                  type="text"
                  value={brandingForm.portal_address}
                  onChange={(e) => setBrandingForm({ ...brandingForm, portal_address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Report Card Signatory Authority Title</label>
                <input
                  type="text"
                  value={brandingForm.report_card_chairman_title}
                  onChange={(e) => setBrandingForm({ ...brandingForm, report_card_chairman_title: e.target.value })}
                  placeholder="e.g. Executive Chairman, Edo State Ministry of Education"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Portal Footer & Legal Copyright Note</label>
                <textarea
                  rows={2}
                  value={brandingForm.footer_note}
                  onChange={(e) => setBrandingForm({ ...brandingForm, footer_note: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  id="save-branding-btn"
                  disabled={isSavingBranding}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Identity & Branding Settings
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Live Preview: Navigation Bar
              </div>
              <div className="bg-slate-900 rounded-xl p-4 text-white border border-slate-800 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
                    ED
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{brandingForm.board_name}</h4>
                    <p className="text-[10px] text-emerald-400 font-mono">{brandingForm.system_title}</p>
                  </div>
                </div>
                {brandingForm.portal_announcement_active && brandingForm.portal_announcement && (
                  <div className="mt-3 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-[11px] text-amber-200 line-clamp-2">
                    {brandingForm.portal_announcement}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <FileText className="w-4 h-4 text-indigo-500" />
                Live Preview: Report Card Header
              </div>
              <div className="border-2 border-emerald-900/40 rounded-xl p-4 bg-emerald-50/30 text-center space-y-1">
                <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-950">{brandingForm.state_name}</p>
                <h3 className="text-xs font-extrabold uppercase text-emerald-900">{brandingForm.board_name}</h3>
                <p className="text-[10px] italic text-emerald-800">"{brandingForm.portal_motto}"</p>
                <div className="pt-2 mt-2 border-t border-emerald-200 text-[10px] text-slate-600 text-left flex justify-between">
                  <span>Signatory: <strong className="text-slate-800">{brandingForm.report_card_chairman_title}</strong></span>
                  <span className="text-emerald-700 font-bold">Verified QR Secure</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Support Contacts
              </div>
              <p className="text-xs text-slate-600 font-mono">{brandingForm.support_email}</p>
              <p className="text-xs text-slate-600 font-mono mt-1">{brandingForm.support_phone}</p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{brandingForm.portal_address}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1B: REPORT CARD & TEMPLATE CONTENT CMS                                */}
      {/* ========================================================================= */}
      {activeTab === 'reportcard' && (
        <div className="space-y-8">
          {/* Top Info Banner with Orange Accent */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md border border-orange-300">
                <Award className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Report Card Content & Pedagogical CMS</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500 text-slate-950">
                    Live Sync
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Directly customize official certificate headers, institutional motto, disclaimer notices, principal signatures, and individual pupil terminal remarks.
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('reports')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                <span>Open Terminal Report Viewer</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: GLOBAL TEMPLATE & SIGNATORIES CONFIG (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Global Template & Signatory Defaults
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">TEMPLATE-V2</span>
              </div>

              <form onSubmit={handleSaveReportCardTemplate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Board Header Title</label>
                  <input
                    type="text"
                    required
                    value={reportCardTemplateForm.report_card_header_title}
                    onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_header_title: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub-Header Title</label>
                  <input
                    type="text"
                    required
                    value={reportCardTemplateForm.report_card_sub_header}
                    onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_sub_header: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Report Card Motto / Theme</label>
                  <input
                    type="text"
                    value={reportCardTemplateForm.report_card_motto}
                    onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_motto: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl italic text-slate-700 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Chairman Title</label>
                    <input
                      type="text"
                      value={reportCardTemplateForm.report_card_chairman_title}
                      onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_chairman_title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Watermark Seal Text</label>
                    <input
                      type="text"
                      value={reportCardTemplateForm.report_card_watermark_text}
                      onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_watermark_text: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Principal Signature Label</label>
                    <input
                      type="text"
                      value={reportCardTemplateForm.report_card_principal_signature_title}
                      onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_principal_signature_title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teacher Signature Label</label>
                    <input
                      type="text"
                      value={reportCardTemplateForm.report_card_teacher_signature_title}
                      onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_teacher_signature_title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Next Term Resumption</label>
                    <input
                      type="text"
                      value={reportCardTemplateForm.report_card_next_term_begins}
                      onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_next_term_begins: e.target.value })}
                      placeholder="e.g. 15th Sept 2026"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tuition / Fees Notice</label>
                    <input
                      type="text"
                      value={reportCardTemplateForm.report_card_next_term_fees_notice}
                      onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_next_term_fees_notice: e.target.value })}
                      placeholder="Tuition free under EdoBEST"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Legal Disclaimer</label>
                  <textarea
                    rows={2}
                    value={reportCardTemplateForm.report_card_disclaimer}
                    onChange={(e) => setReportCardTemplateForm({ ...reportCardTemplateForm, report_card_disclaimer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-700"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md shadow-orange-600/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Template Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: CANDIDATE REPORT CARD CONTENT & REMARKS EDITOR (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Candidate Report Card Content & Scores
                  </h3>
                </div>
                <span className="text-xs text-orange-800 font-bold bg-orange-100 px-2.5 py-0.5 rounded-full">
                  Individual Candidate Editor
                </span>
              </div>

              {/* Candidate & Session Selection Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Candidate</label>
                  <select
                    value={selectedCmsStudentId}
                    onChange={(e) => setSelectedCmsStudentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.admission_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session</label>
                  <select
                    value={selectedCmsSessionId}
                    onChange={(e) => setSelectedCmsSessionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Term</label>
                  <select
                    value={selectedCmsTermId}
                    onChange={(e) => setSelectedCmsTermId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    {terms.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Candidate Edit Form */}
              <form onSubmit={handleSaveCandidateCardFromCms} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Promotion Status</label>
                    <select
                      value={cmsCandidateForm.promotion_status}
                      onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, promotion_status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                    >
                      <option value="Promoted">Promoted</option>
                      <option value="Promoted on Trial">Promoted on Trial</option>
                      <option value="Not Promoted">Not Promoted</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Conduct Grade</label>
                    <select
                      value={cmsCandidateForm.conduct_grade}
                      onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, conduct_grade: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Class Position</label>
                    <input
                      type="number"
                      min={1}
                      value={cmsCandidateForm.position}
                      onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, position: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Attendance (Days Present)</label>
                    <input
                      type="number"
                      min={0}
                      value={cmsCandidateForm.attendance_present}
                      onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, attendance_present: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total School Days in Term</label>
                    <input
                      type="number"
                      min={1}
                      value={cmsCandidateForm.attendance_total}
                      onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, attendance_total: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Form Teacher's Pedagogical Remarks</label>
                  <textarea
                    rows={2}
                    value={cmsCandidateForm.teacher_comment}
                    onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, teacher_comment: e.target.value })}
                    placeholder="Enter teacher remark..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head Teacher / Principal's Final Appraisal Remarks</label>
                  <textarea
                    rows={2}
                    value={cmsCandidateForm.principal_comment}
                    onChange={(e) => setCmsCandidateForm({ ...cmsCandidateForm, principal_comment: e.target.value })}
                    placeholder="Enter principal remark..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Subject Scores & Remarks */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Subject Scores & Teacher Remarks
                    </span>
                    <span className="text-[11px] font-bold text-orange-950">
                      Total: {cmsCandidateForm.subjects.reduce((s, i) => s + (Number(i.raw_marks) || 0), 0)} / {cmsCandidateForm.subjects.reduce((s, i) => s + (Number(i.max_marks) || 100), 0)}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cmsCandidateForm.subjects.map((sub, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <span className="font-bold text-slate-900 block truncate">{sub.subject_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{sub.subject_code}</span>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-500 block">Score (100)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={sub.raw_marks}
                            onChange={(e) => handleUpdateCmsSubjectScore(idx, Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-center font-bold font-mono text-orange-950"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <label className="text-[9px] font-bold text-slate-500 block">Grade</label>
                          <span className="font-black text-xs text-orange-700">{sub.grade}</span>
                        </div>
                        <div className="col-span-5">
                          <label className="text-[9px] font-bold text-slate-500 block">Subject Remark</label>
                          <input
                            type="text"
                            value={sub.remark}
                            onChange={(e) => handleUpdateCmsSubjectRemark(idx, e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-slate-700 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black shadow-md shadow-orange-500/20 cursor-pointer border border-orange-400"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Candidate Report Card Content</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANNOUNCEMENTS & BROADCASTS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category:</span>
              {(['all', 'alert', 'schedule', 'policy', 'update'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAnnouncementFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    announcementFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              id="new-announcement-btn"
              onClick={() => {
                setEditingAnnouncement(null);
                setAnnouncementForm({
                  title: '',
                  content: '',
                  category: 'update',
                  target_audience: 'all',
                  is_pinned: false,
                  is_active: true
                });
                setShowAddAnnouncementModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Broadcast Announcement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements
              .filter(a => announcementFilter === 'all' || a.category === announcementFilter)
              .filter(a => {
                if (!globalSearchQuery.trim()) return true;
                const q = globalSearchQuery.toLowerCase();
                return a.title.toLowerCase().includes(q) ||
                  a.content.toLowerCase().includes(q) ||
                  a.category.toLowerCase().includes(q) ||
                  a.target_audience.toLowerCase().includes(q);
              })
              .map((anc) => (
                <div
                  key={anc.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm relative transition-all ${
                    anc.is_pinned ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        anc.category === 'alert'
                          ? 'bg-rose-100 text-rose-700'
                          : anc.category === 'schedule'
                          ? 'bg-blue-100 text-blue-700'
                          : anc.category === 'policy'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {anc.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Audience: <strong className="text-slate-600 capitalize">{anc.target_audience}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePinAnnouncement(anc.id)}
                        title={anc.is_pinned ? 'Unpin' : 'Pin to Top'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          anc.is_pinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAnnouncement(anc);
                          setAnnouncementForm({
                            title: anc.title,
                            content: anc.content,
                            category: anc.category,
                            target_audience: anc.target_audience,
                            is_pinned: anc.is_pinned,
                            is_active: anc.is_active
                          });
                          setShowAddAnnouncementModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(anc.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{anc.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{anc.content}</p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Published: {new Date(anc.created_at).toLocaleDateString()} by @{anc.created_by}</span>
                    <span className={`font-semibold ${anc.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {anc.is_active ? '● Active' : '○ Draft / Hidden'}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {announcements.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Announcements Created</h3>
              <p className="text-xs text-slate-500 mt-1">Broadcast important directives, schedules, and policy updates to users.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACADEMIC POLICIES & RULES                                          */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="pb-4 mb-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Academic Evaluation Weightings & Promotion Policies</h2>
              <p className="text-xs text-slate-500 mt-0.5">Define automated continuous assessment ratios, AI score tolerances, and promotion thresholds.</p>
            </div>

            <form onSubmit={handleSavePolicies} className="space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Score Weighting Distribution (Must Total 100%)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Continuous Assessment (CA) Weight (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={policyForm.ca_weight_percentage}
                      onChange={(e) => setPolicyForm({
                        ...policyForm,
                        ca_weight_percentage: Number(e.target.value),
                        exam_weight_percentage: 100 - Number(e.target.value)
                      })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Standard Edo State Ministry of Education benchmark is 40%.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Terminal Examination Weight (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={policyForm.exam_weight_percentage}
                      onChange={(e) => setPolicyForm({
                        ...policyForm,
                        exam_weight_percentage: Number(e.target.value),
                        ca_weight_percentage: 100 - Number(e.target.value)
                      })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Standard Edo State Ministry of Education benchmark is 60%.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Terminal Pass Mark (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={policyForm.pass_mark_percentage}
                    onChange={(e) => setPolicyForm({ ...policyForm, pass_mark_percentage: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Students below this mark receive 'Not Promoted' / 'Remedial' status.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AI vs Manual Discrepancy Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={policyForm.ai_discrepancy_threshold}
                    onChange={(e) => setPolicyForm({ ...policyForm, ai_discrepancy_threshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Flags scripts for senior examiner audit if deviation exceeds this limit.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Card Official Disclaimer & Anti-Fraud Notice
                </label>
                <textarea
                  rows={3}
                  value={policyForm.report_card_disclaimer}
                  onChange={(e) => setPolicyForm({ ...policyForm, report_card_disclaimer: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Academic Policies
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Audit Governance Rules
              </h3>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Reason-for-Change:</strong> Written pedagogical remarks are mandatory when examiners adjust AI grades.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Marking Scheme Locking:</strong> Cryptographic SHA-256 hash seals scheme criteria before student papers are processed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Standard Competition Ranking:</strong> Equal scores share rank (1st, 2nd, 2nd, 4th).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HELP CENTER & HANDBOOKS CMS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'handbook' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Articles & Guides</h3>
              <button
                onClick={() => {
                  setEditingArticle(null);
                  setArticleForm({
                    title: '',
                    category: 'Examiner Manual',
                    content: '',
                    is_published: true
                  });
                  setShowAddArticleModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Guide
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['all', 'Examiner Manual', 'AI Theory Marking', 'Grading Policy', 'Security & QR'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setArticleCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                    articleCategoryFilter === cat ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {handbookArticles
                .filter(a => articleCategoryFilter === 'all' || a.category === articleCategoryFilter)
                .filter(a => {
                  if (!globalSearchQuery.trim()) return true;
                  const q = globalSearchQuery.toLowerCase();
                  return a.title.toLowerCase().includes(q) ||
                    a.content.toLowerCase().includes(q) ||
                    a.category.toLowerCase().includes(q);
                })
                .map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticleView(art)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedArticleView?.id === art.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {art.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(art.last_updated).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{art.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{art.content}</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {selectedArticleView ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 mb-2">
                      {selectedArticleView.category}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedArticleView.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Author: <strong className="text-slate-600">{selectedArticleView.author}</strong> • Last Updated: {new Date(selectedArticleView.last_updated).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingArticle(selectedArticleView);
                        setArticleForm({
                          title: selectedArticleView.title,
                          category: selectedArticleView.category,
                          content: selectedArticleView.content,
                          is_published: selectedArticleView.is_published
                        });
                        setShowAddArticleModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(selectedArticleView.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                  {selectedArticleView.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-700">Select an Article to View</h3>
                <p className="text-xs text-slate-400">Choose a handbook guide from the left or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MASTER ENTITIES DIRECTORY                                          */}
      {/* ========================================================================= */}
      {activeTab === 'entities' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Sub Navigation */}
          <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'schools', label: `Schools (${schools.length})`, icon: SchoolIcon },
                { id: 'subjects', label: `Subjects (${subjects.length})`, icon: BookOpen },
                { id: 'classes', label: `Class Levels (${classes.length})`, icon: GraduationCap },
                { id: 'sessions', label: `Sessions & Terms (${sessions.length})`, icon: Calendar },
                { id: 'grades', label: `Grade Scales (${gradeScales.length})`, icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setEntitySubTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      entitySubTab === tab.id
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {entitySubTab === 'schools' && (
                <button
                  onClick={() => {
                    setEditingSchool(null);
                    setSchoolForm({ name: '', code: '', lga: 'Oredo', address: '', head_teacher: '' });
                    setShowSchoolModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Add School
                </button>
              )}

              {entitySubTab === 'subjects' && (
                <button
                  onClick={() => {
                    setEditingSubject(null);
                    setSubjectForm({ code: '', name: '', category: 'Core' });
                    setShowSubjectModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject
                </button>
              )}

              {entitySubTab === 'classes' && (
                <button
                  onClick={() => {
                    setEditingClass(null);
                    setClassForm({ name: '', category: 'Primary' });
                    setShowClassModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Class
                </button>
              )}

              {entitySubTab === 'sessions' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSessionForm({ name: '', start_date: '', end_date: '', is_current: true });
                      setShowSessionModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Session
                  </button>
                  <button
                    onClick={() => {
                      setTermForm({ name: '3rd Term', session_id: sessions[0]?.id || '', start_date: '', end_date: '', is_current: true });
                      setShowTermModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Term
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SubTab Content */}
          <div className="p-4">
            {entitySubTab === 'schools' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">School Name</th>
                      <th className="py-2.5 px-3">LGA</th>
                      <th className="py-2.5 px-3">Head Teacher</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schools
                      .filter(s => s.name.toLowerCase().includes(entitySearch.toLowerCase()) || s.code.toLowerCase().includes(entitySearch.toLowerCase()))
                      .map((sch) => (
                        <tr key={sch.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{sch.code}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{sch.name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{sch.lga}</td>
                          <td className="py-2.5 px-3 text-slate-600">{sch.head_teacher}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setEditingSchool(sch);
                                setSchoolForm({
                                  name: sch.name,
                                  code: sch.code,
                                  lga: sch.lga,
                                  address: sch.address,
                                  head_teacher: sch.head_teacher
                                });
                                setShowSchoolModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 mr-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${sch.name}?`)) {
                                  const res = store.deleteSchool(sch.id);
                                  if (res.success) { showFeedback('success', res.message); onRefresh(); }
                                  else showFeedback('error', res.message);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {entitySubTab === 'subjects' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Subject Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects
                      .filter(s => s.name.toLowerCase().includes(entitySearch.toLowerCase()) || s.code.toLowerCase().includes(entitySearch.toLowerCase()))
                      .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{sub.code}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{sub.category}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setEditingSubject(sub);
                                setSubjectForm({ code: sub.code, name: sub.name, category: sub.category });
                                setShowSubjectModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 mr-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete subject ${sub.name}?`)) {
                                  const res = store.deleteSubject(sub.id);
                                  if (res.success) { showFeedback('success', res.message); onRefresh(); }
                                  else showFeedback('error', res.message);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {entitySubTab === 'classes' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Class Level</th>
                      <th className="py-2.5 px-3">Level Tier</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{cls.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">{cls.category}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete class ${cls.name}?`)) {
                                const res = store.deleteClass(cls.id);
                                if (res.success) { showFeedback('success', res.message); onRefresh(); }
                                else showFeedback('error', res.message);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {entitySubTab === 'sessions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Academic Sessions</h4>
                  <div className="space-y-2">
                    {sessions.map((ses) => (
                      <div key={ses.id} className="p-3 border rounded-xl flex items-center justify-between bg-slate-50/40">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{ses.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ses.is_active ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span>
                          ) : (
                            <button
                              onClick={() => {
                                store.updateSession(ses.id, { is_active: true });
                                onRefresh();
                              }}
                              className="text-[10px] text-indigo-600 hover:underline font-semibold"
                            >
                              Make Active
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Academic Terms</h4>
                  <div className="space-y-2">
                    {terms.map((trm) => {
                      const ses = sessions.find(s => s.id === trm.session_id);
                      return (
                        <div key={trm.id} className="p-3 border rounded-xl flex items-center justify-between bg-slate-50/40">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{trm.name} <span className="text-slate-400 font-normal">({ses?.name})</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            {trm.is_active ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span>
                            ) : (
                              <button
                                onClick={() => {
                                  store.updateTerm(trm.id, { is_active: true });
                                  onRefresh();
                                }}
                                className="text-[10px] text-indigo-600 hover:underline font-semibold"
                              >
                                Make Active
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {entitySubTab === 'grades' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Scale Name</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Percentage Range</th>
                      <th className="py-2.5 px-3">GPA Equivalent</th>
                      <th className="py-2.5 px-3">Pedagogical Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...gradeScales].sort((a, b) => b.min_percent - a.min_percent).map((gs) => (
                      <tr key={gs.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{gs.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            gs.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            gs.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            gs.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {gs.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{gs.min_percent}% - {gs.max_percent}%</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{gs.gpa_points.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-slate-600">{gs.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DATA LIFECYCLE */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Access Seed Only
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">Quick Access Login Accounts</h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              EARPMS no longer reseeds schools, pupils, classes, examinations, questions, scripts,
              results, report cards or other business records. Only the authorized Quick Access login
              accounts are seeded on a genuinely new database. Existing business data is preserved
              across relaunches and application updates.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!confirm('Restore only the Quick Access login accounts? Existing schools, pupils, exams, scripts, results and report cards will not be changed.')) return;
                const res = store.restoreQuickAccessSeed();
                showFeedback(res.success ? 'success' : 'error', res.message);
                if (res.success) onRefresh();
              }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Restore Quick Access Only
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Danger Zone
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">Reset Business Database</h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Permanently clears business records when intentionally requested. This does not
              recreate benchmark data; Quick Access logins remain available.
            </p>
            <button
              type="button"
              onClick={() => {
                setResetConfirmInput('');
                setShowResetConfirmModal(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset Business Database
            </button>
          </div>
        </div>
      )}

      {/* 2. IMPORT JSON MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Restore Database Backup from JSON
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Or Paste JSON Content</label>
                <textarea
                  rows={8}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"users": [...], "schools": [...], ...}'
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportJsonBackup}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
              >
                Restore Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANNOUNCEMENT FORM MODAL */}
      {showAddAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingAnnouncement ? 'Edit Broadcast Announcement' : 'New Broadcast Announcement'}
              </h3>
              <button onClick={() => setShowAddAnnouncementModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. 2nd Term Scoring Deadline"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="update">General Update</option>
                    <option value="alert">Urgent Alert</option>
                    <option value="schedule">Exam Schedule</option>
                    <option value="policy">Policy Directive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={announcementForm.target_audience}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, target_audience: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Portal Users</option>
                    <option value="examiners">Examiners & Markers Only</option>
                    <option value="admins">Administrators & HQ Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Write clear instructions or official directives..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_pinned}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Pin to Top
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_active}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Active (Published)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                >
                  {editingAnnouncement ? 'Save Changes' : 'Publish Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. HANDBOOK ARTICLE FORM MODAL */}
      {showAddArticleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingArticle ? 'Edit Handbook Guide' : 'Create Knowledge Base Article'}
              </h3>
              <button onClick={() => setShowAddArticleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="e.g. OMR Optical Intake Best Practices"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guide Category</label>
                <select
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Examiner Manual">Examiner Manual</option>
                  <option value="AI Theory Marking">AI Theory Marking</option>
                  <option value="Grading Policy">Grading Policy</option>
                  <option value="Security & QR">Security & QR</option>
                  <option value="General FAQ">General FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Body / Instructions</label>
                <textarea
                  rows={8}
                  required
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  placeholder="Write step-by-step procedures or policy documentation..."
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddArticleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                >
                  {editingArticle ? 'Update Guide' : 'Create Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SCHOOL FORM MODAL */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingSchool ? 'Edit School' : 'Add Model School'}</h3>
              <button onClick={() => setShowSchoolModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSchool} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                    placeholder="EDS-ORD-009"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LGA</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.lga}
                    onChange={(e) => setSchoolForm({ ...schoolForm, lga: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Head Teacher / Principal Name</label>
                <input
                  type="text"
                  value={schoolForm.head_teacher}
                  onChange={(e) => setSchoolForm({ ...schoolForm, head_teacher: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowSchoolModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow">Save School</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SUBJECT FORM MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingSubject ? 'Edit Subject' : 'Add Subject to Catalog'}</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Cultural & Creative Arts"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="CCA-P6"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={subjectForm.category}
                    onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="Core">Core</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Language">Language</option>
                    <option value="Science">Science</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. CLASS FORM MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingClass ? 'Edit Class' : 'Add Class Level'}</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Level Name</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g. Primary 5"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={classForm.category}
                  onChange={(e) => setClassForm({ ...classForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Primary">Primary</option>
                  <option value="Junior Secondary">Junior Secondary</option>
                  <option value="Senior Secondary">Senior Secondary</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. SESSION FORM MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Academic Session</h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.start_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.end_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowSessionModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow">Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. TERM FORM MODAL */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Term</h3>
              <button onClick={() => setShowTermModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveTerm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term Name</label>
                <input
                  type="text"
                  required
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  placeholder="3rd Term"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Session</label>
                <select
                  value={termForm.session_id}
                  onChange={(e) => setTermForm({ ...termForm, session_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowTermModal(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow">Add Term</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
