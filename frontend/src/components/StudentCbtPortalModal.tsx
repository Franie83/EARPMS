import React, { useState, useEffect } from 'react';
import {
  Laptop,
  FileText,
  Printer,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Search,
  ArrowRight,
  BookOpen,
  Send,
  X,
  RefreshCw,
  QrCode,
  Download,
  Layers,
  Lock
} from 'lucide-react';
import { store, AppStoreState } from '../lib/store';
import { Examination, Question, Student, StudentExamPaper, School, Subject, ClassLevel, AnswerScript } from '../types';

interface StudentCbtPortalModalProps {
  storeState: AppStoreState;
  onClose: () => void;
  onRefresh: () => void;
  defaultExamId?: string;
}

export const StudentCbtPortalModal: React.FC<StudentCbtPortalModalProps> = ({
  storeState,
  onClose,
  onRefresh,
  defaultExamId
}) => {
  const { examinations, students, schools, subjects, classes, studentPapers, questions, currentUser } = storeState;

  // Selected Exam
  const [selectedExamId, setSelectedExamId] = useState<string>(defaultExamId || examinations[0]?.id || '');
  const activeExam = examinations.find(e => e.id === selectedExamId) || examinations[0];

  // Student Authentication / Selection
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isCandidateLoggedIn, setIsCandidateLoggedIn] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [candidateAccessError, setCandidateAccessError] = useState<string | null>(null);
  const [candidateAccessSuccess, setCandidateAccessSuccess] = useState<string | null>(null);

  // Exam Mode: 'online' (CBT) vs 'offline' (Print, write, upload)
  const [examMode, setExamMode] = useState<'online' | 'offline'>('online');

  // CBT Student Answer State: map of questionId -> studentAnswer string
  const [cbtAnswers, setCbtAnswers] = useState<Record<string, string>>({});
  const [isSubmittingCbt, setIsSubmittingCbt] = useState(false);
  const [cbtCompletedResult, setCbtCompletedResult] = useState<any | null>(null);

  // Offline Submission State
  const [offlineFile, setOfflineFile] = useState<File | null>(null);
  const [offlineFileName, setOfflineFileName] = useState('');
  const [offlineFileBase64, setOfflineFileBase64] = useState<string | null>(null);
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const [offlineSuccessMessage, setOfflineSuccessMessage] = useState<string | null>(null);

  // Timer simulation (in seconds)
  const durationSec = (activeExam?.duration_minutes || 90) * 60;
  const [timeLeft, setTimeLeft] = useState(durationSec);

  useEffect(() => {
    if (!isCandidateLoggedIn || examMode !== 'online' || cbtCompletedResult) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCandidateLoggedIn, examMode, cbtCompletedResult]);

  const activeStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : undefined;
  const activeSchool = schools.find(s => s.id === activeStudent?.school_id);
  const activeSubject = subjects.find(s => s.id === activeExam?.subject_id);
  const activeClass = classes.find(c => c.id === activeExam?.class_id);

  // Find candidate personalized paper
  const candidatePaper = studentPapers.find(
    p => p.examination_id === selectedExamId && p.student_id === activeStudent?.id
  );

  // Determine if the exam is locked: submitted/graded AND has actual answers
  const isLocked = candidatePaper && 
    (candidatePaper.cbt_status === 'submitted' || candidatePaper.cbt_status === 'graded') && 
    candidatePaper.cbt_answers && 
    Object.keys(candidatePaper.cbt_answers).length > 0;

  // Get varied questions assigned to this student
  const rawExamQuestions = questions
    .filter(q => q.examination_id === selectedExamId)
    .sort((a, b) => a.question_number - b.question_number);

  let displayQuestions: Question[] = [];

  if (candidatePaper?.assigned_question_ids && candidatePaper.assigned_question_ids.length > 0) {
    const qMap = new Map(rawExamQuestions.map(q => [q.id, q]));
    displayQuestions = candidatePaper.assigned_question_ids
      .map(id => qMap.get(id))
      .filter((q): q is Question => q !== undefined);
  } else if (activeExam?.question_paper_mode === 'variable') {
    const targetCount = Math.min(activeExam.variable_question_count || 5, rawExamQuestions.length);
    const qIds = store.computeVariableQuestionsForStudent(rawExamQuestions, activeStudent?.id || 'default', targetCount);
    const qMap = new Map(rawExamQuestions.map(q => [q.id, q]));
    displayQuestions = qIds.map(id => qMap.get(id)).filter((q): q is Question => q !== undefined);
  } else {
    displayQuestions = rawExamQuestions;
  }

  // Filter students based on search
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateAccessError(null);
    setCandidateAccessSuccess(null);
    const admission = studentSearchInput.trim();
    if (!activeExam || !admission) {
      setCandidateAccessError('Enter your admission number.');
      return;
    }
    const result = await store.candidateAccess(activeExam.id, admission);
    if (!result.success || !result.studentId) {
      setSelectedStudentId('');
      setCandidateAccessError(result.message);
      return;
    }
    setSelectedStudentId(result.studentId);
    setCandidateAccessSuccess(`Candidate verified successfully. Examination access granted for admission number ${admission}.`);
    setIsCandidateLoggedIn(true);
  };

  // Reset paper status – Super Admin only
  const handleResetStatus = () => {
    if (currentUser.role !== 'super-admin') return;
    if (!candidatePaper) return;
    if (!confirm(`Reset the status of ${activeStudent?.full_name}'s paper for ${activeExam?.title}? This will allow them to take the exam.`)) return;
    candidatePaper.cbt_status = 'not_started';
    candidatePaper.cbt_answers = undefined;
    candidatePaper.cbt_score = undefined;
    candidatePaper.cbt_submitted_at = undefined;
    candidatePaper.cbt_auto_marked = undefined;
    store.save();
    setResetSuccess('Status reset. The student can now take the exam.');
    setTimeout(() => setResetSuccess(null), 3000);
    onRefresh();
  };

  const handleAnswerChange = (questionId: string, answerText: string) => {
    setCbtAnswers(prev => ({
      ...prev,
      [questionId]: answerText
    }));
  };

  const handleCbtSubmit = async () => {
    if (!activeExam || !activeStudent) return;
    const answeredCount = Object.keys(cbtAnswers).length;
    if (answeredCount === 0) {
      if (!confirm('You have not answered any questions yet. Submit anyway?')) return;
    }

    setIsSubmittingCbt(true);
    try {
      // If student exam paper does not exist yet, generate it first
      let paperId = candidatePaper?.id;
      if (!paperId) {
        store.generateStudentPapers(activeExam.id);
        const refreshedState = store.getState();
        const createdPaper = refreshedState.studentPapers.find(
          p => p.examination_id === activeExam.id && p.student_id === activeStudent.id
        );
        paperId = createdPaper?.id;
      }

      if (paperId) {
        const res = await store.submitCandidateCbtExam(paperId, cbtAnswers);
        if (res.success) {
          await store.flush();
          setCbtCompletedResult(res);
          onRefresh();
        } else {
          alert(res.message);
        }
      } else {
        alert('Could not locate student candidate examination record.');
      }
    } catch (e: any) {
      alert('Failed to submit exam: ' + e.message);
    } finally {
      setIsSubmittingCbt(false);
    }
  };

  const handleOfflineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOfflineFile(file);
    setOfflineFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setOfflineFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOfflineSubmit = async () => {
    if (!offlineFileBase64 || !activeExam || !activeStudent) {
      alert('Please select a scanned answer sheet or photo first.');
      return;
    }

    setIsSubmittingOffline(true);
    try {
      // Ingest into Answer Scripts Store
      const newScript: AnswerScript = {
        id: `scr-${Date.now()}`,
        paper_id: candidatePaper?.id || `EP-${Date.now()}`,
        examination_id: activeExam.id,
        student_id: activeStudent.id,
        intake_type: 'ocr_upload',
        status: 'received',
        review_status: 'pending_review',
        score: 0,
        maximum_marks: activeExam.maximum_marks,
        answers: [],
        scanned_file_name: offlineFileName,
        scanned_file_data: offlineFileBase64,
        created_at: new Date().toISOString()
      };

      store.getState().answerScripts.push(newScript);
      store.recordAudit('CREATE', 'answer_script', newScript.id, undefined, {
        student_name: activeStudent.full_name,
        admission_number: activeStudent.admission_number,
        mode: 'candidate_self_upload'
      });
      store.save();

      setOfflineSuccessMessage(
        `Answer booklet "${offlineFileName}" successfully uploaded and queued for Principal AI OCR moderation and scoring!`
      );
      onRefresh();
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    } finally {
      setIsSubmittingOffline(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredQuestionsCount = Object.keys(cbtAnswers).filter(k => cbtAnswers[k]?.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Portal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Edo State Ministry of Education Candidate Examination Portal
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-[10px]">
                  CBT & Hybrid Intake
                </span>
                {activeExam?.question_paper_mode === 'variable' && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 font-bold text-[10px]">
                    Variable Paper Mode ({activeExam.variable_question_count || 5} Questions)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Official Computer-Based Testing (CBT) & Offline Paper Scanning Portal for Candidates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Login / Verification Screen */}
        {!isCandidateLoggedIn ? (
          <div className="p-8 space-y-6 max-w-xl mx-auto my-auto text-center w-full">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <UserCheck className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900">
                Student Candidate Verification & Entry
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Select your designated unified examination and candidate admission identity to begin.
              </p>
            </div>

            {/* Reset success message */}
            {resetSuccess && (
              <div className="text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-xs font-semibold">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4 text-left">
              {/* Examination Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Scheduled Unified Examination:
                </label>
                <select
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {examinations.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.code} — {ex.title} ({ex.duration_minutes} Mins • {ex.maximum_marks} Marks)
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidate Admission Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Candidate Admission Number:
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter your admission number"
                    value={studentSearchInput}
                    onChange={e => setStudentSearchInput(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                {candidateAccessError && <p className="mt-2 text-xs font-bold text-red-600">{candidateAccessError}</p>}
              </div>

              {/* Show warning and reset button if locked */}
              {currentUser.role === 'super-admin' && candidatePaper && isLocked && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>This candidate's paper is locked (stale submitted status).</span>
                  </div>
                  <p className="text-amber-700">Use the button below to reset it so the student can take the exam.</p>
                  <button
                    type="button"
                    onClick={handleResetStatus}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Paper Status (Super Admin)
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLocked}
                className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isLocked
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-emerald-600/20'
                }`}
              >
                <span>
                  {isLocked ? 'Examination Submitted — Locked' : 'Authenticate & Access Examination Room'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          activeStudent && candidatePaper ? (
          /* Active Examination Interface */
          <div className="flex-1 flex flex-col overflow-hidden">
            {candidateAccessSuccess && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{candidateAccessSuccess}</span>
              </div>
            )}
            {/* Candidate & Paper Header Strip */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  {activeStudent.full_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-black text-slate-900">{activeStudent.full_name}</strong>
                    <span className="font-mono text-[11px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {activeStudent.admission_number}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {activeSubject?.name || 'Mathematics'} ({activeClass?.name || 'Primary 6'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Paper Code: <strong className="font-mono text-slate-700">{candidatePaper?.paper_code || `EP-${activeExam.code.replace(/[^A-Z0-9]/gi, '')}-${activeStudent.admission_number.split('/').pop()}`}</strong>
                  </p>
                </div>
              </div>

              {/* Mode Switcher: Online CBT vs Offline Script Submission */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setExamMode('online')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      examMode === 'online'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Online CBT Exam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamMode('offline')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      examMode === 'offline'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Print & Submit Offline</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCandidateLoggedIn(false);
                    setCbtCompletedResult(null);
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Switch Student
                </button>
              </div>
            </div>

            {/* MODE 1: ONLINE CBT EXAM */}
            {examMode === 'online' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* CBT Status Ribbon */}
                {!cbtCompletedResult && (
                  <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Time Remaining:</span>
                      <strong className={`font-mono text-sm ${timeLeft < 300 ? 'text-rose-600' : 'text-emerald-900'}`}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">
                        Progress: <strong className="text-emerald-800">{answeredQuestionsCount}</strong> of {displayQuestions.length} Answered
                      </span>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${(answeredQuestionsCount / (displayQuestions.length || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CBT Completed Result Card */}
                {cbtCompletedResult ? (
                  <div className="p-8 space-y-6 flex-1 overflow-y-auto text-center">
                    <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded-3xl p-6 space-y-4 shadow-sm">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-emerald-950">Examination Paper Submitted!</h4>
                        <p className="text-xs text-emerald-700 mt-1">
                          Your responses have been processed through deterministic objective scoring and queued for AI moderation.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-2xl border border-emerald-200 text-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Score</span>
                          <strong className="text-lg font-black text-emerald-800">{cbtCompletedResult.score}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Percentage</span>
                          <strong className="text-lg font-black text-emerald-800">{cbtCompletedResult.percentage.toFixed(1)}%</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Status</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            Intake Complete
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCbtCompletedResult(null);
                            setIsCandidateLoggedIn(false);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Return to Portal Home
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CBT Questions Form */
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {displayQuestions.map((q, idx) => {
                      const totalLines = q.answer_lines || (q.question_type === 'theory' ? 8 : 4);
                      return (
                        <div
                          key={q.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-900 text-emerald-300 font-black text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                q.question_type === 'objective' ? 'bg-emerald-100 text-emerald-800' :
                                q.question_type === 'structured' ? 'bg-teal-100 text-teal-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {q.question_type}
                              </span>
                              {q.question_type !== 'objective' && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  (Ruled Allowance: {totalLines} lines)
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              [{q.maximum_marks} Marks]
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            {q.text}
                          </p>

                          {/* Objective Radio Options */}
                          {q.question_type === 'objective' && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              {q.options.map(opt => {
                                const isSelected = cbtAnswers[q.id] === opt.key;
                                return (
                                  <label
                                    key={opt.key}
                                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${q.id}`}
                                      value={opt.key}
                                      checked={isSelected}
                                      onChange={() => handleAnswerChange(q.id, opt.key)}
                                      className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                    />
                                    <span className="w-5 h-5 rounded bg-white border border-slate-300 font-bold text-xs flex items-center justify-center text-slate-700 shrink-0">
                                      {opt.key}
                                    </span>
                                    <span className="text-xs">{opt.text}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* Theory / Structured Text Area */}
                          {q.question_type !== 'objective' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Type your detailed answer and mathematical steps below:
                                </label>
                                <span className="text-[10px] text-slate-400">
                                  Allocated answer space equivalent to {totalLines} ruled lines
                                </span>
                              </div>
                              <textarea
                                rows={Math.min(12, Math.max(4, Math.ceil(totalLines * 0.75)))}
                                value={cbtAnswers[q.id] || ''}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                placeholder="Type your answer here clearly..."
                                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-sans leading-relaxed"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Submit Bar */}
                    <div className="pt-4 pb-8 flex items-center justify-between border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        Check your answers carefully before final submission.
                      </span>
                      <button
                        type="button"
                        onClick={handleCbtSubmit}
                        disabled={isSubmittingCbt}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmittingCbt ? 'Submitting & Evaluating...' : 'Submit CBT Examination Paper'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: OFFLINE EXAM (PRINT & UPLOAD SCRIPT) */}
            {examMode === 'offline' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Step A: Download & Print Question Paper */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">1. Print Offline Question Paper</h4>
                        <p className="text-[11px] text-slate-500">
                          Personalized question paper with unique QR code candidate stamp.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subject:</span>
                        <strong className="text-slate-900">{activeSubject?.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Class Level:</span>
                        <strong className="text-slate-900">{activeClass?.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Candidate:</span>
                        <strong className="text-slate-900">{activeStudent.full_name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Paper Mode:</span>
                        <strong className="text-emerald-800">
                          {activeExam.question_paper_mode === 'variable' ? `Variable (${activeExam.variable_question_count || 5} Questions)` : 'Fixed (All Unified Questions)'}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>Print Candidate Paper Booklet</span>
                    </button>
                  </div>

                  {/* Step B: Upload Written Script / Photo */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">2. Upload Scanned Written Script</h4>
                        <p className="text-[11px] text-slate-500">
                          Upload clear photograph or PDF scan of candidate answer sheet.
                        </p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 bg-slate-50">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-xs text-slate-600">
                        <label htmlFor="offline-script-upload" className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">
                          Browse Candidate File
                        </label>
                        <span className="text-slate-400"> (PNG, JPG, PDF)</span>
                        <input
                          id="offline-script-upload"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleOfflineFileChange}
                          className="hidden"
                        />
                      </div>
                      {offlineFileName && (
                        <p className="text-[11px] font-mono text-emerald-700 font-bold truncate">
                          Selected: {offlineFileName}
                        </p>
                      )}
                    </div>

                    {offlineSuccessMessage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{offlineSuccessMessage}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleOfflineSubmit}
                      disabled={isSubmittingOffline || !offlineFileBase64}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isSubmittingOffline ? 'Submitting & Queueing OCR...' : 'Submit Offline Answer Script'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-base font-black text-emerald-950">Examination Access Granted</h3>
                <p className="text-xs text-emerald-800 mt-2">{candidateAccessSuccess || 'Candidate verified successfully. Loading the examination room...'}</p>
                <p className="text-[11px] text-emerald-700 mt-2">Please wait while your assigned examination paper is loaded.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};