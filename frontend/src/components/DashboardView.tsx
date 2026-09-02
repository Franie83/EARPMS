
import React from 'react';
import {
  Building2,
  Users,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  QrCode,
  Clock,
  History,
  AlertCircle,
  Megaphone,
  Pin,
  Sliders,
  Laptop
} from 'lucide-react';
import { AppStoreState } from '../lib/store';

interface DashboardViewProps {
  storeState: AppStoreState;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenVerifyModal: () => void;
  onOpenStudentCbtModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  storeState,
  onNavigate,
  onOpenVerifyModal,
  onOpenStudentCbtModal
}) => {
  const {
    schools,
    students,
    examinations,
    questions,
    markingSchemes,
    answerScripts,
    results,
    reportCards,
    auditLogs,
    announcements,
    handbookArticles,
    systemConfig,
    currentUser
  } = storeState;

  const verifiedQuestions = questions.filter(q => q.verified).length;
  const approvedScripts = answerScripts.filter(s => s.review_status === 'examiner_approved').length;
  const finalizedResults = results.filter(r => r.status === 'finalized').length;
  const activeAnnouncements = announcements.filter(a => a.is_active);

  const workflowSteps = [
    {
      step: 1,
      title: 'Question Verification Gate',
      desc: 'Verify imported/created questions before any marking scheme can be initialized.',
      count: `${verifiedQuestions}/${questions.length} Verified`,
      status: verifiedQuestions === questions.length && questions.length > 0 ? 'completed' : 'in_progress',
      tab: 'examinations'
    },
    {
      step: 2,
      title: 'Marking Scheme Lifecycle',
      desc: 'Controlled draft -> approve -> lock stages with cryptographic SHA-256 hash.',
      count: `${markingSchemes.filter(s => s.status === 'locked').length} Locked`,
      status: markingSchemes.some(s => s.status === 'locked') ? 'completed' : 'in_progress',
      tab: 'examinations'
    },
    {
      step: 3,
      title: 'Rubric Generation',
      desc: 'Regenerated directly from the latest locked/approved marking scheme criteria.',
      count: `${storeState.rubrics.length} Rubrics`,
      status: storeState.rubrics.length > 0 ? 'completed' : 'in_progress',
      tab: 'examinations'
    },
    {
      step: 4,
      title: 'Personalized QR Papers & Varied CBT',
      desc: 'Master question set with varied candidate sequence & unique barcode identity.',
      count: `${storeState.studentPapers.length} Generated`,
      status: storeState.studentPapers.length > 0 ? 'completed' : 'in_progress',
      tab: 'examinations'
    },
    {
      step: 5,
      title: 'AI & Deterministic Marking',
      desc: 'Instant rule-based MCQ scoring & Gemini 3.7 Flash theory evaluation.',
      count: `${answerScripts.length} Intake Scripts`,
      status: answerScripts.length > 0 ? 'completed' : 'in_progress',
      tab: 'assessment'
    },
    {
      step: 6,
      title: 'Examiner Review Gate',
      desc: 'Moderation with mandatory reason-for-change override audit trail.',
      count: `${approvedScripts}/${answerScripts.length} Moderated`,
      status: approvedScripts === answerScripts.length && answerScripts.length > 0 ? 'completed' : 'in_progress',
      tab: 'assessment'
    },
    {
      step: 7,
      title: 'Competition Ranking',
      desc: 'Deterministic standard competition tie ranking (1st, 2nd, 2nd, 4th).',
      count: `${finalizedResults} Finalized`,
      status: finalizedResults > 0 ? 'completed' : 'in_progress',
      tab: 'results'
    },
    {
      step: 8,
      title: 'QR-Secured Report Cards',
      desc: 'Aggregated terminal reports with digital QR verification code.',
      count: `${reportCards.length} Issued`,
      status: reportCards.length > 0 ? 'completed' : 'in_progress',
      tab: 'report-cards'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner in Emerald Green Theme */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-6 sm:p-8 text-white border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold border border-emerald-400/30 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Edo State Ministry of Education Unified Examination Management Infrastructure
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome to Super Admin Accounting
          </h2>
          <p className="text-emerald-100/90 text-sm leading-relaxed mb-6">
            EARPMS delivers end-to-end examination management for Edo State schools: from verified question authoring, versioned marking schemes, and personalized varied question papers to AI-assisted theory evaluation, examiner moderation, daily roll call, and tamper-proof report card verification.
          </p>

          <div className="flex flex-wrap gap-3">
            {/* Direct CBT / Offline Exam Portal Button */}
            {onOpenStudentCbtModal && (
              <button
                onClick={onOpenStudentCbtModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-emerald-100" />
                <span>Student CBT & Offline Exam Portal</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('examinations')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors border border-emerald-400/30 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>Examinations & Question Bank</span>
            </button>

            <button
              onClick={() => onNavigate('rollcall')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs border border-emerald-400/30 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Classroom Daily Roll Call</span>
            </button>

            <button
              onClick={onOpenVerifyModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-200 font-semibold rounded-xl text-xs border border-emerald-400/30 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              <span>Verify Issued Report Card</span>
            </button>

            {(currentUser.role === 'super-admin' || currentUser.role === 'admin') && (
              <button
                onClick={() => onNavigate('content-mgmt')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/90 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs border border-emerald-400/40 transition-colors cursor-pointer shadow"
              >
                <Sliders className="w-4 h-4" />
                <span>Content & Reset Controls</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Stream & Guidelines Widget if any exist */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Official Board Announcements & Directives
              </h3>
            </div>
            {(currentUser.role === 'super-admin' || currentUser.role === 'admin') && (
              <button
                onClick={() => onNavigate('content-mgmt')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" /> Manage Content
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAnnouncements.slice(0, 2).map(anc => (
              <div
                key={anc.id}
                className={`p-3.5 rounded-xl border text-xs ${
                  anc.is_pinned ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      anc.category === 'alert' ? 'bg-rose-100 text-rose-700' :
                      anc.category === 'schedule' ? 'bg-blue-100 text-blue-700' :
                      anc.category === 'policy' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {anc.category}
                    </span>
                    {anc.is_pinned && (
                      <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(anc.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{anc.title}</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{anc.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Key Metric Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Schools</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schools.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Edo State LGAs</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Pupils</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{students.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Enrolled candidates</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Examinations</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{examinations.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">{questions.length} total questions</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Answer Scripts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{answerScripts.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">{approvedScripts} moderated</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Results</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{finalizedResults}</div>
          <div className="text-[11px] text-slate-400 mt-1">Competition ranked</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Report Cards</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{reportCards.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">QR verifiable</div>
        </div>
      </div>

      {/* End-to-End Operational Lifecycle Pipeline */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Edo State Ministry of Education 8-Stage Examination Lifecycle Pipeline</span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Guaranteed Quality & Moderation Gates
              </span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Every stage enforces audit preservation, cryptographic validation, and examiner moderation rules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map(st => (
            <div
              key={st.step}
              onClick={() => onNavigate(st.tab)}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    Stage {st.step}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    st.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {st.count}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-950 transition-colors">
                  {st.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {st.desc}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-amber-700 group-hover:text-amber-800 gap-1">
                <span>View module</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-specific examination workflow activity: submitted notes and principal decisions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {currentUser.role === 'teacher' ? 'My Examination Submissions' : 'Principal Examination Review'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {currentUser.role === 'teacher'
                ? 'Submission action and teacher comment sent to the Principal.'
                : 'Principal approval/request-for-change action and comment recorded against each examination.'}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {examinations
            .filter(ex => currentUser.role === 'teacher'
              ? ex.created_by === currentUser.id || ex.created_by_name === currentUser.full_name
              : ['principal','admin','super-admin'].includes(currentUser.role)
                ? !!ex.submitted_at || !!ex.reviewed_at
                : false)
            .sort((a,b) => new Date(b.reviewed_at || b.submitted_at || 0).getTime() - new Date(a.reviewed_at || a.submitted_at || 0).getTime())
            .slice(0, 5)
            .map(ex => (
              <div key={ex.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{ex.title} <span className="font-mono text-slate-400">({ex.code})</span></div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {ex.submitted_at ? `Sent ${new Date(ex.submitted_at).toLocaleString()}` : 'Not submitted'}
                      {ex.reviewed_at ? ` • Reviewed ${new Date(ex.reviewed_at).toLocaleString()}` : ''}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                    {(ex.approval_status || ex.status).replace(/_/g, ' ')}
                  </span>
                </div>
                {currentUser.role === 'teacher' && ex.submission_notes && (
                  <div className="mt-2 text-[11px] text-slate-700"><strong>Teacher action/comment:</strong> {ex.submission_notes}</div>
                )}
                {['principal','admin','super-admin'].includes(currentUser.role) && ex.principal_feedback && (
                  <div className="mt-2 text-[11px] text-slate-700"><strong>Principal action/comment:</strong> {ex.principal_feedback}</div>
                )}
              </div>
            ))}
          {examinations.filter(ex => currentUser.role === 'teacher'
              ? ex.created_by === currentUser.id || ex.created_by_name === currentUser.full_name
              : ['principal','admin','super-admin'].includes(currentUser.role)
                ? !!ex.submitted_at || !!ex.reviewed_at
                : false).length === 0 && (
            <div className="text-xs text-slate-400 p-3 rounded-xl border border-dashed border-slate-300">
              No examination workflow activity for this dashboard yet.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Live Audit Stream & System Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Trail Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Real-Time System Audit Log</h3>
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
            >
              View Full Audit Trail
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    log.action === 'LOCK' ? 'bg-purple-100 text-purple-800' :
                    log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                    log.action === 'FINALIZE' ? 'bg-blue-100 text-blue-800' :
                    log.action === 'CREATE' ? 'bg-teal-100 text-teal-800' :
                    log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.action}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {log.entity_type} <span className="text-slate-400 font-normal">({log.entity_id})</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Triggered by <strong className="text-slate-700">{log.actor}</strong>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Access Controls Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Ministry of Education Security & Governance</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Access control enforces strict school isolation for classroom examiners, while Super-Admin and Admin roles maintain central statewide oversight.
            </p>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400">AI Marking Engine:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini 3.7 Flash
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400">Scheme Cryptography:</span>
                <span className="font-mono text-[11px] text-slate-200">SHA-256 Hashing</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400">Moderation Override:</span>
                <span className="text-emerald-400 font-semibold">Audit Reason Gated</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Edo State Ministry of Education Headquarters</span>
            <span className="text-amber-400 font-bold">Benin City, Edo State</span>
          </div>
        </div>
      </div>
    </div>
  );
};
