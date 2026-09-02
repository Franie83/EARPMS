import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Send,
  XCircle,
  Clock,
  UserCheck,
  FileText,
  Lock,
  Printer,
  X
} from 'lucide-react';
import { store } from '../lib/store';
import { Examination, User, Question, MarkingScheme, Rubric } from '../types';

interface ExamApprovalWorkflowModalProps {
  exam: Examination;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExamApprovalWorkflowModal: React.FC<ExamApprovalWorkflowModalProps> = ({
  exam,
  currentUser,
  onClose,
  onSuccess
}) => {
  const isPrincipalOrAdmin = ['super-admin', 'admin', 'principal'].includes(currentUser.role);
  const isTeacher = currentUser.role === 'teacher';

  const [notes, setNotes] = useState(exam.submission_notes || '');
  const [feedback, setFeedback] = useState(exam.principal_feedback || '');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const questions = store.getState().questions.filter(q => q.examination_id === exam.id);
  const schemes = store.getState().markingSchemes.filter(s => s.examination_id === exam.id && !s.is_deleted && !s.is_hidden);
  const rubrics = store.getState().rubrics.filter(r => r.examination_id === exam.id);

  const activeScheme = schemes[0];
  const activeRubric = rubrics[0];

  const allQuestionsVerified = questions.length > 0 && questions.every(q => q.verified);
  const hasApprovedScheme = schemes.some(s => s.status === 'approved' || s.status === 'locked');
  const hasLockedRubric = rubrics.some(r => r.status === 'approved' || r.status === 'locked');

  // Teacher submits exam
  const handleSubmitToPrincipal = () => {
    if (!allQuestionsVerified) {
      setNotification({ type: 'error', message: 'All questions must be verified before submitting to Principal.' });
      return;
    }
    if (!hasApprovedScheme) {
      setNotification({ type: 'error', message: 'Please create/approve a marking scheme before submitting.' });
      return;
    }
    if (!hasLockedRubric) {
      setNotification({ type: 'error', message: 'Please generate and lock the rubric matrix before submitting.' });
      return;
    }

    const res = store.submitExamForPrincipalApproval(exam.id, notes);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  // Principal reviews exam
  const handlePrincipalDecision = (decision: 'approve' | 'request_changes' | 'reject') => {
    if (decision === 'request_changes' && !feedback.trim()) {
      setNotification({ type: 'error', message: 'Please provide specific feedback/instructions on what changes are needed.' });
      return;
    }

    const res = store.reviewExamByPrincipal(exam.id, decision, feedback);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isPrincipalOrAdmin ? 'Principal Moderation & Approval Gateway' : 'Submit Examination for Principal Moderation'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {exam.title} ({exam.code})
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

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Current Status Tracker */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-500 font-medium">Approval Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  exam.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : exam.status === 'submitted_for_approval'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : exam.status === 'changes_requested'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : exam.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {exam.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">1. Exam Questions Ingested & Verified:</span>
                <span className={`font-bold flex items-center gap-1 ${allQuestionsVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {allQuestionsVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {questions.length} Questions ({questions.reduce((s, q) => s + q.maximum_marks, 0)} Marks)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">2. Marking Scheme Generated:</span>
                <span className={`font-bold flex items-center gap-1 ${activeScheme ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {activeScheme ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {activeScheme ? `v${activeScheme.version} (${activeScheme.status})` : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">3. Rubric Matrix Locked:</span>
                <span className={`font-bold flex items-center gap-1 ${activeRubric ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {activeRubric ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {activeRubric ? `v${activeRubric.version} (${activeRubric.status})` : 'Missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Display Teacher's Submission Notes (visible to Principal) */}
          {isPrincipalOrAdmin && exam.submitted_at && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
              <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Teacher's Submission Notes:</span>
              </div>
              <p className="text-blue-900 dark:text-blue-200 leading-relaxed font-medium whitespace-pre-wrap">
                {exam.submission_notes || '(No notes provided)'}
              </p>
              {exam.submitted_at && (
                <div className="text-[11px] text-blue-700/80 dark:text-blue-400 mt-2">
                  Submitted by {exam.created_by_name || 'Teacher'} on {new Date(exam.submitted_at).toLocaleDateString()} at {new Date(exam.submitted_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* If Changes were requested or previous feedback exists */}
          {exam.principal_feedback && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Principal's Moderation Feedback:</span>
              </div>
              <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                {exam.principal_feedback}
              </p>
              {exam.reviewed_at && (
                <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-2">
                  Reviewed by {exam.reviewed_by_name || 'Principal'} on {new Date(exam.reviewed_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* If Teacher is Submitting */}
          {(!isPrincipalOrAdmin || exam.status === 'draft' || exam.status === 'ready' || exam.status === 'changes_requested') && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Teacher's Submission Notes for the Principal:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., All 5 exam questions, marking scheme criteria, and rubric matrix have been calibrated against the Edo State Ministry of Education Primary 6 curriculum. Ready for official approval."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />

              <button
                type="button"
                onClick={handleSubmitToPrincipal}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit to Principal for Official Moderation</span>
              </button>
            </div>
          )}

          {/* If Principal or Admin is Reviewing */}
          {isPrincipalOrAdmin && (
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span>Principal Moderation Decision & Feedback</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Principal's Moderation Remarks / Adjustment Instructions:
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide comments, quality assurance notes, or specific instructions for the teacher..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePrincipalDecision('approve')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrincipalDecision('request_changes')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrincipalDecision('reject')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};