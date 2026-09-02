
import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Save,
  Printer,
  History,
  TrendingUp,
  AlertCircle,
  Building2,
  GraduationCap,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { store } from '../lib/store';
import { User, School, ClassLevel, Student, DailyRollCall, AttendanceStatus, StudentAttendanceRecord } from '../types';

interface DailyRollCallViewProps {
  currentUser: User;
}

export const DailyRollCallView: React.FC<DailyRollCallViewProps> = ({ currentUser }) => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    return store.subscribe(setState);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || state.schools[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    currentUser.assigned_class_id || state.classes[0]?.id || ''
  );
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; remark: string }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'history'>('roster');

  const currentSchool = state.schools.find(s => s.id === selectedSchoolId);
  const currentClass = state.classes.find(c => c.id === selectedClassId);
  const activeSession = state.sessions.find(s => s.is_active) || state.sessions[0];
  const activeTerm = state.terms.find(t => t.is_active) || state.terms[0];

  // Filter students by selected school & class
  const enrolledStudents = state.students.filter(
    s => s.class_id === selectedClassId && (selectedSchoolId ? s.school_id === selectedSchoolId : true)
  );

  // Load existing roll call record for this date & class
  useEffect(() => {
    const existing = state.dailyRollCalls.find(
      rc => rc.school_id === selectedSchoolId && rc.class_id === selectedClassId && rc.date === selectedDate
    );

    const initialMap: Record<string, { status: AttendanceStatus; remark: string }> = {};
    enrolledStudents.forEach(s => {
      if (existing) {
        const found = existing.records.find(r => r.student_id === s.id);
        initialMap[s.id] = {
          status: found ? found.status : 'present',
          remark: found?.remark || ''
        };
      } else {
        // Default to present for quick intake
        initialMap[s.id] = {
          status: 'present',
          remark: ''
        };
      }
    });
    setRecords(initialMap);
  }, [selectedDate, selectedSchoolId, selectedClassId, state.dailyRollCalls, enrolledStudents.length]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark
      }
    }));
  };

  const handleBatchMark = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remark: string }> = {};
    enrolledStudents.forEach(s => {
      updated[s.id] = {
        status,
        remark: records[s.id]?.remark || ''
      };
    });
    setRecords(updated);
  };

  const handleSaveRollCall = () => {
    if (!selectedSchoolId || !selectedClassId) {
      setNotification({ type: 'error', message: 'Please select a school and class.' });
      return;
    }

    const attendanceRecords: StudentAttendanceRecord[] = enrolledStudents.map(s => ({
      student_id: s.id,
      status: records[s.id]?.status || 'present',
      remark: records[s.id]?.remark || undefined
    }));

    const result = store.saveDailyRollCall({
      date: selectedDate,
      school_id: selectedSchoolId,
      class_id: selectedClassId,
      taken_by_user_id: currentUser.id,
      taken_by_name: currentUser.full_name,
      session_id: activeSession?.id || 'ses-2026',
      term_id: activeTerm?.id || 't-2',
      records: attendanceRecords,
      total_students: enrolledStudents.length,
      present_count: attendanceRecords.filter(r => r.status === 'present').length,
      absent_count: attendanceRecords.filter(r => r.status === 'absent').length,
      late_count: attendanceRecords.filter(r => r.status === 'late').length,
      excused_count: attendanceRecords.filter(r => r.status === 'excused').length,
      attendance_rate_percent: 0, // will be computed in store
      status: 'submitted'
    });

    if (result.success) {
      setNotification({ type: 'success', message: result.message });
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({ type: 'error', message: result.message });
    }
  };

  // Stats calculation
  const totalStudents = enrolledStudents.length;
  const presentCount = enrolledStudents.filter(s => records[s.id]?.status === 'present').length;
  const lateCount = enrolledStudents.filter(s => records[s.id]?.status === 'late').length;
  const excusedCount = enrolledStudents.filter(s => records[s.id]?.status === 'excused').length;
  const absentCount = enrolledStudents.filter(s => records[s.id]?.status === 'absent').length;
  const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  // Filtered roster for search
  const filteredStudents = enrolledStudents.filter(
    s =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // History records for this class
  const classHistory = state.dailyRollCalls.filter(
    rc => rc.school_id === selectedSchoolId && rc.class_id === selectedClassId
  ).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Daily Roll Call & Attendance Register</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  Live Sync
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Classroom teachers take daily attendance to track student presence, calculate termly attendance totals, and sync with report cards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubTab(activeSubTab === 'roster' ? 'history' : 'roster')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{activeSubTab === 'history' ? 'Back to Daily Roll Call' : 'View Attendance History'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="Print standard register"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Register</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Attendance Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>School Institution</span>
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              disabled={currentUser.role === 'teacher' && !!currentUser.school_id}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500 disabled:opacity-75 cursor-pointer"
            >
              {state.schools.map(sch => (
                <option key={sch.id} value={sch.id}>
                  {sch.name} ({sch.lga})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Class Arm</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {state.classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Class Teacher in Charge</span>
            </label>
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-300 font-medium truncate">
              {currentUser.role === 'teacher' ? currentUser.full_name : `${currentClass?.name || 'Class'} Lead Teacher`}
            </div>
          </div>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
              : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {activeSubTab === 'roster' ? (
        <>
          {/* Daily KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Total Enrolled</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {totalStudents}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Pupils in roster</div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <span>Present</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {presentCount}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1">
                {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}% on time
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <span>Late Arrival</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">
                {lateCount}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">Recorded with notes</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-semibold">
                <span>Excused</span>
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
                {excusedCount}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-500 mt-1">Medical / Leave</div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-semibold">
                <span>Absent</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">
                {absentCount}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-500 mt-1">Unexcused</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Daily Rate</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-1 text-2xl font-black text-white">
                {attendanceRate}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Roster & Roll Call Action Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search pupil name or admission no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 w-64"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Showing {filteredStudents.length} of {totalStudents} pupils
                </span>
              </div>

              {/* Quick Batch Marking Buttons */}
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="text-xs text-slate-500 font-medium mr-1">Quick Batch:</span>
                <button
                  onClick={() => handleBatchMark('present')}
                  className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-800"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleBatchMark('late')}
                  className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer border border-amber-300 dark:border-amber-800"
                >
                  All Late
                </button>
                <button
                  onClick={() => handleBatchMark('absent')}
                  className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-rose-300 dark:border-rose-800"
                >
                  All Absent
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">S/N</th>
                    <th className="px-4 py-3">Pupil / Candidate</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3">Remarks / Reason for Late/Absence</th>
                    <th className="px-4 py-3 text-right">Cumulative Term Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No enrolled pupils found matching your selection.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const currentStatus = records[student.id]?.status || 'present';
                      const currentRemark = records[student.id]?.remark || '';

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                                {student.full_name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                  {student.full_name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {student.admission_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                student.gender === 'M'
                                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                              }`}
                            >
                              {student.gender === 'M' ? 'Male (M)' : 'Female (F)'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'present')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'late')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'excused')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'excused'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
                                }`}
                              >
                                Excused
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <input
                              type="text"
                              value={currentRemark}
                              onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                              placeholder="Add remark (e.g. medical note)..."
                              className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {student.attendance_days} / {student.total_days} Days
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {Math.round((student.attendance_days / (student.total_days || 1)) * 100)}% Rate
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Submission Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  Submitting will permanently lock this rollcall for <strong>{selectedDate}</strong> and update student report card records.
                </span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleSaveRollCall}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Submit & Save Daily Roll Call</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Historical Register Records Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Submitted Roll Call Register History</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review past attendance entries for {currentSchool?.name} ({currentClass?.name}).
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 font-bold text-xs rounded-full border border-amber-500/30">
              {classHistory.length} Days Recorded
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {classHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No past roll calls submitted yet for this class arm.
              </div>
            ) : (
              classHistory.map((rc) => (
                <div
                  key={rc.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex flex-col items-center justify-center font-bold">
                      <span className="text-[10px] uppercase">{new Date(rc.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm leading-none">{rc.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {new Date(rc.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Recorded by <strong className="text-slate-700 dark:text-slate-300">{rc.taken_by_name}</strong> • {rc.total_students} Total Pupils
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                        {rc.present_count} Present
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                        {rc.late_count} Late
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[11px]">
                        {rc.excused_count} Excused
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                        {rc.absent_count} Absent
                      </span>
                    </div>

                    <div className="px-3 py-1 rounded-lg bg-slate-900 text-amber-400 font-mono font-bold text-xs border border-slate-800">
                      {rc.attendance_rate_percent}% Rate
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDate(rc.date);
                        setActiveSubTab('roster');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer text-xs"
                    >
                      Load & Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
