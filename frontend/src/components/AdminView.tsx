
import React, { useState } from 'react';
import {
  Settings,
  Users,
  Award,
  Database,
  History,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Edit2,
  X,
  Save,
  UserCheck,
  UserX,
  Clock,
  ArrowUpRight,
  ShieldOff
} from 'lucide-react';
import { store, AppStoreState } from '../lib/store';
import { User, GradeScale, AuditLog } from '../types';
import { SystemAuditLogView } from './SystemAuditLogView';

interface AdminViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  storeState,
  onRefresh,
}) => {
  const {
    users,
    schools,
    gradeScales,
    auditLogs,
    currentUser,
    examinations,
    students,
    subjects,
    answerScripts,
    results,
    reportCards
  } = storeState;

  const [activeTab, setActiveTab] = useState<'users' | 'grades' | 'data' | 'audit'>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeScale | null>(null);
  const [editGradeForm, setEditGradeForm] = useState({
    name: '',
    grade: '',
    min_percent: 0,
    max_percent: 100,
    remark: '',
    gpa_point: 0
  });
  const [showEditGradeModal, setShowEditGradeModal] = useState(false);
  
  
  
  const [showResetEmptyModal, setShowResetEmptyModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Edit user modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    username: '',
    role: '' as User['role'],
    school_id: ''
  });
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState<{
    username: string;
    email: string;
    full_name: string;
    role: User['role'];
    school_id: string;
    password: string;
  }>({
    username: '',
    email: '',
    full_name: '',
    role: 'teacher',
    school_id: schools[0]?.id || '',
    password: ''
  });

  // New Grade Scale Form State
  const [newGrade, setNewGrade] = useState({
    name: 'Primary 6 Standard',
    grade: 'A',
    min_percent: 75,
    max_percent: 100,
    remark: 'Distinction / Excellent',
    gpa_point: 5.0
  });

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.full_name) {
      alert('Full name and email are required.');
      return;
    }
    const password = newUser.password || `Earpms@${Date.now().toString().slice(-6)}`;
    const res = store.createUser({
      username: newUser.username || newUser.email.split('@')[0],
      email: newUser.email, full_name: newUser.full_name, role: newUser.role,
      school_id: newUser.role === 'super-admin' || newUser.role === 'director' ? null : (newUser.school_id || null),
      password
    });
    alert(res.message + (res.success ? `\nTemporary password: ${password}` : ''));
    if (res.success) {
      setShowAddUserModal(false);
      setNewUser({ username: '', email: '', full_name: '', role: 'teacher', school_id: schools[0]?.id || '', password: '' });
      onRefresh();
    }
  };

  // Handle Add Grade
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.createGradeScale({
      name: newGrade.name,
      grade: newGrade.grade.toUpperCase(),
      min_percent: Number(newGrade.min_percent),
      max_percent: Number(newGrade.max_percent),
      remark: newGrade.remark,
      gpa_point: Number(newGrade.gpa_point)
    });
    alert(res.message);
    if (res.success) {
      setShowAddGradeModal(false);
      onRefresh();
    }
  };

  // --- User Management Actions ---
  const openEditModal = (user: User) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role,
      school_id: user.school_id || ''
    });
    setEditFeedback(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    const updates: any = {
      full_name: editForm.full_name.trim(),
      email: editForm.email.trim(),
      username: editForm.username.trim(),
    };
    if (editForm.role !== editUser.role) {
      updates.role = editForm.role;
    }
    if (editForm.school_id !== (editUser.school_id || '')) {
      updates.school_id = editForm.school_id || null;
    }

    const res = store.updateUser(editUser.id, updates);
    if (res.success) {
      setEditFeedback('User updated successfully.');
      setTimeout(() => {
        setEditUser(null);
        onRefresh();
      }, 800);
    } else {
      setEditFeedback(res.message);
    }
  };

  const handleToggleActive = (userId: string) => {
    const res = store.toggleUserActive(userId);
    alert(res.message);
    onRefresh();
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    const res = store.deleteUser(userId);
    alert(res.message);
    onRefresh();
  };

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Do not ask the administrator to type a raw School ID. A principal can
    // legitimately be created/promoted before a school exists. The school
    // assignment is completed later from Academic Setup -> Assign Principal.
    const schoolId = (newRole === 'super-admin' || newRole === 'director')
      ? null
      : (user.school_id || null);

    const res = store.promoteOrUpdateUserRole(userId, newRole, schoolId);
    alert(res.message + (res.success && newRole === 'principal' && !schoolId
      ? '\nThis Principal is pending school assignment. Create the school, then use Assign Principal.'
      : ''));
    onRefresh();
  };

  const openEditGradeModal = (grade: GradeScale) => {
    setEditingGrade(grade);
    setEditGradeForm({
      name: grade.name,
      grade: grade.grade,
      min_percent: grade.min_percent,
      max_percent: grade.max_percent,
      remark: grade.remark,
      gpa_point: grade.gpa_point
    });
    setShowEditGradeModal(true);
  };

  const handleDeleteGrade = (grade: GradeScale) => {
    if (!confirm(`Delete grade ${grade.grade} from ${grade.name}? This action cannot be undone.`)) return;
    const res = store.deleteGradeScale(grade.id);
    alert(res.message);
    if (res.success) onRefresh();
  };

  const handleUpdateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;
    const res = store.updateGradeScale(editingGrade.id, {
      name: editGradeForm.name,
      grade: editGradeForm.grade.toUpperCase(),
      min_percent: Number(editGradeForm.min_percent),
      max_percent: Number(editGradeForm.max_percent),
      remark: editGradeForm.remark,
      gpa_point: Number(editGradeForm.gpa_point)
    });
    alert(res.message);
    if (res.success) {
      setShowEditGradeModal(false);
      setEditingGrade(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            System Administration & Audit Governance
          </h2>
          <p className="text-xs text-slate-500">
            RBAC user administration, grade scale configuration, super-admin data management, and full audit logs.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'grades' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Grade Scales ({gradeScales.length})
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'data' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Data Mgmt
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">System Users & Role-Based Access Controls</span>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Scope / School</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {users.map(u => {
                    const sch = schools.find(s => s.id === u.school_id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <strong className="text-slate-900 block">{u.full_name}</strong>
                          <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${
                            u.role === 'super-admin' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                            u.role === 'director' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            u.role === 'principal' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                            'bg-teal-100 text-teal-900 border-teal-300'
                          }`}>
                            {u.role === 'super-admin' ? 'Super Admin' :
                             u.role === 'director' ? 'Director' :
                             u.role === 'principal' ? 'Principal' : 'Teacher'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.role === 'super-admin' || u.role === 'director' ? (
                            <strong className="text-orange-950 font-semibold">Statewide / Ministry of Education HQ</strong>
                          ) : (
                            sch ? `${sch.name} (${sch.lga})` : 'Unassigned'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {/* Clickable status badge */}
                          <button
                            onClick={() => {
                              if (u.id === currentUser.id) {
                                alert('You cannot change your own status.');
                                return;
                              }
                              if (confirm(`Are you sure you want to ${u.is_active ? 'suspend' : 'activate'} user "${u.full_name}"?`)) {
                                handleToggleActive(u.id);
                              }
                            }}
                            className={`px-2 py-1 rounded font-bold text-[10px] cursor-pointer transition-colors ${
                              u.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.is_active ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Role promotion dropdown */}
                            <select
                              onChange={(e) => {
                                const newRole = e.target.value as User['role'];
                                if (newRole && newRole !== u.role) {
                                  handleRoleChange(u.id, newRole);
                                }
                                e.target.value = u.role;
                              }}
                              value={u.role}
                              className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer hover:bg-slate-200"
                            >
                              <option value="super-admin">Super</option>
                              <option value="director">Director</option>
                              <option value="principal">Principal</option>
                              <option value="teacher">Teacher</option>
                            </select>

                            {/* Delete */}
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grade Scales Tab */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Edo State Ministry of Education Grade Scales & Cutoffs</span>
              <p className="text-[11px] text-slate-400">Composite unique constraint enforced on (Scale Name + Grade Letter).</p>
            </div>
            <button onClick={() => setShowAddGradeModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Grade Scale Cutoff</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Scale Name</th>
                    <th className="py-3 px-4">Grade Letter</th>
                    <th className="py-3 px-4">Score Range (%)</th>
                    <th className="py-3 px-4">GPA Points</th>
                    <th className="py-3 px-4">Official Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {[...gradeScales].sort((a, b) => b.min_percent - a.min_percent).map(g => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{g.name}</td>
                      <td className="py-3 px-4">
                        <span className={`w-6 h-6 rounded flex items-center justify-center font-black ${g.grade === 'A' ? 'bg-emerald-600 text-white' : g.grade === 'B' ? 'bg-blue-600 text-white' : g.grade === 'C' ? 'bg-teal-600 text-white' : g.grade === 'D' ? 'bg-amber-500 text-slate-950' : g.grade === 'E' ? 'bg-orange-500 text-white' : 'bg-rose-600 text-white'}`}>{g.grade}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{g.min_percent}% – {g.max_percent}%</td>
                      <td className="py-3 px-4 font-bold">{Number(g.gpa_point).toFixed(1)}</td>
                      <td className="py-3 px-4 text-slate-600">{g.remark}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openEditGradeModal(g)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold" title="Edit grade scale">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteGrade(g)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold" title="Delete grade scale">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-900">Data Management</h3>
                <p className="text-xs text-slate-500 mt-1">Super-Admin controls for backup, restore and database lifecycle actions. Quick Access is the only automatic seed.</p>
              </div>
              <Database className="w-6 h-6 text-slate-500" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                ['Users', users.length], ['Schools', schools.length], ['Students', students.length], ['Examinations', examinations.length],
                ['Results', results.length], ['Report Cards', reportCards.length], ['Grade Scales', gradeScales.length], ['Audit Logs', auditLogs.length]
              ].map(([label, count]) => (
                <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{label}</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{count}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-slate-900 mb-2">Quick Access Seed</h4>
                <p className="text-[11px] text-slate-500">
                  Quick Access creates only the authorized login accounts. Schools, pupils, examinations,
                  questions, scripts, results and report cards are never automatically reseeded.
                  Your business data remains persistent across relaunches and application updates.
                </p>
              </div>

              <div className="md:col-span-2 border border-rose-200 bg-rose-50 rounded-xl p-4">
                <h4 className="text-xs font-black text-rose-900 mb-1">Danger Zone</h4>
                <p className="text-[11px] text-rose-800 mb-3">Use the protected reset only when you intentionally want to clear the application database.</p>
                <button type="button" onClick={() => { setConfirmText(''); setShowResetEmptyModal(true); }} className="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-black">
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Empty Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <SystemAuditLogView
          auditLogs={auditLogs}
          schools={schools}
          currentUserRole={currentUser.role}
        />
      )}

      {/* Add Grade Scale Modal */}
      {showAddGradeModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Grade Scale Cutoff</h3>
            <form onSubmit={handleAddGrade} className="space-y-3 text-xs">
              <div><label className="font-bold text-slate-700 block mb-1">Grade Scale Name</label><input type="text" required value={newGrade.name} onChange={e => setNewGrade({ ...newGrade, name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-bold text-slate-700 block mb-1">Grade Letter</label><input type="text" required maxLength={2} value={newGrade.grade} onChange={e => setNewGrade({ ...newGrade, grade: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-bold" /></div>
                <div><label className="font-bold text-slate-700 block mb-1">GPA Points</label><input type="number" step="0.1" min="0" required value={newGrade.gpa_point} onChange={e => setNewGrade({ ...newGrade, gpa_point: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-bold text-slate-700 block mb-1">Min %</label><input type="number" min={0} max={100} required value={newGrade.min_percent} onChange={e => setNewGrade({ ...newGrade, min_percent: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div>
                <div><label className="font-bold text-slate-700 block mb-1">Max %</label><input type="number" min={0} max={100} required value={newGrade.max_percent} onChange={e => setNewGrade({ ...newGrade, max_percent: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div>
              </div>
              <div><label className="font-bold text-slate-700 block mb-1">Official Remarks</label><input type="text" required value={newGrade.remark} onChange={e => setNewGrade({ ...newGrade, remark: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200"><button type="button" onClick={() => setShowAddGradeModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button><button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs">Save Cutoff</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grade Scale Modal */}
      {showEditGradeModal && editingGrade && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Edit Grade Scale</h3>
            <form onSubmit={handleUpdateGrade} className="space-y-3 text-xs">
              <div><label className="font-bold text-slate-700 block mb-1">Grade Scale Name</label><input type="text" required value={editGradeForm.name} onChange={e => setEditGradeForm({ ...editGradeForm, name: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="font-bold text-slate-700 block mb-1">Grade Letter</label><input type="text" required maxLength={2} value={editGradeForm.grade} onChange={e => setEditGradeForm({ ...editGradeForm, grade: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-bold" /></div><div><label className="font-bold text-slate-700 block mb-1">GPA Points</label><input type="number" step="0.1" min="0" required value={editGradeForm.gpa_point} onChange={e => setEditGradeForm({ ...editGradeForm, gpa_point: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="font-bold text-slate-700 block mb-1">Min %</label><input type="number" min={0} max={100} required value={editGradeForm.min_percent} onChange={e => setEditGradeForm({ ...editGradeForm, min_percent: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div><div><label className="font-bold text-slate-700 block mb-1">Max %</label><input type="number" min={0} max={100} required value={editGradeForm.max_percent} onChange={e => setEditGradeForm({ ...editGradeForm, max_percent: Number(e.target.value) })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div></div>
              <div><label className="font-bold text-slate-700 block mb-1">Official Remarks</label><input type="text" required value={editGradeForm.remark} onChange={e => setEditGradeForm({ ...editGradeForm, remark: e.target.value })} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200"><button type="button" onClick={() => { setShowEditGradeModal(false); setEditingGrade(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button><button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"><Save className="w-3.5 h-3.5 inline mr-1" />Update Scale</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Empty Database Reset Confirmation Modal */}
      {showResetEmptyModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-950">
                  Confirm Empty Database Reset
                </h3>
                <span className="text-xs text-rose-700 font-bold">
                  Irreversible System Action (Super-Admin)
                </span>
              </div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl text-xs text-rose-950 space-y-2 border border-rose-200">
              <p className="font-bold">
                You are about to wipe all data from the database.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-rose-900">
                <li>All registered schools, sessions, terms, and classes will be deleted.</li>
                <li>All enrolled students and candidate records will be removed.</li>
                <li>All question banks, master exams, and rubrics will be purged.</li>
                <li>All intake answer scripts, PDF scans, and evaluations will be erased.</li>
                <li>All exam results, rankings, and issued report cards will be wiped.</li>
              </ul>
              <p className="text-[11px] text-rose-800 pt-1">
                Your Super-Admin account will be preserved to allow you to log in and set up fresh academic structures.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Type <span className="font-mono text-rose-600 font-black">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type RESET"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-bold uppercase tracking-wider"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowResetEmptyModal(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== 'RESET'}
                onClick={async () => {
                  const res = await store.resetToEmptyDatabase();
                  alert(res.message);
                  setShowResetEmptyModal(false);
                  setConfirmText('');
                  onRefresh();
                }}
                className={`flex items-center gap-1.5 px-4 py-2 font-bold rounded-xl text-xs transition-all ${
                  confirmText.trim().toUpperCase() === 'RESET'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Reset to Empty Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE USER MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold"><Plus className="w-4 h-4" /></div>
                <div><h3 className="font-bold text-base text-slate-900">Create System User</h3><p className="text-[11px] text-slate-500">Create a real authenticated EARPMS account.</p></div>
              </div>
              <button type="button" onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div><label className="font-bold text-slate-700 block mb-1">Full Name</label><input required value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name:e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900" /></div>
              <div><label className="font-bold text-slate-700 block mb-1">Email</label><input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email:e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900" /></div>
              <div><label className="font-bold text-slate-700 block mb-1">Username</label><input value={newUser.username} onChange={e => setNewUser({...newUser, username:e.target.value})} placeholder="Leave blank to use email prefix" className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono" /></div>
              <div><label className="font-bold text-slate-700 block mb-1">Role</label><select value={newUser.role} onChange={e => setNewUser({...newUser, role:e.target.value as User['role']})} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"><option value="teacher">Teacher</option><option value="principal">Principal</option><option value="director">Director</option><option value="super-admin">Super Admin</option></select></div>
              {newUser.role === 'principal' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned School <span className="font-normal text-slate-400">(Optional during onboarding)</span></label>
                  <select value={newUser.school_id} onChange={e => setNewUser({...newUser, school_id:e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900">
                    <option value="">No school yet — assign after school creation</option>
                    {schools.map(sc => <option key={sc.id} value={sc.id}>{sc.name} ({sc.lga})</option>)}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">Create the Principal account now. After registering the school, use <strong>Assign Principal</strong> to link the account.</p>
                </div>
              )}
              {newUser.role === 'teacher' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned School</label>
                  <select required value={newUser.school_id} onChange={e => setNewUser({...newUser, school_id:e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900">
                    <option value="">Select school...</option>
                    {schools.map(sc => <option key={sc.id} value={sc.id}>{sc.name} ({sc.lga})</option>)}
                  </select>
                  {!schools.length && <p className="mt-1 text-[10px] text-rose-600">Create a school before creating a Teacher account.</p>}
                </div>
              )}
              <div><label className="font-bold text-slate-700 block mb-1">Initial Password</label><input type="password" minLength={8} value={newUser.password} onChange={e => setNewUser({...newUser, password:e.target.value})} placeholder="Leave blank to generate one" className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200"><button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl">Cancel</button><button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl">Create User</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Edit User</h3>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFeedback && (
              <div className={`p-2 rounded-lg text-xs font-bold ${editFeedback.includes('success') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {editFeedback}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                >
                  <option value="super-admin">Super Admin</option>
                  <option value="director">Director</option>
                  <option value="principal">Principal</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              {(editForm.role === 'principal' || editForm.role === 'teacher') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned School {editForm.role === 'principal' && <span className="font-normal text-slate-400">(Optional during onboarding)</span>}</label>
                  <select
                    value={editForm.school_id}
                    onChange={e => setEditForm({ ...editForm, school_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {editForm.role === 'principal' && <option value="">No school yet — pending assignment</option>}
                    {schools.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.lga})</option>
                    ))}
                  </select>
                  {editForm.role === 'principal' && <p className="mt-1 text-[10px] text-slate-500">Save the user first if the school does not exist yet, then assign the Principal from Academic Setup.</p>}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
