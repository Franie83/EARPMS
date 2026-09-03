import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  Download,
  Award,
  TrendingUp,
  Users,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { store, AppStoreState } from '../lib/store';
import { Examination, Result, Student, GradeScale } from '../types';
import { downloadReportCardPdf } from '../lib/pdfDownloader';
import { ResultsAnalyticsCharts } from './ResultsAnalyticsCharts';

interface ResultsViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
  onGenerateReportCard: (studentId: string, sessionId: string, termId: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  storeState,
  onRefresh,
  onGenerateReportCard
}) => {
  const {
    examinations,
    results,
    students,
    subjects,
    classes,
    gradeScales,
    answerScripts,
    reportCards,
    schools,
    sessions,
    terms,
    systemConfig
  } = storeState;

  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingStudentId, setDownloadingStudentId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);

  React.useEffect(() => {
    if (!examinations.some(e => e.id === selectedExamId)) {
      setSelectedExamId(examinations[0]?.id || '');
    }
  }, [examinations, selectedExamId]);

  const selectedExam = examinations.find(e => e.id === selectedExamId);
  const examResults = results.filter(r => r.examination_id === selectedExamId).sort((a, b) => a.position - b.position || b.percentage - a.percentage);
  const examScripts = answerScripts.filter(s => s.examination_id === selectedExamId);

  const pendingScriptsCount = examScripts.filter(s => s.review_status !== 'examiner_approved').length;
  const isFinalized = selectedExam?.status === 'finalized' && examResults.every(r => r.status === 'finalized');

  // Stats
  const totalCandidates = examResults.length;
  const averagePercentage = totalCandidates > 0
    ? (examResults.reduce((sum, r) => sum + r.percentage, 0) / totalCandidates).toFixed(1)
    : '0.0';
  const highestPercentage = totalCandidates > 0
    ? Math.max(...examResults.map(r => r.percentage)).toFixed(1)
    : '0.0';
  const passCount = examResults.filter(r => r.percentage >= (selectedExam?.passing_percentage || 50)).length;
  const passRate = totalCandidates > 0 ? ((passCount / totalCandidates) * 100).toFixed(0) : '0';

  // Handle Finalize Results Gate
  const handleFinalizeResults = () => {
    if (!selectedExam) return;
    const res = store.finalizeExaminationResults(selectedExam.id);
    alert(res.message);
    onRefresh();
  };

  // Finalize every examination whose candidate scripts are already examiner-approved.
  const handleBulkFinalizeResults = () => {
    const res = store.finalizeAllEligibleExaminationResults();
    alert(res.message);
    onRefresh();
  };

  // ---- NEW: Recalculate Percentages ----
  const handleRecalcPercentages = () => {
    if (!selectedExam) return;
    const res = store.recalculateResultPercentages(selectedExam.id);
    alert(res.message);
    if (res.success) onRefresh();
  };

  // Handle Direct Download of Student Report Card from Results Table
  const handleDirectDownloadReportCard = async (studentId: string) => {
    if (!selectedExam) return;
    const existingCard = reportCards.find(
      rc => rc.student_id === studentId && rc.session_id === selectedExam.session_id && rc.term_id === selectedExam.term_id
    );

    const student = students.find(s => s.id === studentId);
    const school = student ? schools.find(sc => sc.id === student.school_id) : null;
    const studentClass = student ? classes.find(c => c.id === student.class_id) : null;
    const session = sessions.find(s => s.id === selectedExam.session_id);
    const term = terms.find(t => t.id === selectedExam.term_id);

    try {
      setDownloadingStudentId(studentId);
      if (existingCard) {
        await downloadReportCardPdf(existingCard, student, school || undefined, studentClass, session, term, storeState.systemConfig);
      } else {
        // Auto-generate if not yet generated
        const genRes = store.generateReportCard(studentId, selectedExam.session_id, selectedExam.term_id);
        if (genRes.success && genRes.reportCard) {
          onRefresh();
          await downloadReportCardPdf(genRes.reportCard, student, school || undefined, studentClass, session, term, storeState.systemConfig);
        } else {
          alert(genRes.message || 'Could not compile report card.');
        }
      }
    } catch (e) {
      console.error('Download report card error', e);
      alert('Error downloading report card.');
    } finally {
      setDownloadingStudentId(null);
    }
  };

  const filteredResults = examResults.filter(r => {
    const stu = students.find(s => s.id === r.student_id);
    if (!stu) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return stu.full_name.toLowerCase().includes(q) || stu.admission_number.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            Examination Results & Competition Rankings
          </h2>
          <p className="text-xs text-slate-500">
            Standard competition tie ranking, percentage calculation, and automated grading scale classification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {examinations.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.code} ({ex.title})
              </option>
            ))}
          </select>

          {/* Toggle Analytics Visualizer */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              showAnalytics
                ? 'bg-orange-500 text-slate-950 border border-orange-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{showAnalytics ? 'Hide Performance Trends' : 'View LGA & School Trends'}</span>
          </button>

          {/* RECALC PERCENTAGES BUTTON (NEW) */}
          <button
            onClick={handleRecalcPercentages}
            disabled={!selectedExam}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            title="Recalculate percentages for all results using the current exam maximum marks"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recalc Percentages</span>
          </button>

          {/* Finalize Results Gate Button */}
          <button
            onClick={handleFinalizeResults}
            disabled={isFinalized}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isFinalized
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : pendingScriptsCount > 0
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isFinalized ? 'Results Finalized & Locked' : 'Finalize Examination Results'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Cross-LGA and School Data Visualization */}
      {showAnalytics && selectedExam && (
        <ResultsAnalyticsCharts
          examination={selectedExam}
          results={examResults}
          students={students}
          schools={schools}
          subjects={subjects}
        />
      )}

      {/* Warning if unapproved scripts exist */}
      {!isFinalized && pendingScriptsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Finalization Gate Notice:</strong> {pendingScriptsCount} answer script(s) are still pending examiner review. All candidate scripts must be moderated before Statewide finalization.
            </span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Total Candidates</span>
          <div className="text-2xl font-black text-slate-900">{totalCandidates}</div>
          <span className="text-[11px] text-slate-400">Class Pupils</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Class Mean</span>
          <div className="text-2xl font-black text-slate-900">{averagePercentage}%</div>
          <span className="text-[11px] text-emerald-600 font-medium">Average Performance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Highest Score</span>
          <div className="text-2xl font-black text-amber-600">{highestPercentage}%</div>
          <span className="text-[11px] text-slate-400">Top Candidate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold block mb-1">Passing Rate</span>
          <div className="text-2xl font-black text-blue-600">{passRate}%</div>
          <span className="text-[11px] text-slate-400">Above {selectedExam?.passing_percentage}% Benchmark</span>
        </div>
      </div>

      {/* Master Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name or admission no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Master Broadsheet</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Raw Marks</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredResults.map(res => {
                const stu = students.find(s => s.id === res.student_id);

                return (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        res.position === 1 ? 'bg-amber-500 text-slate-950 shadow-xs' :
                        res.position === 2 ? 'bg-slate-300 text-slate-900' :
                        res.position === 3 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {res.position > 0 ? res.position : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {stu ? stu.full_name : 'Unknown'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {stu?.admission_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {res.raw_marks} / {res.maximum_marks}
                    </td>
                    <td className="py-3 px-4 font-black text-amber-600">
                      {res.percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                        res.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        res.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        res.grade === 'C' ? 'bg-teal-100 text-teal-800' :
                        res.grade === 'D' ? 'bg-amber-100 text-amber-800' :
                        res.grade === 'E' ? 'bg-orange-100 text-orange-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {res.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        res.status === 'finalized'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {selectedExam && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDirectDownloadReportCard(res.student_id)}
                            disabled={downloadingStudentId === res.student_id}
                            title="Download Official PDF Report Card"
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Download className="w-3 h-3" />
                            <span>{downloadingStudentId === res.student_id ? 'Downloading...' : 'Download Card'}</span>
                          </button>
                          <button
                            onClick={() => onGenerateReportCard(res.student_id, selectedExam.session_id, selectedExam.term_id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            View Card
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No examination results records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};