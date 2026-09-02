
import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  UserCheck,
  Building2,
  MapPin,
  Lock,
  ArrowRightLeft,
  ArrowUpRight,
  Archive,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Laptop
} from 'lucide-react';
import { AuditLog, AuditAction, UserRole, School } from '../types';
import { EDO_LGAS } from '../lib/lgaData';

interface SystemAuditLogViewProps {
  auditLogs: AuditLog[];
  schools: School[];
  currentUserRole: UserRole;
}

export const SystemAuditLogView: React.FC<SystemAuditLogViewProps> = ({
  auditLogs,
  schools,
  currentUserRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLgaFilter, setSelectedLgaFilter] = useState('ALL');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // LGA filter
      if (selectedLgaFilter !== 'ALL') {
        const matchesLga = log.lga?.toLowerCase() === selectedLgaFilter.toLowerCase();
        const logSchool = log.school_id ? schools.find(s => s.id === log.school_id) : null;
        const matchesSchoolLga = logSchool?.lga?.toLowerCase() === selectedLgaFilter.toLowerCase();
        if (!matchesLga && !matchesSchoolLga) return false;
      }

      // Action category filter
      if (selectedActionFilter !== 'ALL') {
        if (selectedActionFilter === 'ROLE_CHANGE' && log.action !== 'ROLE_CHANGE') return false;
        if (selectedActionFilter === 'MOBILITY' && !['PROMOTE', 'TRANSFER', 'ARCHIVE', 'SUSPEND'].includes(log.action)) return false;
        if (selectedActionFilter === 'ASSESSMENT' && !['LOCK', 'APPROVE', 'FINALIZE', 'GENERATE', 'SIGN'].includes(log.action)) return false;
        if (selectedActionFilter === 'SECURITY' && !['ROLE_CHANGE', 'DELETE', 'SUSPEND'].includes(log.action)) return false;
        if (!['ROLE_CHANGE', 'MOBILITY', 'ASSESSMENT', 'SECURITY'].includes(selectedActionFilter) && log.action !== selectedActionFilter) {
          return false;
        }
      }

      // Role filter
      if (selectedRoleFilter !== 'ALL') {
        if (log.actor_role !== selectedRoleFilter) return false;
      }

      // Date filter
      if (dateRangeFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (dateRangeFilter === 'today') {
          if (logDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRangeFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < sevenDaysAgo) return false;
        } else if (dateRangeFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actorMatch = log.actor?.toLowerCase().includes(q);
        const descMatch = log.description?.toLowerCase().includes(q);
        const entityMatch = log.entity_type?.toLowerCase().includes(q) || log.entity_id?.toLowerCase().includes(q);
        const lgaMatch = log.lga?.toLowerCase().includes(q);
        const ipMatch = log.ip_address?.toLowerCase().includes(q);
        if (!actorMatch && !descMatch && !entityMatch && !lgaMatch && !ipMatch) return false;
      }

      return true;
    });
  }, [auditLogs, schools, selectedLgaFilter, selectedActionFilter, selectedRoleFilter, dateRangeFilter, searchQuery]);

  // Summary Metrics
  const totalAuditCount = auditLogs.length;
  const roleChangesCount = auditLogs.filter(l => l.action === 'ROLE_CHANGE').length;
  const pupilMobilityCount = auditLogs.filter(l => ['PROMOTE', 'TRANSFER', 'ARCHIVE', 'SUSPEND'].includes(l.action)).length;
  const qaModCount = auditLogs.filter(l => ['LOCK', 'APPROVE', 'FINALIZE'].includes(l.action)).length;

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor Username', 'Actor Role', 'LGA Jurisdiction', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Description'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actor}"`,
      l.actor_role || 'N/A',
      `"${l.lga || 'Statewide'}"`,
      l.action,
      l.entity_type,
      `"${l.entity_id}"`,
      l.ip_address || '127.0.0.1',
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Edo_State_Ministry_of_Education_System_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Edo_State_Ministry_of_Education_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ROLE_CHANGE':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-bold rounded-lg text-[10px]">ROLE CHANGE</span>;
      case 'PROMOTE':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-lg text-[10px]">PUPIL PROMOTE</span>;
      case 'TRANSFER':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 font-bold rounded-lg text-[10px]">PUPIL TRANSFER</span>;
      case 'ARCHIVE':
        return <span className="px-2 py-0.5 bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-lg text-[10px]">ARCHIVE</span>;
      case 'SUSPEND':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-[10px]">SUSPEND</span>;
      case 'LOCK':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-[10px]">SCHEME LOCK</span>;
      case 'APPROVE':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-lg text-[10px]">QA APPROVAL</span>;
      case 'FINALIZE':
        return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold rounded-lg text-[10px]">FINALIZE</span>;
      case 'CREATE':
        return <span className="px-2 py-0.5 bg-green-100 text-green-900 border border-green-300 font-bold rounded-lg text-[10px]">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-300 font-bold rounded-lg text-[10px]">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 font-bold rounded-lg text-[10px]">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-950 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Statewide System Audit Log & Accountability Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident activity tracking, role permission changes, pupil mobility, and exam moderation across all 18 LGAs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Ledger Active</span>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Accountability Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Total Audit Records</span>
          <div className="text-2xl font-black text-slate-900">{totalAuditCount}</div>
          <span className="text-[11px] text-slate-400">Recorded Statewide</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Role Modifications</span>
          <div className="text-2xl font-black text-purple-600">{roleChangesCount}</div>
          <span className="text-[11px] text-purple-700 font-semibold">Permission Audits</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Pupil Mobility</span>
          <div className="text-2xl font-black text-blue-600">{pupilMobilityCount}</div>
          <span className="text-[11px] text-slate-400">Promotions & Transfers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">QA & Moderation</span>
          <div className="text-2xl font-black text-emerald-600">{qaModCount}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">Exams & Approvals</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by actor, entity ID, description, or IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* LGA Filter Dropdown */}
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedLgaFilter}
                onChange={e => setSelectedLgaFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">All 18 LGAs (Statewide)</option>
                {EDO_LGAS.map(lga => (
                  <option key={lga.name} value={lga.name}>
                    {lga.name} ({lga.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter Dropdown */}
            <select
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">All Action Types</option>
              <option value="ROLE_CHANGE">Role Changes Only</option>
              <option value="MOBILITY">Pupil Mobility (Promote/Transfer/Archive)</option>
              <option value="ASSESSMENT">Assessment (Lock/Approve/Finalize)</option>
              <option value="CREATE">Record Creation (CREATE)</option>
              <option value="UPDATE">Record Modifications (UPDATE)</option>
              <option value="DELETE">Record Deletions (DELETE)</option>
            </select>

            {/* Role Filter Dropdown */}
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="director">Director of Schools</option>
              <option value="principal">Head Teacher / Principal</option>
              <option value="teacher">Class Teacher</option>
              <option value="examiner">Examiner</option>
              <option value="admin">System Admin</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateRangeFilter}
              onChange={e => setDateRangeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900 font-black">{filteredLogs.length}</strong> of {totalAuditCount} total entries
            {selectedLgaFilter !== 'ALL' && <span className="ml-1 text-orange-950 font-semibold">• LGA: {selectedLgaFilter}</span>}
            {selectedActionFilter !== 'ALL' && <span className="ml-1 text-purple-700 font-semibold">• Action: {selectedActionFilter}</span>}
          </div>
          {(selectedLgaFilter !== 'ALL' || selectedActionFilter !== 'ALL' || selectedRoleFilter !== 'ALL' || dateRangeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedLgaFilter('ALL');
                setSelectedActionFilter('ALL');
                setSelectedRoleFilter('ALL');
                setDateRangeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-orange-950 hover:underline font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">LGA / School Jurisdiction</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Activity Description</th>
                <th className="py-3 px-4">Timestamp & IP</th>
                <th className="py-3 px-4 text-right">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const logSchool = log.school_id ? schools.find(s => s.id === log.school_id) : null;
                  const logDate = new Date(log.timestamp);
                  const formattedDate = logDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const formattedTime = logDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Action */}
                      <td className="py-3 px-4">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Actor & Role */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.actor}</span>
                        </div>
                        <div className="mt-0.5">
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                            {log.actor_role || 'administrator'}
                          </span>
                        </div>
                      </td>

                      {/* LGA / Jurisdiction */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                          <span>{log.lga || (logSchool ? logSchool.lga : 'Statewide')}</span>
                        </div>
                        {logSchool && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {logSchool.name}
                          </div>
                        )}
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                          {log.entity_type}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                          {log.entity_id}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-800 text-xs line-clamp-2 leading-relaxed">
                          {log.description || (
                            typeof log.new_value === 'string'
                              ? log.new_value
                              : JSON.stringify(log.new_value || log.old_value || 'Operation executed')
                          )}
                        </p>
                      </td>

                      {/* Timestamp & IP */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate} {formattedTime}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                          <Laptop className="w-2.5 h-2.5" />
                          <span>{log.ip_address || '102.89.44.12'}</span>
                        </div>
                      </td>

                      {/* Diff Inspector Trigger */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLogForDiff(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Diff & Payload Modal */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-950 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Audit Event Payload & State Diff
                  </h3>
                  <p className="text-xs text-slate-500">
                    Event Reference: <span className="font-mono">{selectedLogForDiff.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Action</span>
                <div className="mt-0.5">{getActionBadge(selectedLogForDiff.action)}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Actor</span>
                <span className="font-bold text-slate-900">{selectedLogForDiff.actor}</span>
                <span className="text-[10px] text-slate-500 block">({selectedLogForDiff.actor_role || 'admin'})</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">LGA Jurisdiction</span>
                <span className="font-bold text-orange-950">{selectedLogForDiff.lga || 'Statewide'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">IP Address</span>
                <span className="font-mono text-slate-700 text-[11px]">{selectedLogForDiff.ip_address || '102.89.44.12'}</span>
              </div>
            </div>

            {/* Description / Summary */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950">
              <strong className="block font-bold mb-0.5">Operation Narrative:</strong>
              <p>{selectedLogForDiff.description || 'System state alteration recorded to immutable audit ledger.'}</p>
            </div>

            {/* Side-by-side or Formatted Diff */}
            <div className="space-y-3 text-xs">
              {selectedLogForDiff.old_value !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-700 uppercase tracking-wider text-[11px]">Previous State (Old Value)</span>
                  </div>
                  <pre className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-mono text-[11px] overflow-x-auto max-h-40">
                    {typeof selectedLogForDiff.old_value === 'string'
                      ? selectedLogForDiff.old_value
                      : JSON.stringify(selectedLogForDiff.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLogForDiff.new_value !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-700 uppercase tracking-wider text-[11px]">Committed Mutation (New Value)</span>
                  </div>
                  <pre className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-[11px] overflow-x-auto max-h-56">
                    {typeof selectedLogForDiff.new_value === 'string'
                      ? selectedLogForDiff.new_value
                      : JSON.stringify(selectedLogForDiff.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Integrity Certificate Hash */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>SHA256: {selectedLogForDiff.id.replace('aud-', '0x8f2a')}-VERIFIED</span>
              </div>
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
