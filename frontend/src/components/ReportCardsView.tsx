import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  Printer,
  QrCode,
  Building2,
  Users,
  CheckCircle2,
  Download,
  ShieldCheck,
  Search,
  Sparkles,
  FileDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Eye,
  GraduationCap,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { store, AppStoreState, gradeForPercentage } from '../lib/store';
import { ReportCard, ReportCardSubjectEntry, Student, AcademicSession, Term } from '../types';
import { generateQrDataUrl } from '../lib/qr';
import { downloadReportCardPdf, downloadMultipleReportCardsPdf } from '../lib/pdfDownloader';

interface ReportCardsViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
  onOpenVerifyModal: () => void;
  initialStudentId?: string;
}

export const ReportCardsView: React.FC<ReportCardsViewProps> = ({
  storeState,
  onRefresh,
  onOpenVerifyModal,
  initialStudentId
}) => {
  const {
    reportCards,
    students,
    schools,
    classes,
    subjects,
    sessions,
    terms,
    results,
    gradeScales,
    systemConfig,
    currentUser
  } = storeState;

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [selectedTermId, setSelectedTermId] = useState<string>(terms[0]?.id || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // ===== NEW: All Cards View state =====
  const [allSearch, setAllSearch] = useState('');
  const [allSessionFilter, setAllSessionFilter] = useState<string>('ALL');
  const [allTermFilter, setAllTermFilter] = useState<string>('ALL');
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  // In-place Report Card Content Editor Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTeacherComment, setEditTeacherComment] = useState('');
  const [editPrincipalComment, setEditPrincipalComment] = useState('');
  const [editConductGrade, setEditConductGrade] = useState('Excellent');
  const [editPromotionStatus, setEditPromotionStatus] = useState<'Promoted' | 'Promoted on Trial' | 'Not Promoted' | 'Under Review'>('Promoted');
  const [editAttendancePresent, setEditAttendancePresent] = useState(65);
  const [editAttendanceTotal, setEditAttendanceTotal] = useState(65);
  const [editPosition, setEditPosition] = useState(1);
  const [editSubjects, setEditSubjects] = useState<ReportCardSubjectEntry[]>([]);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    } else if (!students.some(s => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0]?.id || '');
    }
  }, [students, initialStudentId, selectedStudentId]);

  useEffect(() => {
    if (!sessions.some(s => s.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0]?.id || '');
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (!terms.some(t => t.id === selectedTermId)) {
      setSelectedTermId(terms[0]?.id || '');
    }
  }, [terms, selectedTermId]);

  // Navigate only among pupils who have a report card for the selected session/term.
  // This keeps Prev/Next deterministic and prevents navigation into an empty card.
  const candidateList = useMemo(() => {
    const cardStudentIds = new Set(
      reportCards
        .filter(rc => rc.session_id === selectedSessionId && rc.term_id === selectedTermId)
        .map(rc => rc.student_id)
    );
    return students.filter(s => {
      if (!cardStudentIds.has(s.id)) return false;
      if (!searchFilter.trim()) return true;
      const query = searchFilter.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(query) ||
        s.admission_number.toLowerCase().includes(query)
      );
    });
  }, [students, reportCards, selectedSessionId, selectedTermId, searchFilter]);

  useEffect(() => {
    if (candidateList.length > 0 && !candidateList.some(s => s.id === selectedStudentId)) {
      setSelectedStudentId(candidateList[0].id);
    }
  }, [candidateList, selectedStudentId]);

  const currentStudentIndex = useMemo(() => {
    return candidateList.findIndex(s => s.id === selectedStudentId);
  }, [candidateList, selectedStudentId]);

  const activeCard = reportCards.find(rc =>
    rc.student_id === selectedStudentId &&
    rc.session_id === selectedSessionId &&
    rc.term_id === selectedTermId
  );

  const student = students.find(s => s.id === selectedStudentId);
  const school = student ? schools.find(sc => sc.id === student.school_id) : null;
  const studentClass = student ? classes.find(c => c.id === student.class_id) : null;
  const session = sessions.find(s => s.id === selectedSessionId);
  const term = terms.find(t => t.id === selectedTermId);

  // Normalize subjects list
  const activeCardSubjects: ReportCardSubjectEntry[] = useMemo(() => {
    if (!activeCard) return [];
    if (Array.isArray(activeCard.subjects) && activeCard.subjects.length > 0) {
      return activeCard.subjects;
    }
    const legacyEntries = (activeCard as any).subject_entries;
    if (Array.isArray(legacyEntries)) {
      return legacyEntries.map((e: any) => ({
        subject_name: e.subject_name || 'Subject',
        subject_code: e.subject_code || 'SUB',
        raw_marks: e.total_score || e.raw_marks || 0,
        max_marks: 100,
        percentage: e.total_score || e.raw_marks || 0,
        grade: e.grade || 'C',
        remark: e.remark || 'Good',
        position: e.position || 0
      }));
    }
    return [];
  }, [activeCard]);

  // Open Edit Modal and populate fields
  const handleOpenEditModal = () => {
    if (!activeCard) return;
    setEditTeacherComment(activeCard.teacher_comment || '');
    setEditPrincipalComment(activeCard.principal_comment || '');
    setEditConductGrade(activeCard.conduct_grade || student?.conduct_rating || 'Very Good');
    setEditPromotionStatus(activeCard.promotion_status || 'Promoted');
    setEditAttendancePresent(activeCard.attendance_present ?? (student?.attendance_days || 60));
    setEditAttendanceTotal(activeCard.attendance_total ?? (student?.total_days || 65));
    setEditPosition(activeCard.position || 1);
    setEditSubjects(JSON.parse(JSON.stringify(activeCardSubjects)));
    setEditFeedback(null);
    setShowEditModal(true);
  };

  // Save in-place report card edits
  const handleSaveCardEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;

    const res = store.updateReportCard(activeCard.id, {
      teacher_comment: editTeacherComment,
      principal_comment: editPrincipalComment,
      conduct_grade: editConductGrade,
      promotion_status: editPromotionStatus,
      attendance_present: Number(editAttendancePresent),
      attendance_total: Number(editAttendanceTotal),
      position: Number(editPosition),
      subjects: editSubjects
    });

    if (res.success) {
      setEditFeedback('Report card content and pedagogical remarks saved successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setEditFeedback(null);
      }, 1000);
      onRefresh();
    } else {
      setEditFeedback(res.message);
    }
  };

  // Subject row helpers inside edit modal
  const handleUpdateSubjectScore = (index: number, raw: number) => {
    setEditSubjects(prev => {
      const copy = [...prev];
      const target = { ...copy[index] };
      target.raw_marks = Number(raw);
      target.percentage = target.max_marks > 0 ? Number(((target.raw_marks / target.max_marks) * 100).toFixed(1)) : 0;
      
      // Auto-assign from the configured Edo State Ministry of Education grade scale.
      target.grade = gradeForPercentage(target.percentage, gradeScales);

      copy[index] = target;
      return copy;
    });
  };

  const handleUpdateSubjectRemark = (index: number, remark: string) => {
    setEditSubjects(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], remark };
      return copy;
    });
  };

  // Generate QR image when activeCard changes
  useEffect(() => {
    async function loadQr() {
      if (activeCard) {
        const payload = `EDS:REPORT:${activeCard.id}:STU:${activeCard.student_id}:CODE:${activeCard.verification_code}:AVG:${activeCard.average_percent}`;
        const url = await generateQrDataUrl(payload);
        setQrDataUrl(url);
      } else {
        setQrDataUrl('');
      }
    }
    loadQr();
  }, [activeCard?.id]);

  // Seamless Student Navigation Handler (Next / Previous).
  // Do not regenerate or refresh while navigating; the selected card changes immediately.
  const navigateToStudent = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= candidateList.length) return;
    const nextStudent = candidateList[newIndex];
    if (!nextStudent) return;
    setSelectedStudentId(nextStudent.id);
  }, [candidateList]);

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      navigateToStudent(currentStudentIndex - 1);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < candidateList.length - 1) {
      navigateToStudent(currentStudentIndex + 1);
    }
  };

  // Keyboard navigation support (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevStudent();
      } else if (e.key === 'ArrowRight') {
        handleNextStudent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStudentIndex, candidateList]);

  // Generate / Recalculate Report Card
  const handleGenerateCard = () => {
    if (!selectedStudentId || !selectedSessionId || !selectedTermId) return;
    const res = store.generateReportCard(
      selectedStudentId,
      selectedSessionId,
      selectedTermId
    );
    if (res.success) {
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  // Seed / Hydrate All Missing Report Cards for the current session/term
  const handleSeedAll = () => {
    let refreshed = 0;
    students.forEach(st => {
      const res = store.generateReportCard(st.id, selectedSessionId, selectedTermId);
      if (res.success) refreshed++;
    });
    store.refreshReportCardRankings(selectedSessionId, selectedTermId);
    alert(`${refreshed} report card(s) generated/refreshed with current finalized performance and class positions.`);
    onRefresh();
  };

  const handleDeleteReportCard = () => {
    if (!activeCard) return;
    if (currentUser.role !== 'super-admin') {
      alert('Only Super-Admin can delete report cards.');
      return;
    }
    if (!window.confirm(`Delete the report card for ${student?.full_name || 'this candidate'}? This action cannot be undone.`)) return;
    const result = store.deleteReportCard(activeCard.id);
    if (!result.success) {
      alert(result.message);
      return;
    }
    alert(result.message);
    onRefresh();
  };

  // Single PDF Download Handler
  const handleDownloadPdf = async () => {
    if (!activeCard || !student || !school || !studentClass || !session || !term) {
      alert('Report card data is incomplete.');
      return;
    }
    try {
      setIsDownloading(true);
      await downloadReportCardPdf(
        activeCard,
        student,
        school,
        studentClass,
        session,
        term,
        systemConfig
      );
    } catch (e) {
      console.error('Failed to download report card PDF', e);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Batch PDF Download Handler (All Report Cards for Session / Term)
  const handleDownloadBatch = async () => {
    const matchingCards = reportCards.filter(
      rc => rc.session_id === selectedSessionId && rc.term_id === selectedTermId
    );
    if (matchingCards.length === 0) {
      alert('No report cards found for the selected session and term.');
      return;
    }
    try {
      setIsDownloading(true);
      await downloadMultipleReportCardsPdf(
        matchingCards,
        students,
        schools,
        classes,
        sessions,
        terms,
        systemConfig
      );
    } catch (e) {
      console.error('Failed to batch download report cards', e);
      alert('Could not download batch report cards. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== NEW: Bulk delete handler =====
  const handleBulkDelete = () => {
    if (selectedCardIds.size === 0) return;
    if (!confirm(`Delete ${selectedCardIds.size} report card(s)? This action cannot be undone.`)) return;
    let deleted = 0;
    let failed = 0;
    selectedCardIds.forEach(id => {
      const res = store.deleteReportCard(id);
      if (res.success) deleted++;
      else failed++;
    });
    alert(`Successfully deleted ${deleted} report card(s).${failed ? ` ${failed} failed.` : ''}`);
    setSelectedCardIds(new Set());
    onRefresh();
  };

  const toggleCardSelection = (id: string) => {
    setSelectedCardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAllCards = (checked: boolean) => {
    if (checked) {
      const allIds = filteredAllCards.map(c => c.id);
      setSelectedCardIds(new Set(allIds));
    } else {
      setSelectedCardIds(new Set());
    }
  };

  // ===== NEW: Filtered all cards =====
  const filteredAllCards = useMemo(() => {
    return reportCards.filter(card => {
      if (allSearch.trim()) {
        const q = allSearch.toLowerCase();
        const stu = students.find(s => s.id === card.student_id);
        const sch = schools.find(s => s.id === card.school_id);
        const match = 
          stu?.full_name.toLowerCase().includes(q) ||
          stu?.admission_number.toLowerCase().includes(q) ||
          sch?.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (allSessionFilter !== 'ALL' && card.session_id !== allSessionFilter) return false;
      if (allTermFilter !== 'ALL' && card.term_id !== allTermFilter) return false;
      return true;
    });
  }, [reportCards, allSearch, allSessionFilter, allTermFilter, students, schools]);

  const isAuthorizedToEdit = ['super-admin', 'admin', 'director', 'principal', 'teacher'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Top Filter & Generation Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Official Terminal Academic Report Cards
            </h2>
            <span className="px-2.5 py-0.5 bg-orange-500/15 text-orange-800 font-bold text-xs rounded-full border border-orange-300">
              {reportCards.length} Cards in Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Edo State Ministry of Education official continuous assessment, subject aggregates, conduct ratings, and digital QR verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Candidate Selector */}
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {students.map(st => (
              <option key={st.id} value={st.id}>
                {st.full_name} ({st.admission_number})
              </option>
            ))}
          </select>

          {/* Session Selector */}
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_active ? '(Current)' : ''}
              </option>
            ))}
          </select>

          {/* Term Selector */}
          <select
            value={selectedTermId}
            onChange={e => setSelectedTermId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {terms.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>

          {/* Seed / Re-hydrate All Report Cards */}
          <button
            onClick={handleSeedAll}
            title="Populate complete terminal seed report cards for all enrolled candidates"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-orange-300" />
            <span>Seed All Report Cards</span>
          </button>

          <button onClick={() => setViewMode(viewMode === 'all' ? 'single' : 'all')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer">
            <Users className="w-4 h-4" /> <span>{viewMode === 'all' ? 'Single Report Card' : 'View All Report Cards'}</span>
          </button>

          {/* Download Batch Cards */}
          <button
            onClick={handleDownloadBatch}
            disabled={isDownloading}
            title="Download/Print all report cards for current term in a single document"
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Download All ({reportCards.filter(r => r.session_id === selectedSessionId && r.term_id === selectedTermId).length})</span>
          </button>

          {/* Generate / Refresh Active Report Card */}
          <button
            onClick={handleGenerateCard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer border border-orange-400"
          >
            <Award className="w-4 h-4" />
            <span>Generate / Refresh</span>
          </button>

          {activeCard && isAuthorizedToEdit && (
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-600/20 cursor-pointer border border-orange-500"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Content & Comments</span>
            </button>
          )}

          {activeCard && currentUser.role === 'super-admin' && (
            <button
              onClick={handleDeleteReportCard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-red-500"
              title="Delete this report card"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Report Card</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTINUOUS REPORT CARD NAVIGATOR BAR (visible only in single mode) */}
      {viewMode === 'single' && (
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 rounded-2xl border border-orange-500/30 shadow-md flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-black tracking-widest text-orange-400">
                  Candidate Switcher
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-200 border border-orange-500/30">
                  Student {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} of {candidateList.length}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{student?.full_name || 'Select a Candidate'}</span>
                <span className="text-xs font-mono text-orange-300 font-normal">
                  ({student?.admission_number})
                </span>
              </h3>
            </div>
          </div>

          {/* Previous & Next Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-orange-400 w-44"
              />
            </div>

            <button
              type="button"
              onClick={handlePrevStudent}
              disabled={currentStudentIndex <= 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold transition-all border border-slate-600/40 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              title="Navigate to Previous Student (Keyboard: Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4 text-orange-400" />
              <span>Prev</span>
            </button>

            <span className="text-xs font-mono text-slate-300 px-1 font-semibold">
              {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 0} / {candidateList.length}
            </span>

            <button
              type="button"
              onClick={handleNextStudent}
              disabled={currentStudentIndex >= candidateList.length - 1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 text-slate-950 text-xs font-black transition-all border border-orange-400 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
              title="Navigate to Next Student (Keyboard: Right Arrow)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}

      {/* SINGLE REPORT CARD VIEW */}
      {viewMode === 'single' && activeCard && student && school ? (
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-8 shadow-xl max-w-4xl mx-auto text-slate-950 print:p-0 print:border-none print:shadow-none relative">
          {/* Quick Action Top Right Floating Pill */}
          <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
            {isAuthorizedToEdit && (
              <button
                onClick={handleOpenEditModal}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Edit pedagogical remarks and scores"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-700" />
                <span>Edit Remarks</span>
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Download this student's official report card"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download PDF</span>
            </button>
            {currentUser.role === 'super-admin' && (
              <button
                onClick={handleDeleteReportCard}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Delete this student's report card"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Edo State Ministry of Education Official Header */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl border-2 border-slate-900 shadow-sm">
                ED
              </div>
              <div>
                <h1 className="font-black text-lg sm:text-xl uppercase tracking-wider text-slate-950">
                  {systemConfig?.report_card_header_title || 'EDO STATE MINISTRY OF EDUCATION'}
                </h1>
                <h2 className="font-bold text-xs uppercase tracking-widest text-orange-800">
                  {systemConfig?.report_card_sub_header || 'CONTINUOUS ASSESSMENT & TERMINAL REPORT SHEET'}
                </h2>
                {systemConfig?.report_card_motto && (
                  <p className="text-[11px] italic text-slate-600 mt-0.5">
                    "{systemConfig.report_card_motto}"
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              School: <strong className="text-slate-900">{school.name}</strong> • LGA: <strong className="text-slate-900">{school.lga}</strong> • School Code: <strong className="font-mono">{school.code}</strong>
            </p>
          </div>

          {/* Student Biodata & Digital QR Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-4 border-b-2 border-slate-900 text-xs">
            <div className="sm:col-span-3 grid grid-cols-2 gap-y-2">
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Pupil Full Name:</span>
                <strong className="text-sm font-black text-slate-950 uppercase">{student.full_name}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Admission Number:</span>
                <strong className="text-sm font-mono font-bold text-slate-950">{student.admission_number}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Class Level & Arm:</span>
                <strong className="text-slate-950">{studentClass?.name || 'Primary 6'}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Gender / Conduct:</span>
                <strong className="text-slate-950">{student.gender === 'M' ? 'Male' : 'Female'} • {activeCard.conduct_grade || student.conduct_rating || 'Very Good'}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Academic Session:</span>
                <strong className="text-slate-950">{session?.name || '2025/2026 Session'}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] uppercase font-bold">Term / Attendance:</span>
                <strong className="text-slate-950">{term?.name || 'Second Term'} • {activeCard.attendance_present ?? student.attendance_days}/{activeCard.attendance_total ?? student.total_days} Days</strong>
              </div>
            </div>

            {/* QR Verification Box */}
            <div className="flex flex-col items-center justify-center p-2 bg-orange-50/70 rounded-xl border border-orange-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Report Card QR Code" className="w-20 h-20 object-contain rounded-lg" />
              ) : (
                <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-lg" />
              )}
              <span className="text-[9px] font-mono font-bold text-orange-950 mt-1 text-center">
                {activeCard.verification_code}
              </span>
            </div>
          </div>

          {/* Academic Results Table */}
          <div className="py-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold text-slate-900 uppercase text-[11px]">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-2 text-center">CA (40%)</th>
                  <th className="py-2.5 px-2 text-center">Exam (60%)</th>
                  <th className="py-2.5 px-2 text-center font-black">Total (100)</th>
                  <th className="py-2.5 px-2 text-center">Grade</th>
                  <th className="py-2.5 px-3">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeCardSubjects.map((sub, idx) => {
                  const caScore = Math.round(sub.raw_marks * 0.4);
                  const examScore = Math.round(sub.raw_marks * 0.6);
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {sub.subject_name}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600 font-mono">{caScore}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600 font-mono">{examScore}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-950 font-mono">{sub.raw_marks}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                          sub.grade === 'A' ? 'bg-emerald-100 text-emerald-950 font-black' :
                          sub.grade === 'B' ? 'bg-orange-100 text-orange-950' :
                          sub.grade === 'C' ? 'bg-amber-100 text-amber-950' :
                          'bg-rose-100 text-rose-950'
                        }`}>
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] italic">{sub.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Terminal Aggregate & Overall Rank */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-orange-500/10 border-2 border-slate-900 my-4 text-xs">
            <div>
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Total Marks:</span>
              <strong className="text-lg font-black text-slate-950">
                {activeCard.total_marks} / {activeCard.max_possible}
              </strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Overall Average:</span>
              <strong className="text-lg font-black text-orange-950">
                {activeCard.average_percent.toFixed(1)}%
              </strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Promotion Status:</span>
              <strong className="text-lg font-black text-slate-950">
                {activeCard.promotion_status || (activeCard.average_percent >= 50 ? 'Promoted' : 'Not Promoted')}
              </strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Position in Class:</span>
              <strong className="text-lg font-black text-orange-800">
                {activeCard.position} of {activeCard.total_students || candidateList.length}
              </strong>
            </div>
          </div>

          {/* Remarks & Signatures */}
          <div className="space-y-4 pt-4 border-t-2 border-slate-900 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="font-bold text-slate-800 block mb-0.5">
                {systemConfig?.report_card_teacher_signature_title || "Class Form Teacher's Remarks"}:
              </span>
              <p className="italic text-slate-700">{activeCard.teacher_comment}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="font-bold text-slate-800 block mb-0.5">
                {systemConfig?.report_card_principal_signature_title || "Head Teacher / Principal's Remarks"}:
              </span>
              <p className="italic text-slate-700">{activeCard.principal_comment}</p>
            </div>

            {/* Resumption & Fees Notice */}
            {(systemConfig?.report_card_next_term_begins || systemConfig?.report_card_next_term_fees_notice) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded text-[11px]">
                {systemConfig.report_card_next_term_begins && (
                  <div>
                    <span className="font-bold text-amber-900 block">Next Term Resumption:</span>
                    <span className="text-amber-800">{systemConfig.report_card_next_term_begins}</span>
                  </div>
                )}
                {systemConfig.report_card_next_term_fees_notice && (
                  <div>
                    <span className="font-bold text-amber-900 block">Tuition / Fees Notice:</span>
                    <span className="text-amber-800">{systemConfig.report_card_next_term_fees_notice}</span>
                  </div>
                )}
              </div>
            )}

            {/* Official Disclaimer */}
            {systemConfig?.report_card_disclaimer && (
              <div className="p-2.5 bg-slate-100 rounded text-[10px] text-slate-600 leading-relaxed border border-slate-200">
                <strong>Disclaimer:</strong> {systemConfig.report_card_disclaimer}
              </div>
            )}

            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div>
                {systemConfig?.principal_signature_url && <img src={systemConfig.principal_signature_url} alt="Principal Stamp" className="h-14 w-full object-contain mb-1" />}
                <div className="border-b border-slate-400 pb-1 mb-1 font-serif italic text-slate-800">
                  {school.head_teacher}
                </div>
                <span className="font-bold text-slate-700 uppercase text-[10px]">
                  {systemConfig?.report_card_principal_signature_title || 'Head Teacher / Signature & Date'}
                </span>
              </div>

              <div>
                {systemConfig?.chairman_signature_url && <img src={systemConfig.chairman_signature_url} alt="Chairman Stamp" className="h-14 w-full object-contain mb-1" />}
                <div className="border-b border-slate-400 pb-1 mb-1 font-serif italic text-orange-800 font-bold">
                  {systemConfig?.report_card_chairman_name || 'Hon. Ozavize E. Salami'}
                </div>
                <span className="font-bold text-slate-700 uppercase text-[10px]">
                  {systemConfig?.report_card_chairman_title || 'Chairman'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'single' && (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 max-w-2xl mx-auto">
          <Award className="w-12 h-12 text-orange-600/40 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">No Report Card Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Select a candidate from the dropdown or quick-jump bar and click "Generate / Refresh Report" to compile terminal results and issue a digital verification certificate.
          </p>
          <button
            onClick={handleGenerateCard}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-orange-500/20"
          >
            Generate Report Card Now
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW ALL REPORT CARDS TABLE */}
      {/* ========================================================================= */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table header with search, filters and actions */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold text-slate-900">All Report Cards in Database</h3>
              <span className="text-xs text-slate-500">{filteredAllCards.length} of {reportCards.length} Cards</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, admission, school..."
                  value={allSearch}
                  onChange={e => setAllSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 w-48"
                />
              </div>
              {/* Session Filter */}
              <select
                value={allSessionFilter}
                onChange={e => setAllSessionFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">All Sessions</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {/* Term Filter */}
              <select
                value={allTermFilter}
                onChange={e => setAllTermFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">All Terms</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {/* Delete Selected button (super-admin only) */}
              {currentUser.role === 'super-admin' && selectedCardIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected ({selectedCardIds.size})
                </button>
              )}
              {selectedCardIds.size > 0 && (
                <button
                  onClick={() => setSelectedCardIds(new Set())}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={filteredAllCards.length > 0 && filteredAllCards.every(c => selectedCardIds.has(c.id))}
                      onChange={(e) => toggleAllCards(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">School</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Academic Session</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Average (%)</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredAllCards.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No report cards match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAllCards.map(card => {
                    const student = students.find(s => s.id === card.student_id);
                    const school = schools.find(s => s.id === card.school_id);
                    const cls = classes.find(c => c.id === card.class_id);
                    const session = sessions.find(s => s.id === card.session_id);
                    const term = terms.find(t => t.id === card.term_id);
                    return (
                      <tr key={card.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedCardIds.has(card.id)}
                            onChange={() => toggleCardSelection(card.id)}
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{student?.full_name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-slate-600">{school?.name || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{student?.admission_number || '—'}</td>
                        <td className="py-3 px-4">{cls?.name || '—'}</td>
                        <td className="py-3 px-4">{session?.name || '—'}</td>
                        <td className="py-3 px-4">{term?.name || '—'}</td>
                        <td className="py-3 px-4 font-black text-orange-600">{card.average_percent.toFixed(1)}%</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{card.position}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentId(card.student_id);
                              setSelectedSessionId(card.session_id);
                              setSelectedTermId(card.term_id);
                              setViewMode('single');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            Open Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-PLACE REPORT CARD CONTENT & REMARKS EDIT MODAL                         */}
      {/* ========================================================================= */}
      {showEditModal && activeCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-orange-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-slate-950 font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Edit Report Card Content & Pedagogical Remarks
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidate: <strong>{student?.full_name}</strong> ({student?.admission_number})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFeedback && (
              <div className="p-3 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span>{editFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveCardEdits} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Promotion Status</label>
                  <select
                    value={editPromotionStatus}
                    onChange={(e) => setEditPromotionStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Promoted">Promoted</option>
                    <option value="Promoted on Trial">Promoted on Trial</option>
                    <option value="Not Promoted">Not Promoted</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pupil Conduct Rating</label>
                  <select
                    value={editConductGrade}
                    onChange={(e) => setEditConductGrade(e.target.value)}
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
                    value={editPosition}
                    onChange={(e) => setEditPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Days Present</label>
                  <input
                    type="number"
                    min={0}
                    value={editAttendancePresent}
                    onChange={(e) => setEditAttendancePresent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total School Days</label>
                  <input
                    type="number"
                    min={1}
                    value={editAttendanceTotal}
                    onChange={(e) => setEditAttendanceTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Class Form Teacher's Pedagogical Remarks
                </label>
                <textarea
                  rows={2}
                  value={editTeacherComment}
                  onChange={(e) => setEditTeacherComment(e.target.value)}
                  placeholder="e.g. Demonstrates exceptional aptitude in quantitative reasoning..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Head Teacher / Principal's Final Appraisal Remarks
                </label>
                <textarea
                  rows={2}
                  value={editPrincipalComment}
                  onChange={(e) => setEditPrincipalComment(e.target.value)}
                  placeholder="e.g. An exemplary scholar with distinguished moral conduct..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Subject Scores & Remarks Customizer */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Subject Scores & Remarks Table
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Total: {editSubjects.reduce((s, i) => s + (Number(i.raw_marks) || 0), 0)} / {editSubjects.reduce((s, i) => s + (Number(i.max_marks) || 100), 0)}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editSubjects.map((sub, idx) => (
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
                          onChange={(e) => handleUpdateSubjectScore(idx, Number(e.target.value))}
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
                          onChange={(e) => handleUpdateSubjectRemark(idx, e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-slate-700 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black shadow-md shadow-orange-500/20 cursor-pointer border border-orange-400"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Re-Issue Digital Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};