import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  QrCode,
  FileText,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Hash,
  Download,
  Search,
  Layers,
  Sliders,
  Minus,
  Filter,
  Edit2,
  UserPlus,
  X,
  RefreshCw
} from 'lucide-react';
import {
  Examination,
  Question,
  MarkingScheme,
  Rubric,
  StudentExamPaper,
  Subject,
  ClassLevel,
  Student
} from '../types';
import { store, AppStoreState } from '../lib/store';
import { generateQrDataUrl } from '../lib/qr';
import { DocumentImportPipelineModal } from './DocumentImportPipelineModal';
import { BulkAddQuestionsModal } from './BulkAddQuestionsModal';
import { ExamApprovalWorkflowModal } from './ExamApprovalWorkflowModal';
import { StudentQuestionPapersPrintModal } from './StudentQuestionPapersPrintModal';

interface ExaminationsViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
  onOpenStudentCbtModal?: () => void;
  onNavigate?: (tab: string) => void;
}

export const ExaminationsView: React.FC<ExaminationsViewProps> = ({
  storeState,
  onRefresh,
  onOpenStudentCbtModal,
  onNavigate
}) => {
  const {
    examinations,
    questions,
    markingSchemes,
    rubrics,
    studentPapers,
    subjects,
    classes,
    sessions,
    terms,
    students,
    currentUser
  } = storeState;

  // Role booleans (Strict 4 Roles)
  const isTeacher = currentUser.role === 'teacher';
  const isPrincipal = currentUser.role === 'principal';
  const isDirector = currentUser.role === 'director';
  const isSuperAdmin = currentUser.role === 'super-admin';
  const canPerformCrud = isSuperAdmin || isDirector || isPrincipal || isTeacher;

  // Examinations Search and Filter States
  const [examSearch, setExamSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState('ALL');
  const [filterSubjectId, setFilterSubjectId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [refreshingExams, setRefreshingExams] = useState(false);

  // Filtered Examinations List
  const filteredExams = examinations.filter(exam => {
    const subj = subjects.find(s => s.id === exam.subject_id);
    const cls = classes.find(c => c.id === exam.class_id);
    
    // Search query match
    if (examSearch.trim()) {
      const q = examSearch.toLowerCase().trim();
      const matchTitle = exam.title.toLowerCase().includes(q);
      const matchCode = exam.code.toLowerCase().includes(q);
      const matchSubj = subj?.name.toLowerCase().includes(q) || subj?.code.toLowerCase().includes(q);
      const matchClass = cls?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchSubj && !matchClass) return false;
    }

    // Class filter
    if (filterClassId !== 'ALL' && exam.class_id !== filterClassId) {
      return false;
    }

    // Subject filter
    if (filterSubjectId !== 'ALL' && exam.subject_id !== filterSubjectId) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'ALL' && exam.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'questions' | 'schemes' | 'papers'>('questions');

  useEffect(() => {
    if (filteredExams.length > 0 && !filteredExams.some(ex => ex.id === selectedExamId)) {
      setSelectedExamId(filteredExams[0].id);
    }
  }, [filteredExams, selectedExamId]);
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEnrollStudentsModal, setShowEnrollStudentsModal] = useState(false);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [enrollmentMode, setEnrollmentMode] = useState<'class' | 'individual'>('class');
  const [selectedEnrollmentClassId, setSelectedEnrollmentClassId] = useState<string>('');
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showApprovalWorkflowModal, setShowApprovalWorkflowModal] = useState(false);
  const [showStudentPapersPrintModal, setShowStudentPapersPrintModal] = useState(false);
  const [initialPrintStudentId, setInitialPrintStudentId] = useState<string | undefined>(undefined);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showMasterPaperModal, setShowMasterPaperModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showManageSchemes, setShowManageSchemes] = useState(false);
  const [selectedPaperForPrint, setSelectedPaperForPrint] = useState<StudentExamPaper | null>(null);
  const [paperQrUrls, setPaperQrUrls] = useState<{ [key: string]: string }>({});

  const selectedExam = examinations.find(e => e.id === selectedExamId);
  const examQuestions = questions.filter(q => q.examination_id === selectedExamId).sort((a, b) => a.question_number - b.question_number);
  const examSchemes = markingSchemes.filter(s => s.examination_id === selectedExamId && !s.is_deleted && !s.is_hidden).sort((a, b) => b.version - a.version);
  const allExamSchemes = markingSchemes.filter(s => s.examination_id === selectedExamId).sort((a, b) => b.version - a.version);
  const activeScheme = examSchemes[0];
  const examRubrics = rubrics.filter(r => r.examination_id === selectedExamId).sort((a, b) => b.version - a.version);
  const activeRubric = examRubrics[0];
  const examPapers = studentPapers.filter(p => p.examination_id === selectedExamId);
  const selectedPaperQuestions = useMemo(() => {
    if (!selectedPaperForPrint) return [];
    const qMap = new Map(examQuestions.map(q => [q.id, q]));
    if (selectedPaperForPrint.assigned_question_ids?.length) {
      return selectedPaperForPrint.assigned_question_ids
        .map(id => qMap.get(id))
        .filter((q): q is Question => Boolean(q));
    }
    return examQuestions;
  }, [selectedPaperForPrint, examQuestions]);

  // New Exam Form State
  const [newExam, setNewExam] = useState({
    title: '',
    subject_id: subjects[0]?.id || '',
    class_id: classes[0]?.id || '',
    session_id: sessions[0]?.id || '',
    term_id: terms[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 90,
    maximum_marks: 100,
    passing_percentage: 50,
    question_paper_mode: 'fixed' as 'fixed' | 'variable',
    variable_question_count: 5
  });

  // New Question Form State
  const [newQuestion, setNewQuestion] = useState<{
    question_type: 'objective' | 'structured' | 'theory';
    text: string;
    options: { key: string; text: string }[];
    correct_answer: string;
    expected_answer: string;
    maximum_marks: number;
    answer_lines: number;
  }>({
    question_type: 'objective',
    text: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ],
    correct_answer: 'A',
    expected_answer: '',
    maximum_marks: 10,
    answer_lines: 8
  });

  // Sync selectedExamId when examinations change
  useEffect(() => {
    if (!examinations.some(e => e.id === selectedExamId)) {
      setSelectedExamId(examinations[0]?.id || '');
    }
  }, [examinations, selectedExamId]);

  // Generate QR code data URLs for student papers
  useEffect(() => {
    async function loadQrs() {
      const urls: { [key: string]: string } = {};
      for (const p of examPapers) {
        if (!paperQrUrls[p.id]) {
          const url = await generateQrDataUrl(p.qr_code_payload);
          urls[p.id] = url;
        }
      }
      if (Object.keys(urls).length > 0) {
        setPaperQrUrls(prev => ({ ...prev, ...urls }));
      }
    }
    if (examPapers.length > 0) {
      loadQrs();
    }
  }, [examPapers]);

  // Handle Question Verification
  const handleToggleVerification = (questionId: string, current: boolean) => {
    store.verifyQuestion(questionId, !current);
    onRefresh();
  };

  const handleVerifyAll = () => {
    examQuestions.forEach(q => {
      if (!q.verified) {
        store.verifyQuestion(q.id, true);
      }
    });
    onRefresh();
  };

  // Handle Create Scheme
  const handleCreateScheme = () => {
    if (!selectedExam) return;
    const res = store.createMarkingScheme(selectedExam.id);
    alert(res.message);
    onRefresh();
  };

  // Handle Approve Scheme
  const handleApproveScheme = (schemeId: string) => {
    const res = store.approveMarkingScheme(schemeId);
    alert(res.message);
    onRefresh();
  };

  // Handle Lock Scheme
  const handleLockScheme = (schemeId: string) => {
    const res = store.lockMarkingScheme(schemeId);
    alert(res.message);
    onRefresh();
  };

  // Handle Rubric Generation from Current Scheme
  const handleRegenerateRubric = () => {
    if (!selectedExam) return;
    const res = store.regenerateRubric(selectedExam.id);
    alert(res.message);
    onRefresh();
  };

  // Handle Generate Candidate Papers
  const handleGeneratePapers = () => {
    if (!selectedExam) return;
    const res = store.generateStudentPapers(selectedExam.id);
    alert(res.message);

    onRefresh();
  };

  // AI Document Import Handler
  const handleImportQuestions = async () => {
    if (!selectedExam || !importText.trim()) return;
    setIsImporting(true);

    try {
      const data = await store.parseExamDocument({
        documentText: importText,
        defaultSubject: subjects.find(s => s.id === selectedExam.subject_id)?.name,
        defaultClass: classes.find(c => c.id === selectedExam.class_id)?.name
      });
      if (data?.error) throw new Error(data.error);

      if (data.questions && data.questions.length > 0) {
        const addedCount = store.bulkAddQuestionsAndAnswers(selectedExam.id, data.questions);
        alert(`Successfully extracted and imported ${addedCount} questions into the bank.`);
        setShowImportModal(false);
        setImportText('');
        onRefresh();
      } else {
        alert('No questions could be extracted. Please check the document format.');
      }
    } catch (e: any) {
      alert('AI Extraction error: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Create New Exam Handler
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      const res = store.updateExamination(editingExam.id, newExam);
      alert(res.message);
      if (res.success) setSelectedExamId(editingExam.id);
    } else {
      const created = store.createExamination(newExam);
      setSelectedExamId(created.id);
    }
    setEditingExam(null);
    setShowNewExamModal(false);
    onRefresh();
  };

  const totalQuestionMarks = examQuestions.reduce((sum, q) => sum + q.maximum_marks, 0);
  const allQuestionsVerified = examQuestions.length > 0 && examQuestions.every(q => q.verified);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Examination Operations & Question Bank
              </h2>
              {isDirector && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Director Quality Assurance
                </span>
              )}
              {isPrincipal && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Principal Approval Scope
                </span>
              )}
              {isTeacher && (
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  Teacher Authoring Scope
                </span>
              )}
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-bold border border-orange-200">
                  Super-Admin Master Control
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isTeacher
                ? 'Upload combined Q&A question sets, set answer lines for theory, preview marking schemes, and submit for approval.'
                : 'Manage verified questions, theoretical answer lines, variable vs fixed paper modes, versioned schemes, and CBT/printed papers.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Student CBT & Offline Exam Portal launcher */}
          {onOpenStudentCbtModal && (
            <button
              onClick={onOpenStudentCbtModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              title="Launch Student Candidate CBT Portal"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Student CBT & Offline Portal</span>
            </button>
          )}

          {/* Document & Q&A Pipeline (Teachers, Principal, Super Admin) */}
          <button
            onClick={() => setShowPipelineModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Document & Q&A Pipeline</span>
          </button>

          {!isTeacher && (
            <button
              onClick={() => setShowMasterPaperModal(true)}
              disabled={!selectedExam || examQuestions.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors border border-slate-300 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Master Exam Paper</span>
            </button>
          )}

          {canPerformCrud && (
            <button
              onClick={() => setShowNewExamModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar for Examinations */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Filter className="w-4 h-4 text-orange-500" />
            <span>Search & Filter Examinations ({filteredExams.length} of {examinations.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={refreshingExams}
              onClick={async () => {
                setRefreshingExams(true);
                try { await store.hydrate(); } finally { setRefreshingExams(false); }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold disabled:opacity-50"
              title="Reload all examinations from the server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingExams ? 'animate-spin' : ''}`} />
              Refresh Exams
            </button>
            {(examSearch || filterClassId !== 'ALL' || filterSubjectId !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => {
                setExamSearch('');
                setFilterClassId('ALL');
                setFilterSubjectId('ALL');
                setFilterStatus('ALL');
              }}
              className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer text-xs"
            >
              Reset Filters
            </button>
          )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search exam by title, code or subject..."
              value={examSearch}
              onChange={e => setExamSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={filterClassId}
              onChange={e => setFilterClassId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">All Class Levels</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={filterSubjectId}
              onChange={e => setFilterSubjectId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="questions_verified">Questions Verified</option>
              <option value="scheme_locked">Scheme Locked</option>
              <option value="submitted_for_approval">Submitted for Approval</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="ready">Ready</option>
              <option value="marked">Marked</option>
              <option value="finalized">Finalized</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Examination Card Grid */}
        <div className="pt-3 border-t border-slate-100">
          {filteredExams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No examinations found</p>
              <p className="text-[11px] text-slate-500 mt-1">Try another search term or reset the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredExams.map(ex => {
                const isSelected = ex.id === selectedExamId;
                const subj = subjects.find(s => s.id === ex.subject_id);
                const cls = classes.find(c => c.id === ex.class_id);
                const candidateCount = students.filter(st =>
                  st.class_id === ex.class_id &&
                  (!ex.school_id || st.school_id === ex.school_id) &&
                  (st.status || 'active') === 'active'
                ).length;
                const paperCount = studentPapers.filter(p => p.examination_id === ex.id).length;
                const statusLabel = (ex.status || 'draft').replace(/_/g, ' ');
                const statusClass = ex.status === 'approved' || ex.status === 'ready'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : ex.status === 'submitted_for_approval'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : ex.status === 'changes_requested'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : ex.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelectedExamId(ex.id)}
                    className={`text-left rounded-2xl border p-4 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50/60 ring-2 ring-orange-400/20'
                        : 'border-slate-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white truncate max-w-[190px]">{ex.code}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${statusClass}`}>{statusLabel}</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">{ex.title}</h3>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange-500 text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="rounded-xl bg-white/80 border border-slate-200 p-2">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">Class</span>
                        <span className="text-[11px] font-bold text-slate-800">{cls?.name || '—'}</span>
                      </div>
                      <div className="rounded-xl bg-white/80 border border-slate-200 p-2">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">Subject</span>
                        <span className="text-[11px] font-bold text-slate-800 truncate block">{subj?.name || '—'}</span>
                      </div>
                      <div className="rounded-xl bg-white/80 border border-slate-200 p-2">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">Date / Duration</span>
                        <span className="text-[11px] font-bold text-slate-800">{ex.date} • {ex.duration_minutes}m</span>
                      </div>
                      <div className="rounded-xl bg-white/80 border border-slate-200 p-2">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">Candidates / Papers</span>
                        <span className="text-[11px] font-bold text-slate-800">{candidateCount} / {paperCount}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">{ex.question_paper_mode === 'variable' ? `Variable • ${ex.variable_question_count || 5} Qs` : 'Fixed • Unified Questions'}</span>
                      <span className={isSelected ? 'text-orange-700' : 'text-slate-400'}>{isSelected ? 'Selected' : 'Open exam'} →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedExam && (
        <>
          {/* Examination Detail Header Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20">
                    {selectedExam.code}
                  </span>
                  <span className="text-xs text-slate-400">
                    {subjects.find(s => s.id === selectedExam.subject_id)?.name} • {classes.find(c => c.id === selectedExam.class_id)?.name}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedExam.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    selectedExam.status === 'submitted_for_approval' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                    selectedExam.status === 'changes_requested' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    selectedExam.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}>
                    {selectedExam.status ? selectedExam.status.replace(/_/g, ' ') : 'DRAFT'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{selectedExam.title}</h3>
                {isSuperAdmin && selectedExam.status !== 'finalized' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExam(selectedExam);
                      setNewExam({
                        title: selectedExam.title,
                        subject_id: selectedExam.subject_id,
                        class_id: selectedExam.class_id,
                        session_id: selectedExam.session_id,
                        term_id: selectedExam.term_id,
                        date: selectedExam.date || new Date().toISOString().split('T')[0],
                        duration_minutes: selectedExam.duration_minutes,
                        maximum_marks: selectedExam.maximum_marks,
                        passing_percentage: selectedExam.passing_percentage,
                        question_paper_mode: selectedExam.question_paper_mode || 'fixed',
                        variable_question_count: selectedExam.variable_question_count || 5
                      });
                      setShowNewExamModal(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Examination
                  </button>
                )}
                {isSuperAdmin && (
  <button
    type="button"
    onClick={() => {
      let warning = `Delete "${selectedExam.title}"? This will permanently remove:\n`;
      warning += `- All questions, marking schemes, rubrics, candidate papers, answer scripts, and results.\n`;
      const hasFinalized = store.getState().results.some(r => r.examination_id === selectedExam.id && r.status === 'finalized');
      if (hasFinalized) {
        warning += `\n⚠️ WARNING: This examination has FINALIZED RESULTS. Deleting it will permanently erase them.\n`;
        warning += `This action is irreversible. Only Super Admin can delete finalized exams.`;
      }
      if (!confirm(warning)) return;
      const res = store.deleteRecord('examination', selectedExam.id);
      alert(res.message);
      if (res.success) {
        setSelectedExamId('');
        onRefresh();
      }
    }}
    className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black"
  >
    <Trash2 className="w-3.5 h-3.5" /> Delete Examination
  </button>
)}
              </div>

              <div className="flex items-center gap-6 text-xs bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Maximum Marks</span>
                  <span className="font-bold text-white text-sm">{selectedExam.maximum_marks} Marks</span>
                </div>
                <div className="border-l border-slate-700 pl-4">
                  <span className="text-slate-400 block text-[10px]">Pass Mark</span>
                  <span className="font-bold text-emerald-400 text-sm">{selectedExam.passing_percentage}%</span>
                </div>
                <div className="border-l border-slate-700 pl-4">
                  <span className="text-slate-400 block text-[10px]">Duration</span>
                  <span className="font-bold text-white text-sm">{selectedExam.duration_minutes} Mins</span>
                </div>
              </div>
            </div>

            {/* Variable vs Fixed Exam Question Paper Mode Controller */}
            <div className="p-4 rounded-xl bg-slate-800/95 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Exam Question Paper Mode:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                      selectedExam.question_paper_mode === 'variable'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-teal-500 text-slate-950'
                    }`}>
                      {selectedExam.question_paper_mode === 'variable'
                        ? `VARIABLE (${selectedExam.variable_question_count || 5} Questions per Student)`
                        : 'FIXED (Unified Questions for All Students)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedExam.question_paper_mode === 'variable'
                      ? `Every student gets a distinct, randomized set of ${selectedExam.variable_question_count || 5} questions from the pool of ${examQuestions.length} questions.`
                      : `All enrolled candidates receive the exact same unified examination question paper.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Fixed / Variable Toggle */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      store.updateExamPaperContentMode(selectedExam.id, 'fixed', selectedExam.variable_question_count || 5);
                      onRefresh();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (selectedExam.question_paper_mode || 'fixed') === 'fixed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Fixed Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      store.updateExamPaperContentMode(selectedExam.id, 'variable', selectedExam.variable_question_count || 5);
                      onRefresh();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedExam.question_paper_mode === 'variable'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Variable Paper
                  </button>
                </div>

                {/* Variable Count Input */}
                {selectedExam.question_paper_mode === 'variable' && (
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[11px] font-bold">Questions to Select:</span>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, examQuestions.length)}
                      value={selectedExam.variable_question_count || 5}
                      onChange={(e) => {
                        const count = Math.max(1, Number(e.target.value));
                        store.updateExamPaperContentMode(selectedExam.id, 'variable', count);
                        onRefresh();
                      }}
                      className="w-14 px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-center text-emerald-300 font-black text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px]">/ {examQuestions.length} in Pool</span>
                  </div>
                )}
              </div>
            </div>

            {/* Principal Moderation & Workflow Banner */}
            <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedExam.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  selectedExam.status === 'submitted_for_approval' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                  selectedExam.status === 'changes_requested' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>

                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Workflow State:</span>
                    <span className="text-emerald-400 capitalize">{selectedExam.status?.replace(/_/g, ' ') || 'Draft Preparation'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedExam.status === 'approved' && `Approved by ${selectedExam.reviewed_by_name || 'Principal'} on ${selectedExam.reviewed_at ? new Date(selectedExam.reviewed_at).toLocaleDateString() : 'Record'}. Ready for exam printing & conduct.`}
                    {selectedExam.status === 'submitted_for_approval' && `Submitted on ${selectedExam.submitted_at ? new Date(selectedExam.submitted_at).toLocaleDateString() : 'Today'}. Awaiting Principal's formal review.`}
                    {selectedExam.status === 'changes_requested' && 'Principal has reviewed and provided feedback. Review requested adjustments.'}
                    {(!selectedExam.status || selectedExam.status === 'draft' || selectedExam.status === 'ready') && 'Drafting questions, marking scheme, and rubric. Submit to Principal when complete.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Submit to Principal Button (Teacher/Admin) */}
                {(!selectedExam.status || selectedExam.status === 'draft' || selectedExam.status === 'ready' || selectedExam.status === 'changes_requested') && (
                  <button
                    onClick={() => setShowApprovalWorkflowModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Submit for Principal Approval</span>
                  </button>
                )}

                {/* Moderate & Sign-Off Button (Principal or Super-Admin) */}
                {selectedExam.status === 'submitted_for_approval' && (isPrincipal || isSuperAdmin) && (
                  <button
                    onClick={() => setShowApprovalWorkflowModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-black text-xs transition-colors shadow-md cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Moderate & Formally Sign Off</span>
                  </button>
                )}

                {/* View Audit Trail */}
                <button
                  onClick={() => setShowApprovalWorkflowModal(true)}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Workflow History
                </button>
              </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex items-center gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => setActiveSubTab('questions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'questions'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Questions Bank ({examQuestions.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('schemes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'schemes'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>2. Marking Schemes & Rubrics ({examSchemes.length})</span>
                {activeScheme?.status === 'locked' && <Lock className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                onClick={() => setActiveSubTab('papers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'papers'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>3. Candidate Question Papers ({examPapers.length})</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Question Bank & Verification */}
          {activeSubTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Questions Summary:
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-800">
                    {examQuestions.length} Questions ({totalQuestionMarks} / {selectedExam.maximum_marks} Marks)
                  </span>
                  {allQuestionsVerified ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Questions Verified
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Verification Gate Incomplete
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bulk Add Q&A</span>
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>AI Document / Text Importer</span>
                  </button>

                  <button
                    onClick={() => setShowAddQuestionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>

                  {!allQuestionsVerified && examQuestions.length > 0 && (
                    <button
                      onClick={handleVerifyAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {examQuestions.map(q => {
                  const currentLines = q.answer_lines || (q.question_type === 'theory' ? 8 : (q.question_type === 'structured' ? 4 : 0));
                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        q.verified
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-300 font-black text-xs flex items-center justify-center">
                            Q{q.question_number}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            q.question_type === 'objective' ? 'bg-emerald-100 text-emerald-800' :
                            q.question_type === 'structured' ? 'bg-teal-100 text-teal-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {q.question_type}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {q.maximum_marks} Marks
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Ruled lines adjuster for theoretical questions */}
                          {q.question_type !== 'objective' && (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-xs border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-600">Ruled Lines:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = Math.max(2, currentLines - 1);
                                    store.updateQuestion(q.id, { answer_lines: next });
                                    onRefresh();
                                  }}
                                  className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold"
                                  title="Decrease line space"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-black text-emerald-900 text-xs">
                                  {currentLines}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = Math.min(30, currentLines + 1);
                                    store.updateQuestion(q.id, { answer_lines: next });
                                    onRefresh();
                                  }}
                                  className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold"
                                  title="Increase line space"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowAddQuestionModal(true);
                              setNewQuestion({
                                question_type: q.question_type, text: q.text,
                                options: q.options?.length ? q.options.map(o => ({...o})) : [
                                  { key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }
                                ],
                                correct_answer: q.correct_answer || 'A', expected_answer: q.expected_answer || '',
                                maximum_marks: q.maximum_marks, answer_lines: q.answer_lines || 8
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200" title="Edit question"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (confirm(`Delete Q${q.question_number}? This cannot be undone.`)) { const res = store.deleteQuestion(q.id); alert(res.message); if (res.success) onRefresh(); } }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200" title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleVerification(q.id, q.verified)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              q.verified
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {q.verified ? 'Verified' : 'Click to Verify'}
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 mb-3 leading-relaxed">
                        {q.text}
                      </p>

                      {/* Options if Objective */}
                      {q.question_type === 'objective' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {q.options.map(opt => (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-lg text-xs border flex items-center gap-2 ${
                                opt.key === q.correct_answer
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded flex items-center justify-center font-black ${
                                opt.key === q.correct_answer ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                              {opt.key === q.correct_answer && (
                                <span className="ml-auto text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                                  KEY
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ruled lines preview for theoretical questions */}
                      {q.question_type !== 'objective' && (
                        <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700">Ruled Answer Space for Student:</span>
                            <span>{currentLines} printed lines allocated</span>
                          </div>
                          <div className="space-y-1">
                            {Array.from({ length: Math.min(currentLines, 4) }).map((_, idx) => (
                              <div key={idx} className="h-5 border-b border-dashed border-slate-300 w-full flex items-end justify-between px-1">
                                <span className="text-[8px] text-slate-300 font-mono">Line {idx + 1}</span>
                              </div>
                            ))}
                            {currentLines > 4 && (
                              <div className="text-[10px] text-slate-400 text-center pt-0.5">
                                + {currentLines - 4} more ruled lines on candidate exam paper
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expected Answer / Steps */}
                      {q.expected_answer && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700 block mb-1">
                            Official Expected Answer & Steps:
                          </span>
                          <p className="text-slate-600 font-mono text-[11px] leading-relaxed">
                            {q.expected_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {examQuestions.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">No Questions Ingested Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                      Import a question paper document or manually add verified questions to activate the marking scheme lifecycle.
                    </p>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Open Question Importer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Marking Schemes & Rubric Lifecycle */}
          {activeSubTab === 'schemes' && (
            <div className="space-y-6">
              {/* Lifecycle Controller Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Marking Scheme Lifecycle Controller</span>
                      {activeScheme && (
                        <span className="font-mono text-xs text-slate-500">
                          v{activeScheme.version}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Controlled lifecycle: Draft → Approved → Locked. Rubrics are generated from the CURRENT marking scheme.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Create Scheme Button (Gated by verified questions) */}
                    <button
                      onClick={handleCreateScheme}
                      disabled={!allQuestionsVerified || examQuestions.length === 0}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        allQuestionsVerified && examQuestions.length > 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={!allQuestionsVerified ? 'All questions must be verified first' : 'Create new marking scheme version'}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Scheme from Verified Questions</span>
                    </button>

                    {activeScheme && activeScheme.status === 'draft' && (
                      <button
                        onClick={() => handleApproveScheme(activeScheme.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Scheme</span>
                      </button>
                    )}

                    {activeScheme && activeScheme.status === 'approved' && (
                      <button
                        onClick={() => handleLockScheme(activeScheme.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Lock Scheme (Make Immutable)</span>
                      </button>
                    )}

                    {activeScheme && (activeScheme.status === 'approved' || activeScheme.status === 'locked') && (
                      <button
                        onClick={handleRegenerateRubric}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Regenerate Rubric from Current Scheme</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Marking Scheme Details */}
                {activeScheme ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full font-bold uppercase ${
                          activeScheme.status === 'locked' ? 'bg-teal-100 text-teal-800' :
                          activeScheme.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {activeScheme.status}
                        </span>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cryptographic Integrity Hash</span>
                          <span className="font-mono font-bold text-slate-800">{activeScheme.hash}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Total Scheme Criteria</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {activeScheme.criteria.length} Criteria • {activeScheme.criteria.reduce((s, c) => s + c.marks, 0)} Marks
                        </span>
                      </div>
                    </div>

                    {/* Criteria List */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Marking Criteria Breakdown
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeScheme.criteria.map((c, idx) => (
                          <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                Q{idx + 1}: {c.label}
                              </span>
                              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {c.marks} Marks
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {c.guidance}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No marking schemes created yet. Ensure all questions are verified in Sub-Tab 1 and click "Create Scheme from Verified Questions".
                  </div>
                )}

                {/* Manage Scheme Versions (Unhide/Hide/Delete) */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowManageSchemes(!showManageSchemes)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Version History & Audit Archives ({allExamSchemes.length} total versions)</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showManageSchemes ? 'rotate-180' : ''}`} />
                  </button>

                  {showManageSchemes && (
                    <div className="mt-4 space-y-2">
                      {allExamSchemes.map(ms => (
                        <div
                          key={ms.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            ms.is_deleted ? 'bg-rose-50 border-rose-200 opacity-60' :
                            ms.is_hidden ? 'bg-slate-100 border-slate-300 opacity-70' :
                            'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">Version {ms.version}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{ms.hash}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white border border-slate-200">
                              {ms.status}
                            </span>
                            {ms.is_hidden && <span className="text-[10px] text-amber-700 font-bold">(Hidden)</span>}
                            {ms.is_deleted && <span className="text-[10px] text-rose-700 font-bold">(Soft Deleted)</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            {!ms.is_deleted && (
                              <>
                                {ms.is_hidden ? (
                                  <button
                                    onClick={() => {
                                      store.unhideMarkingScheme(ms.id);
                                      onRefresh();
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold cursor-pointer"
                                  >
                                    Restore (Unhide)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      store.hideMarkingScheme(ms.id);
                                      onRefresh();
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold cursor-pointer"
                                  >
                                    Hide
                                  </button>
                                )}

                                {ms.status !== 'locked' && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove Marking Scheme v${ms.version} from active use? Historical audit will be preserved.`)) {
                                        store.deleteMarkingScheme(ms.id);
                                        onRefresh();
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 font-semibold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rubric View Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Active Rubric Specification
                      </h4>
                      <p className="text-xs text-slate-500">
                        Tied to exact scheme hash and utilized by the AI marking engine for candidate theory evaluation.
                      </p>
                    </div>
                  </div>
                </div>

                {activeRubric ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-950">
                        <Lock className="w-4 h-4 text-emerald-700" />
                        <span>Rubric v{activeRubric.version} (Source Scheme Hash: <strong className="font-mono">{activeRubric.source_scheme_hash}</strong>)</span>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-semibold">
                        Locked for AI Grading
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeRubric.criteria.map((rc, idx) => (
                        <div key={rc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-slate-800 font-semibold">Criterion {idx + 1}: {rc.label}</strong>
                            <span className="font-black text-emerald-700">{rc.marks} Marks</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {rc.guidance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No rubric generated yet. Approve a marking scheme above and click "Regenerate Rubric".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Personalized Student Exam Papers */}
          {activeSubTab === 'papers' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      Personalized Candidate Examination Papers
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedExam.question_paper_mode === 'variable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {selectedExam.question_paper_mode === 'variable'
                        ? `Variable Mode (${selectedExam.variable_question_count || 5} Qs per candidate)`
                        : 'Fixed Mode (Unified Qs)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedExam.question_paper_mode === 'variable'
                      ? 'Every student receives a distinct randomized question paper with individualized QR code identity stamp.'
                      : 'Unified questions with unique candidate header, admission barcode, and QR code identity stamp.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('assessment')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                      title="Upload pupils' answered printed scripts and mark them"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Upload & Mark Answer Scripts</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setInitialPrintStudentId(undefined);
                      setShowStudentPapersPrintModal(true);
                    }}
                    disabled={examPapers.length === 0}
                    title="Preview every regenerated paper in one continuous scrollable view"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview All Candidate Papers ({examPapers.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setInitialPrintStudentId(undefined);
                      setShowStudentPapersPrintModal(true);
                    }}
                    disabled={examPapers.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print All Candidate Booklets ({examPapers.length})</span>
                  </button>

                  <button
  type="button"
  onClick={() => {
    setSelectedEnrollmentClassId(selectedExam.class_id); // set default to exam's class
    const eligible = students.filter(st => st.status === 'active' && st.class_id === selectedExam.class_id && (!selectedExam.school_id || st.school_id === selectedExam.school_id) && !examPapers.some(p => p.student_id === st.id));
    setSelectedEnrollmentIds(eligible.map(st => st.id));
    setEnrollmentMode('class');
    setShowEnrollStudentsModal(true);
  }}
  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
>
  <UserPlus className="w-4 h-4" />
  <span>Enroll Existing Students in Bulk</span>
</button>

                  <button
                    onClick={handleGeneratePapers}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Regenerate Papers for Enrolled Pupils</span>
                  </button>
                </div>
              </div>

              {/* Papers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examPapers.map(paper => {
                  const student = students.find(s => s.id === paper.student_id);
                  const qrUrl = paperQrUrls[paper.id];

                  return (
                    <div
                      key={paper.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="font-mono text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              {paper.paper_code}
                            </span>
                            <h5 className="font-bold text-sm text-slate-900 mt-2">
                              {student ? student.full_name : 'Candidate'}
                            </h5>
                            <p className="text-xs text-slate-500">
                              Admission No: <strong className="text-slate-700">{student?.admission_number}</strong>
                            </p>
                          </div>

                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt="Student Paper QR"
                              className="w-16 h-16 rounded border border-slate-200 p-1 bg-white"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                              <QrCode className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-4">
                          <div className="flex justify-between mb-0.5">
                            <span>Questions Assigned:</span>
                            <strong className="text-slate-800">
                              {paper.assigned_question_ids?.length || (selectedExam.question_paper_mode === 'variable' ? selectedExam.variable_question_count : examQuestions.length)} Qs
                            </strong>
                          </div>
                          <span className="font-mono block truncate text-slate-600 text-[10px]">
                            {paper.qr_code_payload}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedPaperForPrint(paper)}
                          className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => {
                            setInitialPrintStudentId(paper.student_id);
                            setShowStudentPapersPrintModal(true);
                          }}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Paper</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {examPapers.length === 0 && (
                  <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h5 className="font-bold text-slate-700 text-sm">No Student Papers Generated</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Click the generate button above to automatically create individualized QR exam booklets for all registered pupils.
                    </p>
                    <button
                      onClick={handleGeneratePapers}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Generate Candidate Papers
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showEnrollStudentsModal && selectedExam && (
  <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-900">Bulk Enroll Existing Students</h3>
          <p className="text-xs text-slate-500">Select existing active students from any class to enroll in this examination. Candidate papers will be created only for selected students.</p>
        </div>
        <button type="button" onClick={() => setShowEnrollStudentsModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
      </div>

      {/* Class Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Select Class to Enroll From:</label>
        <select
          value={selectedEnrollmentClassId || selectedExam.class_id}
          onChange={(e) => {
            const newClassId = e.target.value;
            setSelectedEnrollmentClassId(newClassId);
            // Reset selection and mode to class when class changes
            setEnrollmentMode('class');
            const eligible = students.filter(st => 
              st.status === 'active' && 
              st.class_id === newClassId && 
              (!selectedExam.school_id || st.school_id === selectedExam.school_id) && 
              !examPapers.some(p => p.student_id === st.id)
            );
            setSelectedEnrollmentIds(eligible.map(st => st.id));
          }}
          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {(() => {
        // Compute eligible based on selected class
        const classId = selectedEnrollmentClassId || selectedExam.class_id;
        const eligible = students.filter(st => 
          st.status === 'active' && 
          st.class_id === classId && 
          (!selectedExam.school_id || st.school_id === selectedExam.school_id) && 
          !examPapers.some(p => p.student_id === st.id)
        );
        const allClassIds = eligible.map(st => st.id);
        const effectiveSelection = enrollmentMode === 'class' ? allClassIds : selectedEnrollmentIds;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => { setEnrollmentMode('class'); setSelectedEnrollmentIds(allClassIds); }} 
                className={`p-3 rounded-xl border text-left ${enrollmentMode === 'class' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
              >
                <div className="text-xs font-black text-slate-900">Entire Class</div>
                <div className="text-[10px] text-slate-500 mt-1">Enroll all {eligible.length} eligible pupils in {classes.find(c => c.id === classId)?.name || 'this class'}.</div>
              </button>
              <button 
                type="button" 
                onClick={() => { setEnrollmentMode('individual'); setSelectedEnrollmentIds(selectedEnrollmentIds); }} 
                className={`p-3 rounded-xl border text-left ${enrollmentMode === 'individual' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}
              >
                <div className="text-xs font-black text-slate-900">Select Pupils</div>
                <div className="text-[10px] text-slate-500 mt-1">Choose individual pupils from the same class.</div>
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">{effectiveSelection.length} selected / {eligible.length} eligible</span>
              {enrollmentMode === 'individual' && <button type="button" className="text-emerald-700 font-bold" onClick={() => setSelectedEnrollmentIds(selectedEnrollmentIds.length === eligible.length ? [] : allClassIds)}>{selectedEnrollmentIds.length === eligible.length ? 'Clear all' : 'Select all'}</button>}
            </div>
            {enrollmentMode === 'individual' && (
              <div className="border border-slate-200 rounded-xl divide-y max-h-80 overflow-y-auto">
                {eligible.map(st => 
                  <label key={st.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selectedEnrollmentIds.includes(st.id)} onChange={() => setSelectedEnrollmentIds(prev => prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id])} />
                    <span className="font-bold text-sm text-slate-900">{st.full_name}</span>
                    <span className="font-mono text-[11px] text-slate-500 ml-auto">{st.admission_number}</span>
                  </label>
                )}
              </div>
            )}
            {eligible.length === 0 && <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl">No eligible active students found in this class.</div>}
          </div>
        );
      })()}

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
        <button type="button" onClick={() => setShowEnrollStudentsModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button>
        <button 
          type="button" 
          disabled={!selectedEnrollmentIds.length} 
          onClick={() => {
            const classId = selectedEnrollmentClassId || selectedExam.class_id;
            const ids = enrollmentMode === 'class' 
              ? students.filter(st => st.status === 'active' && st.class_id === classId && (!selectedExam.school_id || st.school_id === selectedExam.school_id) && !examPapers.some(p => p.student_id === st.id)).map(st => st.id) 
              : selectedEnrollmentIds;
            if (!ids.length) return;
            const res = store.bulkEnrollStudentsInExam(selectedExam.id, ids);
            alert(res.message);
            if (res.success) { 
              setShowEnrollStudentsModal(false); 
              setSelectedEnrollmentIds([]); 
              setEnrollmentMode('class'); 
              setSelectedEnrollmentClassId(selectedExam.class_id);
              onRefresh(); 
            }
          }} 
          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs"
        >
          Enroll {selectedEnrollmentIds.length} Students
        </button>
      </div>
    </div>
  </div>
)}
      {/* Bulk Add Questions Modal */}
      {showBulkAddModal && selectedExam && (
        <BulkAddQuestionsModal
          exam={selectedExam}
          onClose={() => setShowBulkAddModal(false)}
          onSuccess={() => {
            setShowBulkAddModal(false);
            onRefresh();
          }}
        />
      )}

      {/* Exam Approval Workflow & Moderation Modal */}
      {showApprovalWorkflowModal && selectedExam && (
        <ExamApprovalWorkflowModal
          exam={selectedExam}
          currentUser={currentUser}
          onClose={() => setShowApprovalWorkflowModal(false)}
          onSuccess={() => {
            setShowApprovalWorkflowModal(false);
            onRefresh();
          }}
        />
      )}

      {/* Student Question Papers Print Modal (Bulk & Individual) */}
      {showStudentPapersPrintModal && selectedExam && (
        <StudentQuestionPapersPrintModal
          exam={selectedExam}
          questions={examQuestions}
          students={students}
          studentPapers={examPapers}
          school={storeState.schools.find(s => s.id === selectedExam.school_id)}
          classLevel={classes.find(c => c.id === selectedExam.class_id)}
          subject={subjects.find(s => s.id === selectedExam.subject_id)}
          session={sessions.find(s => s.id === selectedExam.session_id)}
          term={terms.find(t => t.id === selectedExam.term_id)}
          initialStudentId={initialPrintStudentId}
          onClose={() => {
            setShowStudentPapersPrintModal(false);
            setInitialPrintStudentId(undefined);
          }}
        />
      )}

      {/* Printable Personalized Exam Paper Modal */}
      {selectedPaperForPrint && selectedExam && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none">
            {/* Print Header Controls */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-slate-800">Printable Exam Paper Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setSelectedPaperForPrint(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Exam Paper Layout */}
            <div className="border-2 border-slate-900 p-6 rounded-lg text-slate-900">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <h2 className="font-black text-base uppercase tracking-wider text-slate-950">
                  EDO STATE MINISTRY OF EDUCATION
                </h2>
                <h3 className="font-bold text-sm text-slate-800 uppercase mt-0.5">
                  UNIFIED TERMINAL EXAMINATION
                </h3>
                <p className="text-xs text-slate-600">
                  Session: 2025/2026 Academic Session • 2nd Term
                </p>
              </div>

              {/* Candidate Info Strip */}
              <div className="grid grid-cols-3 gap-4 py-4 border-b-2 border-slate-900 text-xs">
                <div className="col-span-2 space-y-1.5">
                  <div>
                    <span className="font-bold text-slate-700">CANDIDATE NAME: </span>
                    <strong className="text-slate-950 text-sm">
                      {students.find(s => s.id === selectedPaperForPrint.student_id)?.full_name}
                    </strong>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">ADMISSION NO: </span>
                    <strong className="font-mono text-slate-950">
                      {students.find(s => s.id === selectedPaperForPrint.student_id)?.admission_number}
                    </strong>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">SUBJECT: </span>
                    <span>{subjects.find(s => s.id === selectedExam.subject_id)?.name}</span>
                    <span className="ml-4 font-bold text-slate-700">CLASS: </span>
                    <span>{classes.find(c => c.id === selectedExam.class_id)?.name}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center">
                  {paperQrUrls[selectedPaperForPrint.id] && (
                    <img
                      src={paperQrUrls[selectedPaperForPrint.id]}
                      alt="Candidate Identity QR"
                      className="w-20 h-20 border border-slate-900 p-1"
                    />
                  )}
                  <span className="font-mono text-[9px] text-slate-600 mt-1">
                    {selectedPaperForPrint.paper_code}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="py-3 border-b border-slate-300 text-[11px] text-slate-700 bg-slate-50 px-3 my-3">
                <strong className="text-slate-900 block mb-0.5">GENERAL INSTRUCTIONS:</strong>
                <p>1. Answer all questions clearly. 2. For objective questions, SHADE ONE answer bubble (A, B, C or D) completely; do not write the letter. 3. Write theoretical solutions on the designated ruled lines.</p>
              </div>

              {/* Question Set */}
              <div className="space-y-6 pt-2">
                {selectedPaperQuestions.map(q => {
                  const lines = q.answer_lines || (q.question_type === 'theory' ? 8 : 4);
                  return (
                    <div key={q.id} className="text-xs space-y-2">
                      <div className="flex items-start justify-between font-bold text-slate-900">
                        <span>{q.question_number}. {q.text}</span>
                        <span className="font-normal text-slate-500 whitespace-nowrap ml-2">[{q.maximum_marks} Marks]</span>
                      </div>

                      {q.question_type === 'objective' && q.options && (
                        <div className="grid grid-cols-2 gap-2 pl-4">
                          {q.options.map(opt => (
                            <div key={opt.key} className="flex items-center gap-2 text-slate-800">
                              <span className="w-5 h-5 rounded-full border-2 border-slate-500 flex items-center justify-center font-black text-[9px] bg-white">
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.question_type !== 'objective' && (
                        <div className="space-y-0 mt-2 border-t border-dashed border-slate-300">
                          {Array.from({ length: lines }).map((_, lIdx) => (
                            <div key={lIdx} className="h-6 border-b border-dashed border-slate-300 w-full" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Document Question Importer Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  AI Question & Answer Document Parser
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Paste your raw question paper text below. Gemini AI will automatically separate questions, choices, answers, and maximum marks into structured records.
            </p>

            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={8}
              placeholder="Example:
1. What is the capital of Edo State? A. Lagos B. Benin City C. Warri D. Abuja (Answer: B, 10 marks)
2. Mention two agricultural export products of Nigeria. (Answer: Cocoa, Palm Oil, 15 marks)..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => {
                  setImportText(`1. Name the traditional ruler of Benin Kingdom. A. Oba of Benin B. Ooni of Ife C. Sultan of Sokoto D. Emir of Kano [Answer: A, 10 Marks]
2. Define photosynthesis and state the primary energy source. [Answer: The process by which green plants manufacture food using sunlight, water and carbon dioxide. Energy source is Sunlight. 20 Marks, 6 lines]
3. Calculate the perimeter of a square whose side is 12cm. [Answer: Perimeter = 4 * 12 = 48cm. 20 Marks, 4 lines]`);
                }}
                className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Insert Sample Text
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportQuestions}
                  disabled={isImporting || !importText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isImporting ? 'Parsing with Gemini...' : 'Extract & Import Questions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">{editingQuestion ? `Edit Question Q${editingQuestion.question_number}` : 'Add New Examination Question'}</h3>
              <button
                onClick={() => { setShowAddQuestionModal(false); setEditingQuestion(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!selectedExam) return;
                const nextNum = examQuestions.length > 0 ? Math.max(...examQuestions.map(q => q.question_number)) + 1 : 1;
                const payload = {
                  examination_id: selectedExam.id,
                  question_number: editingQuestion?.question_number || nextNum,
                  question_type: newQuestion.question_type, text: newQuestion.text,
                  options: newQuestion.question_type === 'objective' ? newQuestion.options : undefined,
                  correct_answer: newQuestion.question_type === 'objective' ? newQuestion.correct_answer : undefined,
                  expected_answer: newQuestion.expected_answer, maximum_marks: Number(newQuestion.maximum_marks),
                  answer_lines: newQuestion.question_type !== 'objective' ? Number(newQuestion.answer_lines || 8) : undefined,
                  verified: editingQuestion ? editingQuestion.verified : false
                };
                if (editingQuestion) {
                  const res = store.updateQuestion(editingQuestion.id, payload);
                  alert(res.message);
                } else {
                  store.addQuestion(payload);
                }
                setEditingQuestion(null); setShowAddQuestionModal(false); onRefresh();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Type</label>
                <select
                  value={newQuestion.question_type}
                  onChange={e => setNewQuestion({
                    ...newQuestion,
                    question_type: e.target.value as any,
                    answer_lines: e.target.value === 'theory' ? 8 : (e.target.value === 'structured' ? 4 : 8)
                  })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="objective">Objective (Multiple Choice)</option>
                  <option value="structured">Structured (Short Answer)</option>
                  <option value="theory">Theory (Essay / Mathematical Working)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Text</label>
                <textarea
                  required
                  value={newQuestion.text}
                  onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  rows={3}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="Enter the question text..."
                />
              </div>

              {newQuestion.question_type === 'objective' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Options & Correct Key</label>
                  {newQuestion.options.map((opt, idx) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 w-6">{opt.key}.</span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={e => {
                          const updated = [...newQuestion.options];
                          updated[idx].text = e.target.value;
                          setNewQuestion({ ...newQuestion, options: updated });
                        }}
                        placeholder={`Option ${opt.key} text`}
                        className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  ))}
                  <div className="mt-2">
                    <label className="font-bold text-slate-700 block mb-1">Correct Answer Key</label>
                    <select
                      value={newQuestion.correct_answer}
                      onChange={e => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                      className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Theoretical & Structured Question Ruled Lines Setting */}
              {newQuestion.question_type !== 'objective' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-950 block">
                      Number of Ruled Lines Provided for Student Answer:
                    </label>
                    <span className="font-black text-emerald-700 text-sm">{newQuestion.answer_lines} Lines</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={24}
                    step={1}
                    value={newQuestion.answer_lines}
                    onChange={e => setNewQuestion({ ...newQuestion, answer_lines: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Defines the exact number of horizontal ruled lines rendered in the candidate question paper booklet and CBT textarea space.
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Expected Answer / Steps (for Marking Scheme & AI Evaluator)
                </label>
                <textarea
                  value={newQuestion.expected_answer}
                  onChange={e => setNewQuestion({ ...newQuestion, expected_answer: e.target.value })}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="Provide correct answer steps, formulas, or key concepts..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Maximum Marks</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={newQuestion.maximum_marks}
                  onChange={e => setNewQuestion({ ...newQuestion, maximum_marks: Number(e.target.value) })}
                  className="w-32 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Exam Modal */}
      {showNewExamModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">{editingExam ? 'Edit Examination' : 'Create New Examination'}</h3>
              <button
                onClick={() => { setShowNewExamModal(false); setEditingExam(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Examination Title</label>
                <input
                  type="text"
                  required
                  value={newExam.title}
                  onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="e.g. Primary 6 Unified Basic Science Assessment"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={newExam.subject_id}
                    onChange={e => setNewExam({ ...newExam, subject_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Class Level</label>
                  <select
                    value={newExam.class_id}
                    onChange={e => setNewExam({ ...newExam, class_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Paper Mode: Fixed vs Variable */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <div>
                  <label className="font-bold text-emerald-950 block mb-1">Question Paper Mode</label>
                  <select
                    value={newExam.question_paper_mode}
                    onChange={e => setNewExam({ ...newExam, question_paper_mode: e.target.value as any })}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-emerald-950 font-bold"
                  >
                    <option value="fixed">Fixed (Same for All)</option>
                    <option value="variable">Variable (Randomized)</option>
                  </select>
                </div>

                {newExam.question_paper_mode === 'variable' && (
                  <div>
                    <label className="font-bold text-emerald-950 block mb-1">Questions per Student</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newExam.variable_question_count}
                      onChange={e => setNewExam({ ...newExam, variable_question_count: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Examination Date</label>
                <input type="date" required value={newExam.date} onChange={e => setNewExam({ ...newExam, date: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={newExam.duration_minutes}
                    onChange={e => setNewExam({ ...newExam, duration_minutes: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    required
                    value={newExam.maximum_marks}
                    onChange={e => setNewExam({ ...newExam, maximum_marks: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pass %</label>
                  <input
                    type="number"
                    required
                    value={newExam.passing_percentage}
                    onChange={e => setNewExam({ ...newExam, passing_percentage: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewExamModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {editingExam ? 'Save Examination Changes' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Document Exam & Marking Pipeline Generator Modal */}
      {showPipelineModal && (
        <DocumentImportPipelineModal
          storeState={storeState}
          onClose={() => setShowPipelineModal(false)}
          onSuccess={(examId) => {
            setSelectedExamId(examId);
            onRefresh();
          }}
        />
      )}

      {/* Master Printable Exam Question Paper Modal */}
      {showMasterPaperModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-none">
            {/* Header controls */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-base text-slate-900">
                  Master Official Examination Question Paper
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {selectedExam.code}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Master Paper</span>
                </button>
                <button
                  onClick={() => setShowMasterPaperModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Master Paper Document Sheet */}
            <div className="border-2 border-slate-900 p-8 rounded-xl text-slate-900 bg-white space-y-6">
              {/* Seal and Title */}
              <div className="text-center pb-5 border-b-2 border-slate-900 space-y-1">
                <div className="text-xs font-black tracking-widest text-slate-700 uppercase">
                  FEDERAL REPUBLIC OF NIGERIA
                </div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-950">
                  EDO STATE MINISTRY OF EDUCATION
                </h1>
                <h2 className="text-sm font-bold text-slate-800 uppercase">
                  UNIFIED TERMINAL EXAMINATION • {sessions.find(s => s.id === selectedExam.session_id)?.name || '2025/2026'}
                </h2>
                <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-700 pt-1">
                  <span>SUBJECT: {subjects.find(s => s.id === selectedExam.subject_id)?.name}</span>
                  <span>•</span>
                  <span>CLASS: {classes.find(c => c.id === selectedExam.class_id)?.name}</span>
                  <span>•</span>
                  <span>TERM: {terms.find(t => t.id === selectedExam.term_id)?.name || '2nd Term'}</span>
                </div>
                <div className="flex items-center justify-center gap-6 text-xs text-slate-600 font-mono pt-1">
                  <span>TIME ALLOWED: {selectedExam.duration_minutes} MINUTES</span>
                  <span>|</span>
                  <span>MAXIMUM MARKS: {selectedExam.maximum_marks} MARKS</span>
                </div>
              </div>

              {/* Instructions Bar */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800">
                <strong className="text-slate-950 block mb-0.5">GENERAL INSTRUCTIONS TO CANDIDATES:</strong>
                <p>1. Write your full name, candidate admission number, and school center code clearly on your answer booklet.</p>
                <p>2. Answer ALL questions in both Section A and Section B.</p>
                <p>3. For Section A (Objective), select the correct letter (A, B, C, or D). For Section B (Theory), show all mathematical steps and write neatly on the designated ruled lines.</p>
              </div>

              {/* Section A: Objective Questions */}
              {examQuestions.filter(q => q.question_type === 'objective').length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="pb-1 border-b border-slate-900 flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-wide text-slate-900">
                      SECTION A: OBJECTIVE MULTIPLE-CHOICE QUESTIONS
                    </h3>
                    <span className="text-xs font-bold text-slate-600">
                      [Answer All Questions in this Section]
                    </span>
                  </div>

                  <div className="space-y-4">
                    {examQuestions.filter(q => q.question_type === 'objective').map((q) => (
                      <div key={q.id} className="text-xs space-y-2">
                        <div className="flex items-start justify-between font-bold text-slate-900">
                          <span className="leading-relaxed">
                            {q.question_number}. {q.text}
                          </span>
                          <span className="text-slate-500 whitespace-nowrap ml-3 font-normal">
                            [{q.maximum_marks} Marks]
                          </span>
                        </div>

                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                            {q.options.map((opt) => (
                              <div key={opt.key} className="flex items-center gap-2 text-slate-800">
                                <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                                  {opt.key}
                                </span>
                                <span>{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section B: Structured & Theory Questions */}
              {examQuestions.filter(q => q.question_type !== 'objective').length > 0 && (
                <div className="space-y-6 pt-4">
                  <div className="pb-1 border-b border-slate-900 flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-wide text-slate-900">
                      SECTION B: STRUCTURED & THEORY QUESTIONS
                    </h3>
                    <span className="text-xs font-bold text-slate-600">
                      [Show All Workings and Write on Ruled Lines]
                    </span>
                  </div>

                  <div className="space-y-6">
                    {examQuestions.filter(q => q.question_type !== 'objective').map((q) => {
                      const totalLines = q.answer_lines || (q.question_type === 'theory' ? 8 : 4);
                      return (
                        <div key={q.id} className="text-xs space-y-3">
                          <div className="flex items-start justify-between font-bold text-slate-900">
                            <span className="leading-relaxed text-sm">
                              {q.question_number}. {q.text}
                            </span>
                            <span className="text-slate-600 font-bold whitespace-nowrap ml-3">
                              [{q.maximum_marks} Marks]
                            </span>
                          </div>

                          {/* Student Response Ruled Lines on Master Paper */}
                          <div className="p-3 bg-slate-50/60 border border-slate-200 rounded-lg space-y-2">
                            {Array.from({ length: totalLines }).map((_, lineIdx) => (
                              <div
                                key={lineIdx}
                                className="h-6 border-b border-dashed border-slate-300 w-full flex items-end justify-between px-1"
                              >
                                <span className="text-[8px] text-slate-300 font-mono">L{lineIdx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Official Seal / Signature Footer */}
              <div className="pt-8 mt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <span className="block font-bold text-slate-700 mb-6">Subject Examiner / Moderator:</span>
                  <div className="border-b border-slate-900 w-48 mb-1" />
                  <span className="text-[10px] text-slate-500 font-mono">Signature & Date</span>
                </div>

                <div className="text-right">
                  <span className="block font-bold text-slate-700 mb-6">Director of Academic Standards & Quality:</span>
                  <div className="border-b border-slate-900 w-48 ml-auto mb-1" />
                  <span className="text-[10px] text-slate-500 font-mono">Edo State Ministry of Education Board Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};