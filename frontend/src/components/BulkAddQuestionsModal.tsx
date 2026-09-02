
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Layers,
  Save,
  Copy
} from 'lucide-react';
import { store } from '../lib/store';
import { Examination, Question } from '../types';

interface BulkAddQuestionsModalProps {
  exam: Examination;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuestionDraft {
  id: string;
  question_number: number;
  question_type: 'objective' | 'structured' | 'theory';
  text: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correct_answer: string;
  expected_answer: string;
  maximum_marks: number;
}

export const BulkAddQuestionsModal: React.FC<BulkAddQuestionsModalProps> = ({
  exam,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'interactive' | 'paste'>('interactive');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initial 4 draft rows
  const [rows, setRows] = useState<QuestionDraft[]>([
    {
      id: 'd-1',
      question_number: 1,
      question_type: 'objective',
      text: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correct_answer: 'A',
      expected_answer: '',
      maximum_marks: 10
    },
    {
      id: 'd-2',
      question_number: 2,
      question_type: 'objective',
      text: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correct_answer: 'B',
      expected_answer: '',
      maximum_marks: 10
    },
    {
      id: 'd-3',
      question_number: 3,
      question_type: 'structured',
      text: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correct_answer: '',
      expected_answer: '',
      maximum_marks: 20
    },
    {
      id: 'd-4',
      question_number: 4,
      question_type: 'theory',
      text: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correct_answer: '',
      expected_answer: '',
      maximum_marks: 25
    }
  ]);

  const handleAddRow = () => {
    const nextNum = rows.length + 1;
    setRows(prev => [
      ...prev,
      {
        id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
        question_number: nextNum,
        question_type: nextNum <= 2 ? 'objective' : 'theory',
        text: '',
        optA: '',
        optB: '',
        optC: '',
        optD: '',
        correct_answer: 'A',
        expected_answer: '',
        maximum_marks: nextNum <= 2 ? 10 : 20
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    const filtered = rows.filter(r => r.id !== id);
    // Renumber
    setRows(filtered.map((r, idx) => ({ ...r, question_number: idx + 1 })));
  };

  const handleRowChange = (id: string, field: keyof QuestionDraft, val: any) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id === id) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  };

  const handleLoadSamplePaste = () => {
    setPasteText(`1. What is the standard SI unit of force in Physics?
A. Joule
B. Newton
C. Watt
D. Pascal
Answer: B
Marks: 10

2. Which organ in the human body filters metabolic waste from blood to form urine?
A. Liver
B. Heart
C. Kidney
D. Spleen
Answer: C
Marks: 10

3. Name three vital agricultural food crops widely cultivated in Edo State.
Answer: Cassava, Yam, Plantain, Maize, Oil Palm.
Marks: 20

4. (a) Define photosynthesis. (b) Write the word equation for photosynthesis.
Answer: (a) Photosynthesis is the chemical process whereby green plants use sunlight to synthesize nutrients from carbon dioxide and water. (b) Carbon Dioxide + Water + Sunlight -> Glucose + Oxygen.
Marks: 30`);
  };

  // Parse structured pasted text
  const parsePastedQuestions = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split('\n');
    const parsed: QuestionDraft[] = [];
    let current: Partial<QuestionDraft> | null = null;
    let autoNum = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const qNumMatch = line.match(/^(\d+)[\.\)]\s*(.*)$/);
      if (qNumMatch) {
        if (current && current.text) {
          parsed.push({
            id: `p-${Date.now()}-${parsed.length}`,
            question_number: current.question_number || autoNum++,
            question_type: current.question_type || 'objective',
            text: current.text || '',
            optA: current.optA || '',
            optB: current.optB || '',
            optC: current.optC || '',
            optD: current.optD || '',
            correct_answer: current.correct_answer || 'A',
            expected_answer: current.expected_answer || '',
            maximum_marks: current.maximum_marks || 10
          });
        }
        current = {
          question_number: parseInt(qNumMatch[1], 10),
          text: qNumMatch[2],
          question_type: 'objective',
          maximum_marks: 10
        };
        continue;
      }

      if (!current) {
        current = {
          question_number: autoNum++,
          text: line,
          question_type: 'objective',
          maximum_marks: 10
        };
        continue;
      }

      // Check options
      const optMatch = line.match(/^([A-D])[\.\)]\s*(.*)$/i);
      if (optMatch) {
        const key = optMatch[1].toUpperCase();
        if (key === 'A') current.optA = optMatch[2];
        if (key === 'B') current.optB = optMatch[2];
        if (key === 'C') current.optC = optMatch[2];
        if (key === 'D') current.optD = optMatch[2];
        current.question_type = 'objective';
        continue;
      }

      // Check Answer
      const ansMatch = line.match(/^(?:Answer|Key|Correct Answer)[\s\:\-]+([A-D]|\b.+)$/i);
      if (ansMatch) {
        const val = ansMatch[1].trim();
        if (val.length === 1 && ['A', 'B', 'C', 'D'].includes(val.toUpperCase())) {
          current.correct_answer = val.toUpperCase();
          current.question_type = 'objective';
        } else {
          current.expected_answer = val;
          if (current.question_type !== 'objective') {
            current.question_type = 'theory';
          }
        }
        continue;
      }

      // Check Marks
      const marksMatch = line.match(/^(?:Marks|Score|Points)[\s\:\-]+(\d+)/i);
      if (marksMatch) {
        current.maximum_marks = parseInt(marksMatch[1], 10);
        continue;
      }

      // Otherwise append to text or expected answer
      if (current.expected_answer) {
        current.expected_answer += ' ' + line;
      } else {
        current.text = (current.text ? current.text + ' ' : '') + line;
      }
    }

    if (current && current.text) {
      parsed.push({
        id: `p-${Date.now()}-${parsed.length}`,
        question_number: current.question_number || autoNum++,
        question_type: current.question_type || (current.optA ? 'objective' : 'theory'),
        text: current.text || '',
        optA: current.optA || '',
        optB: current.optB || '',
        optC: current.optC || '',
        optD: current.optD || '',
        correct_answer: current.correct_answer || 'A',
        expected_answer: current.expected_answer || '',
        maximum_marks: current.maximum_marks || 10
      });
    }

    if (parsed.length > 0) {
      setRows(parsed);
      setMode('interactive');
      setNotification({ type: 'success', message: `Parsed ${parsed.length} questions from text!` });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: 'error', message: 'Could not detect question format. Please check formatting.' });
    }
  };

  const handleSaveAll = () => {
    // Validate rows
    const validRows = rows.filter(r => r.text.trim().length > 0);
    if (validRows.length === 0) {
      setNotification({ type: 'error', message: 'Please provide question text for at least one question.' });
      return;
    }

    const payload = validRows.map(r => {
      const isObj = r.question_type === 'objective';
      return {
        question_number: r.question_number,
        question_type: r.question_type,
        text: r.text.trim(),
        options: isObj ? [
          { key: 'A', text: r.optA.trim() || 'Option A' },
          { key: 'B', text: r.optB.trim() || 'Option B' },
          { key: 'C', text: r.optC.trim() || 'Option C' },
          { key: 'D', text: r.optD.trim() || 'Option D' }
        ] : undefined,
        correct_answer: isObj ? r.correct_answer : undefined,
        expected_answer: !isObj ? (r.expected_answer.trim() || 'Award marks for complete working steps.') : undefined,
        maximum_marks: Number(r.maximum_marks) || 10,
        verified: true
      };
    });

    const res = store.bulkAddQuestionsAndAnswers(exam.id, payload, replaceExisting);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const totalCalculatedMarks = rows.reduce((sum, r) => sum + (Number(r.maximum_marks) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bulk Add Exam Questions & Answers</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adding to: <strong className="text-amber-300">{exam.title}</strong> ({exam.code})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher & Stats Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setMode('interactive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'interactive'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Interactive Table Grid ({rows.length} Questions)
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'paste'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Paste Formatted Q&A Document
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Replace existing questions in this exam</span>
            </label>

            <div className="bg-slate-900 text-amber-400 font-mono font-bold px-3 py-1 rounded-lg border border-slate-800">
              Total Marks: {totalCalculatedMarks} / {exam.maximum_marks}
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`p-3 text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-b border-emerald-300'
                : 'bg-rose-100 text-rose-900 border-b border-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {mode === 'interactive' ? (
            <div className="space-y-4">
              {rows.map((row, idx) => (
                <div
                  key={row.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center">
                        Q{row.question_number}
                      </span>
                      <select
                        value={row.question_type}
                        onChange={(e) => handleRowChange(row.id, 'question_type', e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="objective">Objective (Multiple Choice)</option>
                        <option value="structured">Structured</option>
                        <option value="theory">Theory / Essay</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span>Max Marks:</span>
                        <input
                          type="number"
                          value={row.maximum_marks}
                          onChange={(e) => handleRowChange(row.id, 'maximum_marks', parseInt(e.target.value, 10) || 0)}
                          className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <input
                      type="text"
                      placeholder={`Enter Question ${row.question_number} statement / problem prompt...`}
                      value={row.text}
                      onChange={(e) => handleRowChange(row.id, 'text', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  {/* Options if Objective */}
                  {row.question_type === 'objective' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {(['A', 'B', 'C', 'D'] as const).map((optKey) => (
                        <div key={optKey} className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`correct-${row.id}`}
                              checked={row.correct_answer === optKey}
                              onChange={() => handleRowChange(row.id, 'correct_answer', optKey)}
                              className="text-amber-500 focus:ring-amber-400"
                            />
                            <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                              {optKey}
                            </span>
                          </label>
                          <input
                            type="text"
                            placeholder={`Option ${optKey} text...`}
                            value={
                              optKey === 'A'
                                ? row.optA
                                : optKey === 'B'
                                ? row.optB
                                : optKey === 'C'
                                ? row.optC
                                : row.optD
                            }
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                optKey === 'A'
                                  ? 'optA'
                                  : optKey === 'B'
                                  ? 'optB'
                                  : optKey === 'C'
                                  ? 'optC'
                                  : 'optD',
                                e.target.value
                              )
                            }
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Expected Answer / Steps for Structured/Theory */
                    <div>
                      <textarea
                        rows={2}
                        placeholder="Model expected answer & marking steps / criteria guidance..."
                        value={row.expected_answer}
                        onChange={(e) => handleRowChange(row.id, 'expected_answer', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Add Another Question Row</span>
                </button>
              </div>
            </div>
          ) : (
            /* Paste Document Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste combined questions and answers formatted with numbers (e.g. 1. Question... A. Opt A B. Opt B Answer: B Marks: 10).
                </p>
                <button
                  type="button"
                  onClick={handleLoadSamplePaste}
                  className="text-xs text-amber-500 font-bold hover:underline cursor-pointer"
                >
                  Load Sample Format
                </button>
              </div>

              <textarea
                rows={12}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="1. Question text...&#10;A. Option A&#10;B. Option B&#10;C. Option C&#10;D. Option D&#10;Answer: B&#10;Marks: 10&#10;&#10;2. Structured Question...&#10;Answer: Model steps...&#10;Marks: 20"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500 leading-relaxed"
              />

              <button
                type="button"
                onClick={parsePastedQuestions}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Parse Questions into Interactive Grid</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Questions to Exam</span>
          </button>
        </div>
      </div>
    </div>
  );
};
