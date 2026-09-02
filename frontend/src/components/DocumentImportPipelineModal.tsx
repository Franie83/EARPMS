
import React, { useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { store, AppStoreState } from '../lib/store';
import { Examination, Question, Subject, ClassLevel } from '../types';

interface DocumentImportPipelineModalProps {
  storeState: AppStoreState;
  onClose: () => void;
  onSuccess: (examId: string) => void;
  defaultExamId?: string;
}

const SAMPLE_DOCUMENTS = [
  {
    name: 'Primary 6 Basic Science & Tech (Unified Q&A)',
    text: `EDO STATE MINISTRY OF EDUCATION
UNIFIED TERMINAL EXAMINATION - PRIMARY 6
SUBJECT: Basic Science & Technology
TIME ALLOWED: 1 Hour 30 Minutes | TOTAL MARKS: 100

SECTION A: OBJECTIVE QUESTIONS (Answer All Questions)
1. What is the standard International System (SI) unit for measuring electric current?
A. Volt (V)
B. Ampere (A)
C. Ohm (Ω)
D. Watt (W)
[Answer: B, Marks: 10]
[Explanation: The ampere is the SI unit of electrical current, named after André-Marie Ampère.]

2. Which of the following is a non-renewable source of energy commonly extracted in the Niger Delta?
A. Solar energy
B. Crude oil (Petroleum)
C. Wind energy
D. Hydroelectric power
[Answer: B, Marks: 10]
[Explanation: Crude oil is a fossil fuel formed over millions of years and cannot be replenished quickly.]

3. The human organ responsible for pumping blood throughout the entire circulatory system is the:
A. Liver
B. Kidney
C. Heart
D. Lungs
[Answer: C, Marks: 10]
[Explanation: The heart is a muscular organ that pumps oxygenated and deoxygenated blood through blood vessels.]

SECTION B: STRUCTURED & THEORY (Answer All Questions)
4. State two primary functions of the roots of a flowering plant.
[Answer: 1. Anchorage: Anchoring the plant firmly into the soil. 2. Absorption: Absorbing water and dissolved mineral nutrients from the soil to the leaves for photosynthesis.]
[Marks: 20]
[Lines: 6]

5. Explain three effective environmental conservation methods used in Edo State farming communities to prevent soil erosion.
[Answer: 1. Terracing and contour ploughing on sloped lands. 2. Planting cover crops such as legumes to bind topsoil. 3. Mulching to shield bare soil against torrential rain impact.]
[Marks: 25]
[Lines: 8]

6. A farmer harvested 450 bags of cassava in 2025. In 2026, the yield increased by 20%. 
(a) Calculate the increase in bags of cassava.
(b) Calculate the total number of bags harvested in 2026.
Show all workings clearly.
[Answer: (a) Increase in bags = 20% of 450 = (20 / 100) * 450 = 90 bags.
(b) Total bags harvested in 2026 = 450 + 90 = 540 bags.]
[Marks: 25]
[Lines: 10]`
  },
  {
    name: 'Primary 6 Social Studies & Civic Education (Q&A)',
    text: `EDO STATE MINISTRY OF EDUCATION
SECOND TERM ASSESSMENT - SOCIAL STUDIES & CIVIC EDUCATION
CLASS: Primary 6 | DURATION: 90 Minutes | MAXIMUM MARKS: 100

1. Which historic ancient kingdom located in Edo State is globally celebrated for royal bronze casting and ivory carving?
A. Oyo Empire
B. Benin Kingdom
C. Sokoto Caliphate
D. Kanem-Bornu
[Answer: B, Marks: 10]

2. The head of the traditional government in the ancient Benin Kingdom is called the:
A. Emir
B. Oba of Benin
C. Alaafin
D. Obi
[Answer: B, Marks: 10]

3. Which of the following is a civic duty of every Nigerian citizen in Edo State?
A. Evading taxes
B. Voting peacefully during elections
C. Destroying public utilities
D. Refusing to obey laws
[Answer: B, Marks: 10]

4. List three fundamental human rights guaranteed by the 1999 Constitution of the Federal Republic of Nigeria.
[Answer: 1. Right to life. 2. Right to personal liberty. 3. Right to freedom of expression and the press.]
[Marks: 30]
[Lines: 6]

5. Describe two key functions of the Edo State Ministry of Education in improving basic education.
[Answer: 1. Continuous professional training and empowerment of primary school teachers through EdoBEST. 2. Provision of modern digital tablets, textbooks, and quality instructional learning infrastructure across all public primary schools.]
[Marks: 40]
[Lines: 8]`
  }
];

export const DocumentImportPipelineModal: React.FC<DocumentImportPipelineModalProps> = ({
  storeState,
  onClose,
  onSuccess,
  defaultExamId
}) => {
  const { subjects, classes, sessions, terms, examinations } = storeState;

  // Pipeline Step: 1 = Upload/Paste & Meta, 2 = Review Extracted Q&A & Pipeline Options, 3 = Completed Artifacts
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Document input state
  const [importMode, setImportMode] = useState<'text' | 'file'>('text');
  const [documentText, setDocumentText] = useState(SAMPLE_DOCUMENTS[0].text);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedBase64, setAttachedBase64] = useState<string | null>(null);
  const [attachedMimeType, setAttachedMimeType] = useState<string>('text/plain');

  // Exam Meta
  const [examMeta, setExamMeta] = useState({
    title: 'Primary 6 Unified Basic Science Assessment',
    subject_id: subjects[0]?.id || '',
    class_id: classes[0]?.id || '',
    session_id: sessions[0]?.id || '',
    term_id: terms[0]?.id || '',
    duration_minutes: 90,
    maximum_marks: 100,
    passing_percentage: 50,
    question_paper_mode: 'fixed' as 'fixed' | 'variable',
    variable_question_count: 5
  });

  // Parsed Output State (Editable in Step 2)
  const [parsedQuestions, setParsedQuestions] = useState<Partial<Question>[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Pipeline execution state
  const [pipelineOptions, setPipelineOptions] = useState({
    autoVerify: true,
    autoApproveScheme: true,
    generateMarkingScheme: true,
    generateRubric: true,
    generateStudentPapers: true
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{
    examId: string;
    questionsCount: number;
    schemeId?: string;
    rubricId?: string;
    papersCount?: number;
  } | null>(null);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFileName(file.name);
    setAttachedMimeType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.onload = () => {
        setDocumentText(reader.result as string);
        setAttachedBase64(null);
      };
      reader.readAsText(file);
    } else {
      // PDF or DOCX or images
      reader.onload = () => {
        setAttachedBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 -> 2: Call Gemini API to parse and extract structured Q&A
  const handleParseDocument = async () => {
    if (!documentText.trim() && !attachedBase64) {
      setParseError('Please paste examination document text or upload a question paper file.');
      return;
    }
    setParseError(null);
    setIsParsing(true);

    try {
      const data = await store.parseExamDocument({
        documentText: documentText || undefined,
        fileBase64: attachedBase64 ? attachedBase64.split(',').pop() : undefined,
        mimeType: attachedMimeType
      });
      if (data?.error) throw new Error(data.error);

      if (data.questions && data.questions.length > 0) {
        // Enrich questions with answer_lines if missing
        const enriched = data.questions.map((q: any) => ({
          ...q,
          answer_lines: q.answer_lines || (q.question_type === 'theory' ? 8 : (q.question_type === 'structured' ? 4 : undefined))
        }));
        setParsedQuestions(enriched);

        // Keep the examination title entered by the user; document title is not allowed to overwrite it.
        if (data.durationMinutes) {
          setExamMeta(prev => ({ ...prev, duration_minutes: data.durationMinutes }));
        }
        if (data.totalMarks) {
          setExamMeta(prev => ({ ...prev, maximum_marks: data.totalMarks }));
        }

        setCurrentStep(2);
      } else {
        throw new Error('Could not parse any questions from the document. Please check the text format.');
      }
    } catch (e: any) {
      setParseError(e.message || 'Failed to parse document with AI.');
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2 -> 3: Execute End-to-End Pipeline
  const handleExecutePipeline = () => {
    if (parsedQuestions.length === 0) return;
    setIsExecuting(true);

    try {
      const result = store.importAndGenerateCompleteExamPipeline({
        examId: defaultExamId || undefined,
        newExamData: {
          title: examMeta.title,
          subject_id: examMeta.subject_id,
          class_id: examMeta.class_id,
          session_id: examMeta.session_id,
          term_id: examMeta.term_id,
          duration_minutes: examMeta.duration_minutes,
          maximum_marks: examMeta.maximum_marks,
          passing_percentage: examMeta.passing_percentage,
          question_paper_mode: examMeta.question_paper_mode,
          variable_question_count: examMeta.variable_question_count
        },
        questions: parsedQuestions,
        autoVerifyQuestions: pipelineOptions.autoVerify,
        generateMarkingScheme: pipelineOptions.generateMarkingScheme,
        autoApproveScheme: pipelineOptions.autoApproveScheme,
        generateRubric: pipelineOptions.generateRubric,
        generateStudentPapers: pipelineOptions.generateStudentPapers
      });

      setPipelineResult({
        examId: result.exam.id,
        questionsCount: result.questions.length,
        schemeId: result.scheme?.id,
        rubricId: result.rubric?.id,
        papersCount: result.studentPapersCount
      });

      setCurrentStep(3);
    } catch (e: any) {
      alert('Pipeline execution failed: ' + e.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadCsvTemplate = () => {
    const csvContent = `question_number,question_type,text,option_a,option_b,option_c,option_d,correct_answer,expected_answer,maximum_marks,answer_lines
1,objective,"What is the SI unit of electric current?","Volt","Ampere","Ohm","Watt","B","Ampere (A) is the SI unit",10,
2,objective,"Which organ pumps blood?","Liver","Kidney","Heart","Lungs","C","The heart pumps blood",10,
3,theory,"State two functions of plant roots.","","","","","","1. Anchorage 2. Absorption of water/nutrients",20,6
4,theory,"Explain two methods to prevent soil erosion.","","","","","","1. Terracing 2. Cover cropping",30,8`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'edo_state_ministry_of_education_exam_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalParsedMarks = parsedQuestions.reduce((sum, q) => sum + (Number(q.maximum_marks) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                AI Unified Exam & Q&A Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                End-to-end ingestion: Question Paper + Solutions → Verified Questions → Marking Scheme → Rubric → Printable & CBT Papers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator Strip */}
        <div className="py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              1
            </span>
            <span className={`text-xs font-bold ${currentStep >= 1 ? 'text-emerald-950' : 'text-slate-400'}`}>
              Document Ingestion & Metadata
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </span>
            <span className={`text-xs font-bold ${currentStep >= 2 ? 'text-emerald-950' : 'text-slate-400'}`}>
              Review Extracted Q&A & Pipeline Settings
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className={`text-xs font-bold ${currentStep === 3 ? 'text-emerald-950' : 'text-slate-400'}`}>
              Pipeline Artifacts Generated
            </span>
          </div>
        </div>

        {/* Body Content by Step */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* STEP 1: Ingestion & Exam Setup */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Exam Metadata Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Target Examination Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Examination Title</label>
                    <input
                      type="text"
                      value={examMeta.title}
                      onChange={e => setExamMeta({ ...examMeta, title: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Subject</label>
                      <select
                        value={examMeta.subject_id}
                        onChange={e => setExamMeta({ ...examMeta, subject_id: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Class Level</label>
                      <select
                        value={examMeta.class_id}
                        onChange={e => setExamMeta({ ...examMeta, class_id: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Exam Mode & Question Count Setting */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Question Paper Mode</label>
                    <select
                      value={examMeta.question_paper_mode}
                      onChange={e => setExamMeta({ ...examMeta, question_paper_mode: e.target.value as any })}
                      className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-950"
                    >
                      <option value="fixed">Fixed (All Unified Questions)</option>
                      <option value="variable">Variable (Subset per Student)</option>
                    </select>
                  </div>

                  {examMeta.question_paper_mode === 'variable' && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Questions per Student</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={examMeta.variable_question_count}
                        onChange={e => setExamMeta({ ...examMeta, variable_question_count: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={examMeta.duration_minutes}
                      onChange={e => setExamMeta({ ...examMeta, duration_minutes: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Document Input Method */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      2. Input Combined Q&A Examination Document
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleDownloadCsvTemplate}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        title="Download standard structured CSV template"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        <span>Download CSV Template</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setImportMode('text')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        importMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Paste Text / Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('file')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        importMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Upload File (.txt, .pdf, .docx, .md)
                    </button>
                  </div>
                </div>

                {importMode === 'file' ? (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-3">
                    <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Upload Unified Examination Document
                      </strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Accepts question papers with answer keys in .txt, .pdf, .docx, .json, .csv, or markdown format.
                      </p>
                    </div>

                    <input
                      type="file"
                      accept=".txt,.pdf,.docx,.doc,.json,.csv,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="exam-doc-upload"
                    />
                    <label
                      htmlFor="exam-doc-upload"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{attachedFileName ? 'Replace Uploaded File' : 'Browse Document File'}</span>
                    </label>

                    {attachedFileName && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-semibold text-slate-800 flex items-center justify-between max-w-md mx-auto">
                        <span className="truncate">{attachedFileName}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Ready for Parsing
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={documentText}
                      onChange={e => setDocumentText(e.target.value)}
                      rows={9}
                      placeholder="Paste complete question paper document here. Include questions, options (A,B,C,D), correct answers, expected solutions, and marks allocations..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500">Quick Test Samples:</span>
                      {SAMPLE_DOCUMENTS.map((doc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDocumentText(doc.text);
                            setAttachedFileName('');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          + {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Review Parsed Q&A */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{examMeta.title}</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      {parsedQuestions.length} Questions Extracted
                    </span>
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">
                      {examMeta.question_paper_mode === 'variable' ? `Variable (${examMeta.variable_question_count} Qs)` : 'Fixed (All Qs)'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review questions, answer keys, ruled lines, and mark points before pipeline generation.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Calculated Marks</span>
                    <strong className="text-emerald-400 text-base">{totalParsedMarks} Marks</strong>
                  </div>
                </div>
              </div>

              {/* Questions Review List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-emerald-300 font-bold text-xs flex items-center justify-center">
                          Q{q.question_number}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          q.question_type === 'objective' ? 'bg-emerald-100 text-emerald-800' :
                          q.question_type === 'structured' ? 'bg-teal-100 text-teal-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {q.question_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {q.question_type !== 'objective' && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-500 font-bold text-[11px]">Ruled Lines:</span>
                            <input
                              type="number"
                              min={2}
                              max={30}
                              value={q.answer_lines || 6}
                              onChange={e => {
                                const updated = [...parsedQuestions];
                                updated[idx].answer_lines = Number(e.target.value);
                                setParsedQuestions(updated);
                              }}
                              className="w-14 p-1 bg-white border border-slate-300 rounded text-center text-xs font-bold text-emerald-950"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-500 font-bold text-[11px]">Marks:</span>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={q.maximum_marks || 10}
                            onChange={e => {
                              const updated = [...parsedQuestions];
                              updated[idx].maximum_marks = Number(e.target.value);
                              setParsedQuestions(updated);
                            }}
                            className="w-14 p-1 bg-white border border-slate-300 rounded text-center text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <textarea
                      value={q.text || ''}
                      onChange={e => {
                        const updated = [...parsedQuestions];
                        updated[idx].text = e.target.value;
                        setParsedQuestions(updated);
                      }}
                      rows={2}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                    />

                    {/* Model Expected Answer / Steps */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Official Model Answer & Marking Steps:
                      </span>
                      <textarea
                        value={q.expected_answer || ''}
                        onChange={e => {
                          const updated = [...parsedQuestions];
                          updated[idx].expected_answer = e.target.value;
                          setParsedQuestions(updated);
                        }}
                        rows={2}
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* End-to-End Pipeline Automation Options */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">
                    Automated Output Artifacts & Security Generation:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-800">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pipelineOptions.autoVerify}
                      onChange={e => setPipelineOptions({ ...pipelineOptions, autoVerify: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>1. Auto-Approve & Verify all Questions</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pipelineOptions.generateMarkingScheme}
                      onChange={e => setPipelineOptions({ ...pipelineOptions, generateMarkingScheme: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>2. Generate Versioned Marking Scheme</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pipelineOptions.generateRubric}
                      onChange={e => setPipelineOptions({ ...pipelineOptions, generateRubric: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>3. Generate Rubric from Approved Questions</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pipelineOptions.generateStudentPapers}
                      onChange={e => setPipelineOptions({ ...pipelineOptions, generateStudentPapers: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>4. Generate Master Paper & QR Booklets</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pipeline Completion Summary */}
          {currentStep === 3 && pipelineResult && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Examination Pipeline Complete!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  All examination questions, marking schemes, grading rubrics, and student question papers have been generated.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Questions</span>
                  <strong className="text-lg font-black text-slate-900">{pipelineResult.questionsCount}</strong>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase block font-bold">Marking Scheme</span>
                  <strong className="text-lg font-black text-emerald-900">v1.0 Ready</strong>
                </div>
                <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200">
                  <span className="text-[10px] text-teal-700 uppercase block font-bold">Rubric</span>
                  <strong className="text-lg font-black text-teal-900">Generated</strong>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 uppercase block font-bold">Student Papers</span>
                  <strong className="text-lg font-black text-amber-900">{pipelineResult.papersCount || 0}</strong>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(pipelineResult.examId);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Open Examination Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
          {currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              ← Back to Document Source
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleParseDocument}
                disabled={isParsing || (!documentText.trim() && !attachedBase64)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isParsing ? 'Analyzing Document with AI...' : 'Parse Document & Extract Q&A'}</span>
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleExecutePipeline}
                disabled={isExecuting || parsedQuestions.length === 0}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Generate Exam Paper, Marking Scheme & Rubric</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
