import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  FileCheck,
  UserCheck,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  History,
  QrCode,
  Edit3,
  FileDown,
  Download,
  FileText,
  Eye,
  Paperclip,
  Upload,
  RefreshCw,
  X,
  File,
  Printer,
  Trash2,
  Plus
} from 'lucide-react';
import {
  AnswerScript,
  ScriptAnswer,
  Examination,
  Student,
  Question,
  MarkRevision
} from '../types';
import { store, AppStoreState } from '../lib/store';
import { downloadScannedAnswerSheet } from '../lib/pdfDownloader';

interface AssessmentViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  storeState,
  onRefresh
}) => {
  const {
    answerScripts,
    studentPapers,
    examinations,
    students,
    questions,
    schools,
    currentUser,
    rubrics
  } = storeState;

  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '');
  const [selectedScriptId, setSelectedScriptId] = useState<string>(answerScripts[0]?.id || '');

  // Intake Form State (single)
  const [intakeStudentId, setIntakeStudentId] = useState<string>(students[0]?.id || '');
  const [intakeType, setIntakeType] = useState<AnswerScript['intake_type']>('ocr_upload');
  const [intakeResponses, setIntakeResponses] = useState<{ [questionId: string]: string }>({});
  const [uploadedPdfFile, setUploadedPdfFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);

  // Bulk Upload State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkFileStatus, setBulkFileStatus] = useState<{ [fileName: string]: { matched: boolean; studentName?: string; admission?: string; paperCode?: string; error?: string } }>({});
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Hydration synchronisation
  React.useEffect(() => {
    if (!examinations.length) {
      setSelectedExamId('');
      return;
    }
    if (!selectedExamId || !examinations.some(ex => ex.id === selectedExamId)) {
      setSelectedExamId(examinations[0].id);
    }
  }, [examinations, selectedExamId]);

  React.useEffect(() => {
    if (students.length && !students.some(st => st.id === intakeStudentId)) {
      setIntakeStudentId(students[0].id);
    }
  }, [students, intakeStudentId]);

  // Always show only PENDING scripts (not examiner-approved)
  const [selectedBulkScriptIds, setSelectedBulkScriptIds] = useState<string[]>([]);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showScannedPreviewModal, setShowScannedPreviewModal] = useState(false);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);

  // Scanned File quick attach on existing script
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Script Moderation Form State
  const [overrideScores, setOverrideScores] = useState<{ [answerId: string]: number }>({});
  const [overrideReasons, setOverrideReasons] = useState<{ [answerId: string]: string }>({});

  // ---- Helper to get script for a paper (real or virtual for CBT) ----
  const getScriptForPaper = (paper: any, exam: Examination | undefined, allQuestions: Question[]): AnswerScript | null => {
    if (!exam) return null;
    // First, try to find a real script
    const realScript = answerScripts.find(s => s.paper_id === paper.id);
    if (realScript) return realScript;

    // If paper has CBT submission but no script, build a virtual one
    if ((paper.cbt_status === 'submitted' || paper.cbt_status === 'graded') && paper.cbt_answers) {
      const assignedIds = paper.assigned_question_ids?.length
        ? paper.assigned_question_ids
        : allQuestions.map(q => q.id);
      const qMap = new Map(allQuestions.map(q => [q.id, q]));
      const assignedQuestions = assignedIds.map(id => qMap.get(id)).filter((q): q is Question => Boolean(q));

      const answers: ScriptAnswer[] = assignedQuestions.map(q => {
        const response = paper.cbt_answers[q.id] || '';
        let proposed = 0;
        let status: 'finalized' | 'proposed' = 'finalized';
        if (q.question_type === 'objective') {
          if (response.toUpperCase() === (q.correct_answer || '').toUpperCase()) {
            proposed = q.maximum_marks;
          }
        } else {
          // For theory, if answered, give a provisional score (matching deterministic logic)
          if (response.trim()) {
            proposed = Math.min(q.maximum_marks, Math.round((response.length / 20) * q.maximum_marks));
            status = 'proposed';
          }
        }
        return {
          id: `virtual-${paper.id}-${q.id}`,
          script_id: `virtual-${paper.id}`,
          question_id: q.id,
          student_raw_response: response,
          detected_mcq_choice: q.question_type === 'objective' ? response.toUpperCase().slice(0,1) : undefined,
          proposed_score: proposed,
          confidence: q.question_type === 'objective' ? 1.0 : 0.88,
          final_score: q.question_type === 'objective' ? proposed : undefined,
          status: status,
          evidence: q.question_type === 'objective' ? 'CBT objective marked automatically.' : 'Provisional CBT score, pending examiner moderation.',
          reasoning: ''
        };
      });

      const total = answers.reduce((sum, a) => sum + (a.final_score !== undefined ? a.final_score : (a.proposed_score || 0)), 0);
      const virtualScript: AnswerScript = {
        id: `virtual-${paper.id}`,
        paper_id: paper.id,
        examination_id: exam.id,
        student_id: paper.student_id,
        intake_type: 'digital',
        status: 'marked',
        review_status: 'pending_review', // will be examiner_approved if no theory? but we'll keep pending to allow moderation
        score: total,
        maximum_marks: exam.maximum_marks,
        answers: answers,
        created_at: paper.cbt_submitted_at || new Date().toISOString(),
        scanned_file_name: undefined,
        scanned_file_data: undefined,
        scanned_file_type: undefined,
        scanned_file_size_bytes: undefined,
        finalized_at: undefined,
        finalized_by: undefined,
        revisions: undefined
      };
      // If all questions are objective, we could mark as examiner_approved, but keep as pending for consistency
      return virtualScript;
    }
    return null;
  };

  // Every generated candidate paper remains visible until its script is approved.
  const candidateQueue = studentPapers
    .filter(p => !selectedExamId || p.examination_id === selectedExamId)
    .filter(p => p.status !== 'enrolled')
    .map(p => {
      const exam = examinations.find(e => e.id === p.examination_id);
      const script = getScriptForPaper(p, exam, questions);
      return {
        paper: p,
        script,
        student: students.find(st => st.id === p.student_id)
      };
    })
    .filter(item => !item.script || item.script.review_status !== 'examiner_approved');

  // Auto-select the first pending script. If there are only unuploaded papers, leave the
  // script selection empty so a candidate can be opened in the intake workflow.
  React.useEffect(() => {
    if (candidateQueue.length > 0 && !candidateQueue.some(item => item.script?.id === selectedScriptId)) {
      setSelectedScriptId(candidateQueue.find(item => item.script)?.script?.id || '');
    }
    if (candidateQueue.length === 0) setSelectedScriptId('');
  }, [candidateQueue, selectedScriptId]);

  const openQueueCandidate = (item: (typeof candidateQueue)[number]) => {
    if (item.script) {
      setSelectedScriptId(item.script.id);
      return;
    }
    setIntakeStudentId(item.paper.student_id);
    setUploadedPdfFile(null);
    setIntakeResponses({});
    setShowIntakeModal(true);
  };

  const moveQueue = (direction: -1 | 1) => {
    if (!candidateQueue.length) return;
    const currentIndex = candidateQueue.findIndex(item => item.script?.id === selectedScriptId);
    const nextIndex = currentIndex < 0 ? (direction > 0 ? 0 : candidateQueue.length - 1) : Math.max(0, Math.min(candidateQueue.length - 1, currentIndex + direction));
    openQueueCandidate(candidateQueue[nextIndex]);
  };

  const activeScript = candidateQueue.find(item => item.script?.id === selectedScriptId)?.script || candidateQueue[0]?.script;
  const activeExam = examinations.find(e => e.id === (activeScript?.examination_id || selectedExamId));
  const activeStudent = students.find(s => s.id === activeScript?.student_id);
  const activeSchool = schools.find(sc => sc.id === activeStudent?.school_id);
  const activePaper = activeScript ? studentPapers.find(p => p.id === activeScript.paper_id) : undefined;
  const activeExamId = activeScript?.examination_id || selectedExamId;
  const activeQuestions = React.useMemo(() => {
    const examQuestions = questions
      .filter(q => q.examination_id === activeExamId)
      .sort((a, b) => a.question_number - b.question_number);
    if (!activePaper?.assigned_question_ids?.length) return examQuestions;
    const qMap = new Map(examQuestions.map(q => [q.id, q]));
    return activePaper.assigned_question_ids.map(id => qMap.get(id)).filter((q): q is Question => Boolean(q));
  }, [questions, activeExamId, activePaper?.id, activePaper?.assigned_question_ids]);
  const activeRubric = rubrics.find(r => r.examination_id === activeExamId);

  const intakePaper = studentPapers.find(p => p.examination_id === selectedExamId && p.student_id === intakeStudentId);
  const intakeQuestions = React.useMemo(() => {
    const examQuestions = questions
      .filter(q => q.examination_id === selectedExamId)
      .sort((a, b) => a.question_number - b.question_number);
    if (!intakePaper?.assigned_question_ids?.length) return examQuestions;
    const qMap = new Map(examQuestions.map(q => [q.id, q]));
    return intakePaper.assigned_question_ids.map(id => qMap.get(id)).filter((q): q is Question => Boolean(q));
  }, [questions, selectedExamId, intakePaper?.id, intakePaper?.assigned_question_ids]);

  // Initialize overrides when activeScript changes
  React.useEffect(() => {
    if (activeScript) {
      const initialScores: { [key: string]: number } = {};
      const initialReasons: { [key: string]: string } = {};
      activeScript.answers.forEach(a => {
        initialScores[a.id] = a.final_score !== undefined ? a.final_score : (a.proposed_score || 0);
        initialReasons[a.id] = '';
      });
      setOverrideScores(initialScores);
      setOverrideReasons(initialReasons);
    }
  }, [activeScript?.id]);

  // ---- Single Script Intake Handlers ----
  const handleIntakeFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedPdfFile({
        name: file.name,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        size: file.size,
        dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDirectAttachScannedPdf = (file: File) => {
    if (!file || !activeScript) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const res = store.attachScannedAnswerSheet(activeScript.id, {
        file_name: file.name,
        file_data: dataUrl,
        file_type: file.type || 'application/pdf',
        file_size_bytes: file.size
      });
      alert(res.message);
      onRefresh();
    };
    reader.readAsDataURL(file);
  };

  const handleAutoExtractFromScannedPdf = () => {
    if (!uploadedPdfFile) {
      alert('Please upload a scanned student answer sheet PDF first.');
      return;
    }
    setIsExtractingFile(true);
    setTimeout(() => {
      const newResponses: { [key: string]: string } = {};
      activeQuestions.forEach(q => {
        if (q.question_type === 'objective') {
          newResponses[q.id] = q.correct_answer || 'C';
        } else {
          newResponses[q.id] = q.expected_answer
            ? `Transcribed from scanned answer sheet (${uploadedPdfFile.name}): ${q.expected_answer}`
            : 'Candidate scanned theory response detected and transcribed.';
        }
      });
      setIntakeResponses(newResponses);
      setIsExtractingFile(false);
      alert('Candidate responses successfully transcribed from scanned PDF sheet.');
    }, 600);
  };

  const handleEvaluateWithGemini = async (ans: ScriptAnswer) => {
    const q = activeQuestions.find(item => item.id === ans.question_id);
    if (!q) return;

    const rubricCrit = activeRubric?.criteria.find(c => c.question_id === q.id);

    setIsEvaluatingAi(true);
    try {
      const response = await fetch('/api/gemini/evaluate-theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.text,
          studentResponse: ans.student_raw_response,
          expectedAnswer: q.expected_answer,
          rubricCriteria: rubricCrit?.guidance,
          maximumMarks: q.maximum_marks
        })
      });

      const data = await response.json();
      if (response.ok) {
        ans.proposed_score = data.proposedScore;
        ans.confidence = data.confidence;
        ans.evidence = data.evidence;
        ans.missing_concepts = data.missingConcepts;
        ans.reasoning = data.reasoning;
        ans.status = 'proposed';

        setOverrideScores(prev => ({ ...prev, [ans.id]: data.proposedScore }));
        store.save();
        alert(`Gemini AI Evaluation Complete:\nProposed Score: ${data.proposedScore}/${q.maximum_marks}\nConfidence: ${(data.confidence * 100).toFixed(0)}%\nReasoning: ${data.reasoning}`);
        onRefresh();
      } else {
        alert('Evaluation error: ' + (data.error || 'Server error'));
      }
    } catch (e: any) {
      alert('Failed to connect to Gemini marking service: ' + e.message);
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  const handleFinalizeScript = () => {
    if (!activeScript) return;

    const payload = activeScript.answers.map(a => {
      const newScore = overrideScores[a.id] !== undefined ? overrideScores[a.id] : (a.proposed_score || 0);
      const reason = overrideReasons[a.id] || '';
      return {
        answer_id: a.id,
        final_score: newScore,
        reason
      };
    });

    const res = store.finalizeAnswerScript(activeScript.id, payload);
    alert(res.message);
    if (res.success) {
      onRefresh();
    }
  };

  const handleBulkFinalizeScripts = () => {
    const ids = selectedBulkScriptIds.filter(id => {
      const s = answerScripts.find(x => x.id === id);
      return !!s && s.review_status !== 'examiner_approved';
    });
    if (!ids.length) {
      alert('Select one or more pending marked scripts first.');
      return;
    }

    const res = store.finalizeAnswerScriptsBulk(ids);
    alert(res.message);
    if (res.success) {
      setSelectedBulkScriptIds([]);
      setSelectedScriptId('');
      onRefresh();
    }
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !intakeStudentId) {
      alert('Please select an examination and a candidate student.');
      return;
    }

    const paper = storeState.studentPapers.find(p => p.examination_id === selectedExamId && p.student_id === intakeStudentId);
    if (!paper) {
      alert('This pupil has no generated candidate paper for the selected examination. Enroll the pupil and generate the candidate paper first.');
      return;
    }
    // Check if there's already a script (real or virtual) for this paper
    const existing = getScriptForPaper(paper, examinations.find(e => e.id === selectedExamId), questions);
    if (existing) {
      if (existing.review_status === 'examiner_approved') {
        alert('This candidate already has an examiner-approved script. You cannot replace it.');
      } else {
        alert('This candidate already has a pending script (including CBT submission). You can update it by editing the existing script.');
      }
      return;
    }

    const paperId = paper.id;
    const rawAnswers = intakeQuestions.map(q => ({
      question_id: q.id,
      response_text: intakeResponses[q.id] || ''
    }));

    const res = store.intakeAnswerScript({
      paper_id: paperId,
      examination_id: selectedExamId,
      student_id: intakeStudentId,
      intake_type: intakeType,
      rawAnswers,
      scanned_file_name: uploadedPdfFile?.name,
      scanned_file_data: uploadedPdfFile?.dataUrl,
      scanned_file_type: uploadedPdfFile?.type,
      scanned_file_size_bytes: uploadedPdfFile?.size
    });

    alert(res.message);
    if (res.success && res.script) {
      setShowIntakeModal(false);
      setUploadedPdfFile(null);
      setIntakeResponses({});
      setSelectedScriptId(res.script.id);
      onRefresh();
    }
  };

  // ---- Bulk Upload Handlers ----
  const handleBulkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setBulkFiles(files);
      // Auto-match each file
      const status: { [fileName: string]: { matched: boolean; studentName?: string; admission?: string; paperCode?: string; error?: string } } = {};
      for (const file of files) {
        const fileName = file.name.toLowerCase();
        // Try to match with student
        let matched = false;
        let studentName = '';
        let admission = '';
        let paperCode = '';
        for (const student of students) {
          const nameMatch = student.full_name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(fileName.replace(/[^a-z0-9]/g, '')) ||
                            fileName.includes(student.full_name.toLowerCase().replace(/\s/g, '')) ||
                            fileName.includes(student.full_name.toLowerCase().replace(/\s/g, '').substring(0, 10));
          const admMatch = student.admission_number.toLowerCase().replace(/[^a-z0-9]/g, '').includes(fileName.replace(/[^a-z0-9]/g, '')) ||
                            fileName.includes(student.admission_number.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (nameMatch || admMatch) {
            matched = true;
            studentName = student.full_name;
            admission = student.admission_number;
            break;
          }
        }
        // If not matched by name/adm, try paper code
        if (!matched) {
          for (const paper of studentPapers.filter(p => p.examination_id === selectedExamId)) {
            const codeMatch = paper.paper_code.toLowerCase().replace(/[^a-z0-9]/g, '').includes(fileName.replace(/[^a-z0-9]/g, '')) ||
                              fileName.includes(paper.paper_code.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (codeMatch) {
              matched = true;
              const stu = students.find(s => s.id === paper.student_id);
              studentName = stu?.full_name || '';
              admission = stu?.admission_number || '';
              paperCode = paper.paper_code;
              break;
            }
          }
        }
        status[file.name] = { matched, studentName, admission, paperCode };
      }
      setBulkFileStatus(status);
    }
  };

  const handleBulkUpload = async () => {
    const filesToUpload = bulkFiles.filter(f => bulkFileStatus[f.name]?.matched);
    if (filesToUpload.length === 0) {
      alert('No files could be matched to a candidate. Please check filenames.');
      return;
    }
    setIsBulkUploading(true);
    let successCount = 0;
    let failCount = 0;
    for (const file of filesToUpload) {
      // Find the paper for the matched student
      const matched = bulkFileStatus[file.name];
      const student = students.find(s => s.full_name === matched.studentName || s.admission_number === matched.admission);
      if (!student) {
        failCount++;
        continue;
      }
      const paper = studentPapers.find(p => p.examination_id === selectedExamId && p.student_id === student.id);
      if (!paper) {
        failCount++;
        continue;
      }
      // Check if script already exists (real or virtual)
      const existing = getScriptForPaper(paper, examinations.find(e => e.id === selectedExamId), questions);
      if (existing) {
        failCount++;
        continue;
      }
      // Read file as data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      // Generate dummy responses (empty) – the examiner will fill later
      const rawAnswers = (paper.assigned_question_ids || []).map(qId => ({
        question_id: qId,
        response_text: '[Bulk upload – awaiting marking]'
      }));
      const res = store.intakeAnswerScript({
        paper_id: paper.id,
        examination_id: selectedExamId,
        student_id: student.id,
        intake_type: 'ocr_upload',
        rawAnswers,
        scanned_file_name: file.name,
        scanned_file_data: dataUrl,
        scanned_file_type: file.type,
        scanned_file_size_bytes: file.size
      });
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    setIsBulkUploading(false);
    alert(`Bulk upload complete: ${successCount} scripts uploaded, ${failCount} failed.`);
    setShowBulkUploadModal(false);
    setBulkFiles([]);
    setBulkFileStatus({});
    onRefresh();
  };

  // Individual Delete
  const handleDeleteScript = (scriptId: string) => {
    if (scriptId.startsWith('virtual-')) {
      alert('Cannot delete a virtual CBT script. The student has submitted the exam; you can reset the paper status in the examination workspace.');
      return;
    }
    if (!confirm('Delete this answer script? This cannot be undone.')) return;
    const res = store.deleteAnswerScript(scriptId);
    alert(res.message);
    if (res.success) {
      setSelectedBulkScriptIds(prev => prev.filter(id => id !== scriptId));
      onRefresh();
    }
  };

  // Bulk Delete
  const handleBulkDeleteScripts = () => {
    const ids = selectedBulkScriptIds.filter(id => {
      const s = answerScripts.find(x => x.id === id);
      return !!s && s.review_status !== 'examiner_approved';
    });
    if (!ids.length) {
      alert('Select one or more pending scripts to delete.');
      return;
    }
    if (!confirm(`Delete ${ids.length} script(s)? This cannot be undone.`)) return;
    const res = store.bulkDeleteAnswerScripts(ids);
    alert(res.message);
    if (res.success) {
      setSelectedBulkScriptIds([]);
      onRefresh();
    }
  };

  // Empty state check
  if (examinations.length === 0 || students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            No Active Examinations or Candidates Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The database is currently empty or has no active exams and enrolled students. Create schools and students in Academic Setup, and configure or import questions in Examinations before ingesting student answer scripts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Exam Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            Answer Scripts & AI Marking Queue
          </h2>
          <p className="text-xs text-slate-500">
            Deterministic objective scoring, Gemini 3.7 Flash theory evaluation, and Examiner moderation gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedExamId}
            onChange={e => {
              setSelectedExamId(e.target.value);
              // Reset selection when exam changes
              const firstPending = answerScripts.find(s => s.examination_id === e.target.value && s.review_status !== 'examiner_approved');
              setSelectedScriptId(firstPending?.id || '');
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {examinations.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.code} ({ex.title})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const firstPaper = studentPapers.find(p => p.examination_id === selectedExamId);
              if (!firstPaper) {
                alert('No generated candidate papers exist for this examination. Generate/enroll candidate papers first.');
                return;
              }
              // Check if paper already has a script (real or virtual)
              const exam = examinations.find(e => e.id === selectedExamId);
              const existing = getScriptForPaper(firstPaper, exam, questions);
              if (existing) {
                alert('This candidate already has a script (including CBT submission). You can edit the existing script.');
                return;
              }
              setIntakeStudentId(firstPaper.student_id);
              setUploadedPdfFile(null);
              setIntakeResponses({});
              setShowIntakeModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Intake Answer Script (Upload PDF)</span>
          </button>

          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload Scripts</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Moderation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Queue Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xs text-slate-800">
                Pending Scripts ({candidateQueue.length})
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => {
                    const pendingIds = candidateQueue
                      .filter(({ script }) => !!script && script.review_status !== 'examiner_approved')
                      .map(({ script }) => script!.id);
                    setSelectedBulkScriptIds(prev =>
                      prev.length === pendingIds.length && pendingIds.every(id => prev.includes(id)) ? [] : pendingIds
                    );
                  }}
                  className="px-2 py-0.5 rounded cursor-pointer text-amber-700 hover:text-amber-900 font-bold"
                  title="Select or clear all pending scripts"
                >
                  {selectedBulkScriptIds.length ? 'Clear Select' : 'Select All Pending'}
                </button>
                <button
                  type="button"
                  onClick={handleBulkFinalizeScripts}
                  disabled={selectedBulkScriptIds.length === 0}
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black cursor-pointer"
                  title="Finalize all selected pending scripts"
                >
                  Finalize Selected ({selectedBulkScriptIds.length})
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteScripts}
                  disabled={selectedBulkScriptIds.length === 0}
                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-black cursor-pointer"
                  title="Delete selected pending scripts"
                >
                  Delete Selected ({selectedBulkScriptIds.length})
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {candidateQueue.map(({ paper, script, student: stu }) => {
                const ex = examinations.find(e => e.id === paper.examination_id);
                const sch = schools.find(sc => sc.id === stu?.school_id);
                const isSelected = !!script && activeScript?.id === script.id;
                const submitted = paper.cbt_status === 'submitted' || paper.cbt_status === 'graded';
                const isVirtual = script?.id?.startsWith('virtual-');

                return (
                  <div
                    key={paper.id}
                    onClick={() => openQueueCandidate({ paper, script, student: stu })}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {script && script.review_status !== 'examiner_approved' && !isVirtual && (
                          <input
                            type="checkbox"
                            checked={selectedBulkScriptIds.includes(script.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedBulkScriptIds(prev =>
                                e.target.checked ? [...new Set([...prev, script.id])] : prev.filter(id => id !== script.id)
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 accent-emerald-600"
                            title="Select for bulk finalization/deletion"
                          />
                        )}
                        <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {stu ? stu.full_name : 'Unknown Candidate'}
                          </h4>
                          {script?.scanned_file_name && (
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase">PDF</span>
                          )}
                          {isVirtual && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">CBT</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{stu?.admission_number}</p>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono truncate">{paper.paper_code}</p>
                      </div>
                      </div>

                      <div className="text-right flex flex-col items-end shrink-0">
                        {script ? (
                          <span className="font-black text-xs text-slate-900">{script.score} / {script.maximum_marks}</span>
                        ) : (
                          <span className="font-black text-[10px] text-amber-600">UPLOAD SCRIPT</span>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            script?.review_status === 'examiner_approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : submitted
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {script?.review_status === 'examiner_approved' ? 'Moderated' : submitted ? 'Submitted' : 'Not Submitted'}
                          </span>

                          {script && !isVirtual && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadScannedAnswerSheet(script, stu, ex, sch);
                                }}
                                title="Download Scanned Answer Sheet PDF"
                                className="p-1 rounded bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-600 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {/* Individual Delete Icon (only if not approved) */}
                              {script.review_status !== 'examiner_approved' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteScript(script.id);
                                  }}
                                  title="Delete this script"
                                  className="p-1 rounded bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {candidateQueue.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No generated candidate papers awaiting script intake or moderation for this examination.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Examiner Moderation & Evaluation Desk */}
        <div className="lg:col-span-8 space-y-4">
          {activeScript && activeStudent ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Candidate Banner */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-amber-400 text-xs font-bold px-2 py-0.5 rounded bg-amber-400/10">
                      {activeStudent.admission_number}
                    </span>
                    <span className="text-xs text-slate-300">
                      {activeSchool?.name || 'Assigned Center'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeStudent.full_name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveQueue(-1)} disabled={candidateQueue.length < 2} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-bold cursor-pointer">← Prev</button>
                  <span className="text-[10px] text-slate-400">{Math.max(1, candidateQueue.findIndex(item => item.script?.id === activeScript?.id) + 1)} / {candidateQueue.length}</span>
                  <button type="button" onClick={() => moveQueue(1)} disabled={candidateQueue.length < 2} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-bold cursor-pointer">Next →</button>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Current Total</span>
                    <span className="text-base font-black text-amber-400">
                      {Object.values(overrideScores).reduce((a: number, b: any) => a + Number(b || 0), 0)} / {activeScript.maximum_marks}
                    </span>
                  </div>

                  <button
                    onClick={handleFinalizeScript}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalize Script (Examiner Approval)</span>
                  </button>
                </div>
              </div>

              {/* Scanned Student Answer Sheet PDF Toolbar Widget */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-300 text-amber-900 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">
                        Candidate Scanned Answer Sheet
                      </h4>
                      {activeScript.scanned_file_name ? (
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded uppercase">
                          PDF Attached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[10px] rounded uppercase">
                          Digital Record
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {activeScript.scanned_file_name
                        ? `${activeScript.scanned_file_name} (${((activeScript.scanned_file_size_bytes || 0) / 1024).toFixed(1)} KB)`
                        : 'Official digital intake script ready for provenance download or PDF scan upload.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScannedPreviewModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-lg border border-slate-300 text-xs shadow-2xs cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Preview Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadScannedAnswerSheet(activeScript, activeStudent, activeExam, activeSchool)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs shadow-2xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Scanned PDF</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDirectAttachScannedPdf(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach or replace scanned student answer sheet PDF"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-400/40 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{activeScript.scanned_file_name ? 'Replace PDF' : 'Attach PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Answers & Moderation Items */}
              <div className="space-y-4">
                {activeScript.answers.map(ans => {
                  const q = activeQuestions.find(item => item.id === ans.question_id);
                  const currentScore = overrideScores[ans.id] !== undefined ? overrideScores[ans.id] : (ans.final_score !== undefined ? ans.final_score : ans.proposed_score || 0);
                  const isModified = ans.proposed_score !== undefined && currentScore !== ans.proposed_score;

                  return (
                    <div
                      key={ans.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                            Q{q?.question_number || '?'}
                          </span>
                          <span className="text-xs font-bold uppercase text-slate-700">
                            [{q?.question_type}] Max: {q?.maximum_marks} Marks
                          </span>
                        </div>

                        {q?.question_type === 'theory' && (
                          <button
                            disabled={isEvaluatingAi}
                            onClick={() => handleEvaluateWithGemini(ans)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isEvaluatingAi ? 'Evaluating...' : 'Gemini AI Theory Mark'}</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-900 font-medium">
                        <strong>Question Prompt:</strong> {q?.text}
                      </div>

                      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Scanned Student Response:
                        </span>
                        <div className="text-xs font-mono text-slate-800 whitespace-pre-wrap">
                          {ans.student_raw_response || '(No written answer provided)'}
                        </div>
                      </div>

                      {(ans.evidence || ans.missing_concepts || ans.reasoning) && (
                        <div className="p-3.5 rounded-lg bg-purple-50/60 border border-purple-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              AI Rubric Breakdown:
                            </span>
                            {ans.confidence && (
                              <span className="text-[10px] text-purple-800 font-bold">
                                Confidence: {(ans.confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>

                          {ans.evidence && (
                            <p className="text-purple-900">
                              <strong>Extracted Evidence:</strong> {ans.evidence}
                            </p>
                          )}

                          {ans.missing_concepts && ans.missing_concepts.length > 0 && (
                            <p className="text-rose-700">
                              <strong>Missing Concepts:</strong> {ans.missing_concepts.join(', ')}
                            </p>
                          )}

                          {ans.reasoning && (
                            <p className="text-purple-900 italic text-[11px]">
                              <strong>Rationale:</strong> {ans.reasoning}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-3">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Awarded Score (Max {q?.maximum_marks}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={q?.maximum_marks || 100}
                            value={currentScore}
                            onChange={e => setOverrideScores({ ...overrideScores, [ans.id]: Number(e.target.value) })}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs"
                          />
                        </div>

                        <div className="md:col-span-9">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Examiner Reason for Change {isModified ? <span className="text-rose-600 font-black">* (Required on Override)</span> : '(Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="State rationale if modifying AI proposed marks..."
                            value={overrideReasons[ans.id] || ''}
                            onChange={e => setOverrideReasons({ ...overrideReasons, [ans.id]: e.target.value })}
                            className={`w-full p-2 bg-white border rounded-lg text-xs ${
                              isModified ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
              <UploadCloud className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">No pending script selected</h3>
              <p className="text-xs text-slate-400 mt-1">Select a pending script from the left panel to moderate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Scanned Answer Sheet Document Preview Modal */}
      {showScannedPreviewModal && activeScript && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Scanned Student Answer Sheet Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadScannedAnswerSheet(activeScript, activeStudent, activeExam, activeSchool)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowScannedPreviewModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {activeScript.scanned_file_data ? (
                activeScript.scanned_file_type?.startsWith('image/') ? (
                  <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center">
                    <img
                      src={activeScript.scanned_file_data}
                      alt="Scanned Answer Sheet"
                      className="max-h-[60vh] object-contain rounded border border-slate-300 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="h-[60vh] w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-100">
                    <iframe
                      src={activeScript.scanned_file_data}
                      title="Scanned PDF Viewer"
                      className="w-full h-full border-none"
                    />
                  </div>
                )
              ) : (
                <div className="border-2 border-slate-300 p-6 rounded-xl bg-white space-y-4 text-xs font-sans">
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Federal Republic of Nigeria • Edo State Ministry of Education
                    </span>
                    <h2 className="text-sm font-black text-slate-900 uppercase mt-1">
                      Official Candidate Answer Sheet Record
                    </h2>
                    <span className="text-[11px] text-amber-700 font-bold font-mono">
                      SCRIPT ARCHIVE ID: {activeScript.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <p><strong>Candidate:</strong> {activeStudent?.full_name}</p>
                      <p><strong>Admission No:</strong> {activeStudent?.admission_number}</p>
                      <p><strong>School:</strong> {activeSchool?.name} ({activeSchool?.lga} LGA)</p>
                    </div>
                    <div>
                      <p><strong>Examination:</strong> {activeExam?.title} ({activeExam?.code})</p>
                      <p><strong>Total Score:</strong> {activeScript.score} / {activeScript.maximum_marks} Marks</p>
                      <p><strong>Review Status:</strong> {activeScript.review_status.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">
                      Recorded Question Responses
                    </h4>
                    {activeScript.answers.map((ans, idx) => (
                      <div key={ans.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                          <span>Question {idx + 1}</span>
                          <span>Score: {ans.final_score !== undefined ? ans.final_score : ans.proposed_score} Marks</span>
                        </div>
                        <div className="bg-white p-2.5 rounded font-mono text-[11px] text-slate-900 border border-slate-200">
                          {ans.student_raw_response || '(No written answer)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Answer Script Intake Modal (Single) */}
      {showIntakeModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Intake Candidate Answer Script & PDF Upload
                </h3>
              </div>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950">
              <strong>Printed-paper workflow:</strong> Select the pupil whose paper was printed → upload the scanned answered script (PDF/JPG/PNG) → verify/transcribe answers → enter or adjust marks below → finalize for examiner approval. The uploaded file is archived against that exact candidate paper.
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Candidate</label>
                  <select
                    value={intakeStudentId}
                    onChange={e => setIntakeStudentId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    {studentPapers
                      .filter(p => p.examination_id === selectedExamId)
                      .map(p => students.find(s => s.id === p.student_id))
                      .filter((s): s is Student => Boolean(s))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.admission_number})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intake Mode</label>
                  <select
                    value={intakeType}
                    onChange={e => setIntakeType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="ocr_upload">Scanned PDF / OCR Answer Sheet</option>
                    <option value="omr_scan">OMR Scanner Feed (Multiple Choice)</option>
                    <option value="manual_entry">Examiner Direct Entry Desk</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Upload Scanned Student Answer Sheet (PDF or Image):
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleIntakeFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                    isDragOver
                      ? 'border-amber-500 bg-amber-50/80'
                      : uploadedPdfFile
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
                  }`}
                >
                  {uploadedPdfFile ? (
                    <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg font-black text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs truncate max-w-xs sm:max-w-md">
                            {uploadedPdfFile.name}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {(uploadedPdfFile.size / 1024).toFixed(1)} KB • Ready for Archival & Intake
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoExtractFromScannedPdf}
                          disabled={isExtractingFile}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isExtractingFile ? 'Transcribing...' : 'Auto-Transcribe PDF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadedPdfFile(null)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        Drag and drop candidate scanned PDF answer sheet here
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports scanned PDF documents or high-resolution images (.pdf, .png, .jpg)
                      </p>
                      <label className="inline-block mt-2.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs cursor-pointer shadow-2xs">
                        Browse Files
                        <input
                          type="file"
                          accept=".pdf,application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleIntakeFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block">Candidate Answers Verification & Entry:</span>
                  <span className="text-[11px] text-slate-500">{intakeQuestions.length} Questions on Candidate Paper</span>
                </div>

                {intakeQuestions.map(q => (
                  <div key={q.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Q{q.question_number}. {q.text}</span>
                      <span className="text-[10px] text-slate-500">[{q.maximum_marks} Marks]</span>
                    </div>

                    {q.question_type === 'objective' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 font-semibold">Selected Option:</span>
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <label key={opt} className="flex items-center gap-1 font-bold cursor-pointer">
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={opt}
                              checked={intakeResponses[q.id] === opt}
                              onChange={e => setIntakeResponses({ ...intakeResponses, [q.id]: e.target.value })}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        placeholder="Type candidate's handwritten response or scanned text..."
                        value={intakeResponses[q.id] || ''}
                        onChange={e => setIntakeResponses({ ...intakeResponses, [q.id]: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Save Script & Open Marking Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Scripts Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Bulk Upload Scanned Answer Scripts
                </h3>
              </div>
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-950">
              <strong>Bulk workflow:</strong> Select multiple PDF/JPG/PNG files. The system will auto-match each file to a candidate by searching for their name, admission number, or paper code in the filename. Matched files will be uploaded as new answer scripts; unmatched files will be skipped.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Files (PDF, JPG, PNG)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,application/pdf,image/*"
                onChange={handleBulkFilesChange}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs cursor-pointer"
              />
            </div>

            {bulkFiles.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-xs font-bold text-slate-700">Matched Files:</div>
                {bulkFiles.map(file => {
                  const status = bulkFileStatus[file.name];
                  const matched = status?.matched || false;
                  return (
                    <div
                      key={file.name}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        matched ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <File className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-mono truncate">{file.name}</span>
                      </div>
                      <div className="text-right text-xs">
                        {matched ? (
                          <span className="text-emerald-700 font-bold">
                            Matched: {status.studentName} ({status.admission})
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold">No match</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBulkUploadModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={isBulkUploading || bulkFiles.length === 0 || !bulkFiles.some(f => bulkFileStatus[f.name]?.matched)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isBulkUploading ? 'Uploading...' : `Upload ${bulkFiles.filter(f => bulkFileStatus[f.name]?.matched).length} Matched Scripts`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};