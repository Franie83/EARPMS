
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  X,
  QrCode,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { Examination, Question, Student, StudentExamPaper, School, ClassLevel, Subject, Session, Term } from '../types';
import { generateQrDataUrl } from '../lib/qr';
import { store } from '../lib/store';

interface StudentQuestionPapersPrintModalProps {
  exam: Examination;
  questions: Question[];
  students: Student[];
  studentPapers: StudentExamPaper[];
  school?: School;
  classLevel?: ClassLevel;
  subject?: Subject;
  session?: Session;
  term?: Term;
  initialStudentId?: string;
  onClose: () => void;
}

export const StudentQuestionPapersPrintModal: React.FC<StudentQuestionPapersPrintModalProps> = ({
  exam,
  questions,
  students,
  studentPapers,
  school,
  classLevel,
  subject,
  session,
  term,
  initialStudentId,
  onClose
}) => {
  const [printMode, setPrintMode] = useState<'bulk' | 'single'>(initialStudentId ? 'single' : 'bulk');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Sort questions by question_number
  const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number);

  // Only candidates with a generated paper belong in the booklet queue.
  // The old implementation used every pupil in the class, which made Preview/Print
  // appear to contain the wrong number of papers and could repeatedly regenerate QR state.
  const classStudents = useMemo(() => {
    const paperStudentIds = new Set(studentPapers.map(p => p.student_id));
    return students.filter(s =>
      paperStudentIds.has(s.id) &&
      s.class_id === exam.class_id &&
      (exam.school_id ? s.school_id === exam.school_id : true)
    );
  }, [students, studentPapers, exam.class_id, exam.school_id]);

  const paperByStudent = useMemo(() => {
    const map = new Map<string, StudentExamPaper>();
    studentPapers.forEach(p => map.set(p.student_id, p));
    return map;
  }, [studentPapers]);

  useEffect(() => {
    let cancelled = false;
    async function loadAllQrs() {
      const urls: Record<string, string> = {};
      for (const student of classStudents) {
        const paper = paperByStudent.get(student.id);
        if (!paper) continue;
        urls[student.id] = await generateQrDataUrl(paper.qr_code_payload);
      }
      if (!cancelled) setQrMap(urls);
    }
    loadAllQrs();
    return () => { cancelled = true; };
  }, [classStudents, paperByStudent]);

  const targetStudents = printMode === 'single'
    ? classStudents.filter(s => s.id === selectedStudentId)
    : classStudents;

  const handlePrint = () => {
    const source = printAreaRef.current;
    if (!source || targetStudents.length === 0) {
      alert('There are no generated candidate papers to print. Generate papers first.');
      return;
    }

    // Print only the official booklet area in a dedicated window. This avoids
    // browser print rules accidentally printing the application shell/navigation.
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('The print window was blocked. Please allow pop-ups for EARPMS and try again.');
      return;
    }
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML).join('\n');
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${exam.title} - Candidate Papers</title>${styles}<style>@page{size:A4;margin:10mm}body{background:#fff!important;margin:0}.print-paper{break-after:page;page-break-after:always}.print-paper:last-child{break-after:auto;page-break-after:auto}@media print{.no-print{display:none!important}}</style></head><body>${source.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 350);
  };

  const isVariableExam = exam.question_paper_mode === 'variable';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:w-full print:max-w-none print:bg-white print:border-0">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Official Student Question Paper Printing
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isVariableExam 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                }`}>
                  {isVariableExam ? `Variable Mode (${exam.variable_question_count || 5} Questions per Student)` : 'Fixed Mode (Unified Questions)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {exam.title} • {classStudents.length} Registered Candidates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switch */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintMode('bulk')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  printMode === 'bulk'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bulk All ({classStudents.length} Students)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('single')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  printMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Individual Candidate
              </button>
            </div>

            {/* If single student mode */}
            {printMode === 'single' && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.admission_number})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Print {printMode === 'bulk' ? `All (${classStudents.length}) Papers` : 'Candidate Paper'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Preview Container */}
        <div ref={printAreaRef} className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-8 print:p-0 print:m-0 print:overflow-visible">
          {targetStudents.map((student, studentIndex) => {
            const paper = paperByStudent.get(student.id);
            const qrUrl = qrMap[student.id];
            const paperCode = paper?.paper_code || `EP-${exam.code.replace(/[^A-Z0-9]/gi, '')}-${String(student.admission_number || student.id).split('/').pop()}`;

            // Candidate Varied / Variable Questions Sequencing
            let candidateQuestions: Question[] = [];
            if (paper?.assigned_question_ids && paper.assigned_question_ids.length > 0) {
              const qMap = new Map(questions.map(q => [q.id, q]));
              candidateQuestions = paper.assigned_question_ids
                .map(id => qMap.get(id))
                .filter((q): q is Question => q !== undefined);
            } else if (isVariableExam) {
              // Compute on the fly if paper doesn't have assigned_question_ids yet
              const targetCount = Math.min(exam.variable_question_count || 5, sortedQuestions.length);
              const qIds = store.computeVariableQuestionsForStudent(sortedQuestions, student.id, targetCount);
              const qMap = new Map(questions.map(q => [q.id, q]));
              candidateQuestions = qIds.map(id => qMap.get(id)).filter((q): q is Question => q !== undefined);
            } else {
              candidateQuestions = sortedQuestions;
            }

            const candidateObjective = candidateQuestions.filter(q => q.question_type === 'objective');
            const candidateTheory = candidateQuestions.filter(q => q.question_type !== 'objective');

            return (
              <div
                key={student.id}
                className="print-paper bg-white text-slate-900 border-2 border-slate-300 rounded-xl p-8 max-w-4xl mx-auto shadow-md print:shadow-none print:border-0 print:p-6 print:m-0 print:break-after-page print:rounded-none"
                style={{ minHeight: '1050px' }}
              >
                {/* Official Exam Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-5 text-center relative">
                  <div className="flex items-start justify-between">
                    {/* Left MINISTRY OF EDUCATION Crest Placeholder / State Emblem */}
                    <div className="w-16 h-16 rounded-xl border-2 border-emerald-700 bg-emerald-50 flex flex-col items-center justify-center p-1">
                      <div className="text-[9px] font-black text-emerald-950 uppercase leading-none">EDO</div>
                      <div className="text-xs font-black text-emerald-700 leading-tight">MINISTRY OF EDUCATION</div>
                      <div className="text-[7px] text-slate-600 font-bold">BENIN CITY</div>
                    </div>

                    <div className="flex-1 px-4">
                      <h4 className="text-xs font-black tracking-widest uppercase text-emerald-900">
                        EDO STATE MINISTRY OF EDUCATION
                      </h4>
                      <h2 className="text-base font-black uppercase text-slate-950 mt-0.5 tracking-tight">
                        {school?.name || 'EMOTAN MODEL PRIMARY SCHOOL, BENIN CITY'}
                      </h2>
                      <p className="text-[11px] font-bold text-slate-700 uppercase mt-0.5">
                        {session?.name || '2025/2026 Academic Session'} • {term?.name || 'Second Term'} Unified Terminal Examination
                      </p>
                      <h3 className="text-sm font-black text-slate-900 mt-1 uppercase border-y border-slate-300 py-1 inline-block px-4">
                        SUBJECT: {subject?.name?.toUpperCase() || 'MATHEMATICS'} ({classLevel?.name || 'PRIMARY 6'})
                      </h3>
                    </div>

                    {/* Right Candidate Verification QR Box */}
                    <div className="flex flex-col items-center justify-center border border-slate-300 rounded-lg p-1.5 bg-slate-50">
                      {qrUrl ? (
                        <img src={qrUrl} alt="Student QR Verification" className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 animate-pulse" />
                      )}
                      <span className="text-[8px] font-mono font-bold text-slate-600 mt-0.5">
                        {paperCode}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Personalized Identity Box */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-left text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Candidate Name:</span>
                      <strong className="text-slate-950 uppercase">{student.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Admission Number:</span>
                      <strong className="text-slate-950 font-mono">{student.admission_number}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Class Arm / Gender:</span>
                      <strong className="text-slate-950">{classLevel?.name} • {student.gender === 'M' ? 'Male' : 'Female'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Duration / Max Score:</span>
                      <strong className="text-slate-950">{exam.duration_minutes} Mins • {exam.maximum_marks} Marks</strong>
                    </div>
                  </div>
                </div>

                {/* Exam Instructions */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-2.5 text-[11px] text-slate-800 mb-6 flex items-start gap-2">
                  <span className="font-bold uppercase text-emerald-900">General Instructions:</span>
                  <span>
                    For Section A, SHADE ONE answer bubble (A, B, C or D) completely with a dark pen or pencil; do not write the letter. Answer Section B structured & theory questions on the designated ruled lines. Show all calculation steps where required.
                    {isVariableExam && (
                      <span className="font-semibold text-emerald-950 ml-1">
                        (Note: This paper contains a randomized personalized question set for Candidate {student.admission_number}).
                      </span>
                    )}
                  </span>
                </div>

                {/* Section A: Objective Questions */}
                {candidateObjective.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-950">
                        SECTION A: OBJECTIVE MULTIPLE CHOICE QUESTIONS ({candidateObjective.reduce((s, q) => s + q.maximum_marks, 0)} MARKS)
                      </h4>
                      <span className="text-[10px] font-black text-slate-600">SHADE ONE BUBBLE PER QUESTION</span>
                    </div>

                    <div className="space-y-3.5">
                      {candidateObjective.map((q, idx) => (
                        <div key={q.id} className="text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-900 w-5">{idx + 1}.</span>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 mb-1.5">{q.text}</p>
                              {q.options && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-800 text-[11px]">
                                  {q.options.map(opt => (
                                    <div key={opt.key} className="flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center font-black text-[9px] bg-white">
                                        {opt.key}
                                      </span>
                                      <span>{opt.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 font-bold">[{q.maximum_marks}m]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B: Structured & Theory */}
                {candidateTheory.length > 0 && (
                  <div className="space-y-6 mb-8">
                    <div className="border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-950">
                        SECTION B: STRUCTURED & THEORY QUESTIONS ({candidateTheory.reduce((s, q) => s + q.maximum_marks, 0)} MARKS)
                      </h4>
                      <span className="text-[10px] font-bold text-slate-600">Write Answers on the Ruled Lines</span>
                    </div>

                    <div className="space-y-6">
                      {candidateTheory.map((q, idx) => {
                        const totalLines = q.answer_lines || (q.question_type === 'theory' ? 8 : 4);
                        return (
                          <div key={q.id} className="text-xs">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-slate-900 w-5">{candidateObjective.length + idx + 1}.</span>
                                <p className="font-semibold text-slate-900">{q.text}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-sans">({totalLines} lines)</span>
                                <span className="font-mono text-[10px] text-slate-500 font-bold whitespace-nowrap">
                                  [{q.maximum_marks} Marks]
                                </span>
                              </div>
                            </div>

                            {/* Ruled Answer Space for Student matching examiner-configured line count */}
                            <div className="space-y-0 mt-2.5 border-t border-dashed border-slate-300">
                              {Array.from({ length: totalLines }).map((_, lineIdx) => (
                                <div
                                  key={lineIdx}
                                  className="border-b border-dashed border-slate-300 h-7 w-full flex items-end justify-between px-1"
                                >
                                  <span className="text-[8px] text-slate-300 font-mono select-none">
                                    L{lineIdx + 1}
                                  </span>
                                  {lineIdx === totalLines - 1 && (
                                    <span className="text-[8px] text-slate-300 select-none">
                                      [End of answer space for Q{candidateObjective.length + idx + 1}]
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Candidate Signature & Examination Integrity Footer */}
                <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <div>
                    <span>Candidate Signature: _______________________</span>
                  </div>
                  <div className="font-mono">
                    Official Booklet • Edo State Ministry of Education Quality Assurance & Evaluation Unit
                  </div>
                  <div>
                    <span>Invigilator Initials: _______</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
