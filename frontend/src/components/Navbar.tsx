
import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  FileSpreadsheet,
  CheckCircle2,
  Award,
  Users,
  Settings,
  Sparkles,
  BookOpen,
  QrCode,
  Sliders,
  Megaphone,
  ClipboardCheck,
  Laptop,
  UserCheck,
  ChevronDown,
  Lock,
  Compass,
  HeartHandshake,
  LogOut
} from 'lucide-react';
import { User, School, SystemContentConfig, UserRole } from '../types';
import { store } from '../lib/store';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  schools: School[];
  systemConfig?: SystemContentConfig;
  onSwitchUser: (user: User) => void;
  onOpenVerifyModal: () => void;
  onOpenStudentCbtModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  users,
  schools,
  systemConfig,
  onSwitchUser,
  onOpenVerifyModal,
  onOpenStudentCbtModal
}) => {
  const [showRoleSwitcherModal, setShowRoleSwitcherModal] = useState(false);
  const currentSchool = schools.find(s => s.id === currentUser.school_id);

  const boardName = systemConfig?.board_name || 'Edo State Ministry of Education';
  const systemTitle = systemConfig?.system_title || 'Electronic Academic Records, Paper & Marking System (EARPMS)';
  const marqueeAnnouncement = systemConfig?.portal_announcement;
  const isMarqueeActive = systemConfig?.portal_announcement_active;
  const subebLogoUrl = systemConfig?.subeb_logo_url;
  const ministryLogoUrl = systemConfig?.ministry_logo_url;

  // Master List of Defined User Roles with Descriptions & Orange Aesthetic Touches (Strict 4 Roles)
  const roleDefinitions: {
    role: UserRole;
    label: string;
    description: string;
    badgeColor: string;
    icon: any;
  }[] = [
    {
      role: 'super-admin',
      label: 'Super Admin',
      description: 'Full CMS, system configuration, master catalog, sessions, classes & security control.',
      badgeColor: 'bg-orange-500 text-white border-orange-400',
      icon: ShieldCheck
    },
    {
      role: 'director',
      label: 'Director of Schools',
      description: 'Statewide academic audits, quality assurance, performance analytics & supervision across all 18 LGAs.',
      badgeColor: 'bg-amber-500 text-slate-950 border-amber-400',
      icon: Compass
    },
    {
      role: 'principal',
      label: 'Principal',
      description: 'Exam approvals, student transfers/promotions/suspensions, teacher sign-offs & school report cards.',
      badgeColor: 'bg-emerald-600 text-white border-emerald-400',
      icon: Building2
    },
    {
      role: 'teacher',
      label: 'Classroom Teacher',
      description: 'Daily roll call, question authoring, score entry, exam submission & continuous assessment.',
      badgeColor: 'bg-teal-600 text-white border-teal-400',
      icon: GraduationCap
    }
  ];

  // Helper to switch to first representative user of a role
  const handleQuickRoleSwitch = async (role: UserRole) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        const result = await store.demoSwitchRole(targetUser.id);
        if (!result.success) {
          console.error(result.message);
          return;
        }
      } else {
        onSwitchUser(targetUser);
      }
      if (!store.canAccessTab(currentTab, targetUser)) onSelectTab('dashboard');
    }
    setShowRoleSwitcherModal(false);
  };

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'rollcall', label: 'Daily Roll Call', icon: ClipboardCheck },
    { id: 'examinations', label: 'Exams & Questions', icon: BookOpen },
    { id: 'assessment', label: 'Answer Scripts & AI Marking', icon: CheckCircle2 },
    { id: 'results', label: 'Results & Rankings', icon: FileSpreadsheet },
    { id: 'report-cards', label: 'Report Cards', icon: Award },
    { id: 'academic-setup', label: 'Academic Setup', icon: Building2 },
    { id: 'content-mgmt', label: 'Content Management (CMS)', icon: Sliders },
    { id: 'admin', label: 'Administration', icon: Settings }
  ];

  // Filter navigation items by RBAC permissions for the active user
  const visibleNavItems = allNavItems.filter(item => store.canAccessTab(item.id, currentUser));

  return (
    <header className="bg-emerald-950 border-b border-emerald-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Banner with Official Board Identity, Opposite Logo Placements & Quick Role Switcher */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 px-4 py-2 border-b border-emerald-700/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Side: MINISTRY OF EDUCATION Primary Logo & Board Hierarchy */}
          <div className="flex items-center gap-2.5">
            {subebLogoUrl ? (
              <img
                src={subebLogoUrl}
                alt="Ministry of Education Logo"
                className="w-7 h-7 object-contain rounded bg-white p-0.5 shadow-xs border border-emerald-700/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-inner">
                ED
              </div>
            )}
            <div>
              <span className="font-bold text-emerald-200 uppercase tracking-wide text-xs sm:text-[13px]">
                {boardName}
              </span>
              <div className="text-emerald-400/80 text-[11px] hidden sm:block">
                {systemTitle}
              </div>
            </div>
          </div>

          {/* Right Side: Opposite Ministry/State Crest Logo, Quick Access Switcher & User Account */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
            {/* Ministry / State Crest Logo placed on the opposite side */}
            {ministryLogoUrl && (
              <div className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-emerald-900/60 rounded-lg border border-emerald-700/60">
                <img
                  src={ministryLogoUrl}
                  alt="Edo State Government Crest"
                  className="w-6 h-6 object-contain rounded bg-white p-0.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] uppercase font-bold text-emerald-300 hidden lg:inline tracking-wider">
                  Edo State Govt
                </span>
              </div>
            )}

            {import.meta.env.VITE_DEMO_MODE === 'true' && (
              <button
                onClick={() => setShowRoleSwitcherModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 font-bold transition-all shadow-xs cursor-pointer text-[11px]"
                title="Demo-only role switcher"
              >
                <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Demo Role Switcher</span>
              </button>
            )}

            {/* Quick Student CBT & Offline Exam Portal Launcher */}
            {onOpenStudentCbtModal && (
              <button
                onClick={onOpenStudentCbtModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 font-bold transition-all shadow-xs cursor-pointer text-[11px]"
                title="Access candidate online CBT / offline paper portal"
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-200" />
                <span>Student Exam Portal</span>
              </button>
            )}

            {/* Quick Public Verification launcher */}
            <button
              onClick={onOpenVerifyModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700/80 text-emerald-200 border border-emerald-600/40 transition-colors font-medium cursor-pointer text-[11px]"
              title="Verify authenticity of an issued report card"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Verify Card</span>
            </button>

            {/* Logged In User Dropdown */}
            <div className="flex items-center gap-1.5 bg-emerald-900/90 px-2.5 py-1 rounded-lg border border-emerald-700">
              <span className="text-emerald-300 hidden md:inline text-[11px]">User:</span>
              <select
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[220px] truncate"
                value={currentUser.id}
                onChange={async (e) => {
                  const u = users.find(x => x.id === e.target.value);
                  if (!u) return;
                  if (import.meta.env.VITE_DEMO_MODE === 'true') {
                    const result = await store.demoSwitchRole(u.id);
                    if (!result.success) {
                      console.error(result.message);
                      return;
                    }
                  } else {
                    onSwitchUser(u);
                  }
                  if (!store.canAccessTab(currentTab, u)) {
                    onSelectTab('dashboard');
                  }
                }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-950 text-white">
                    [{u.role.toUpperCase()}] {u.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* LOGOUT BUTTON */}
            <button
              onClick={() => {
                store.logout();
                window.location.reload(); // force re-render to show login
              }}
              className="p-1 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Role Badges Strip */}
      <div className="bg-emerald-900/60 border-b border-emerald-800/80 px-4 py-1.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-orange-400 whitespace-nowrap mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" />
            Quick Access Logins:
          </span>
          {roleDefinitions.map(def => {
            const isCurrent = currentUser.role === def.role;
            const Icon = def.icon;
            return (
              <button
                key={def.role}
                onClick={() => handleQuickRoleSwitch(def.role)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-orange-500 text-slate-950 border-orange-300 shadow-xs ring-2 ring-orange-400/40'
                    : 'bg-emerald-950/70 text-emerald-200 border-emerald-700/60 hover:bg-emerald-800 hover:text-white hover:border-emerald-500'
                }`}
                title={def.description}
              >
                <Icon className={`w-3 h-3 ${isCurrent ? 'text-slate-950' : 'text-orange-400'}`} />
                <span>{def.label.split(' ')[0]}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Marquee Broadcast Banner if Active */}
      {isMarqueeActive && marqueeAnnouncement && (
        <div className="bg-orange-500/15 border-b border-orange-500/30 text-orange-200 px-4 py-1 text-xs flex items-center justify-between gap-3">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-orange-300 uppercase tracking-wider text-[10px]">Official Notice:</span>
            <span className="line-clamp-1 text-orange-100 text-xs">{marqueeAnnouncement}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 via-amber-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20 border border-orange-300">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-white tracking-tight leading-none">
                EARPMS
              </h1>
              <span className="bg-orange-500/20 text-orange-300 text-[9px] font-bold px-2 py-0.5 rounded border border-orange-400/30">
                PROD v2.6 • {currentUser.role.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <span>Active Scope:</span>
              <strong className="text-emerald-100">
                {currentUser.role === 'super-admin' || currentUser.role === 'admin' || currentUser.role === 'director'
                  ? 'Statewide (All 18 LGAs / Ministry of Education HQ)'
                  : currentSchool
                  ? `${currentSchool.name} (${currentSchool.lga} LGA)`
                  : 'Assigned School'}
              </strong>
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Compact with overflow scroll if needed */}
        <nav className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/20 font-bold border border-orange-400'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-300'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* QUICK ROLE SWITCHER MODAL */}
      {showRoleSwitcherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-slate-950 font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Role-Based Access Control (RBAC) Switcher</h3>
                  <p className="text-xs text-slate-400">One-click instant login simulation for all system user roles</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleSwitcherModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {roleDefinitions.map(def => {
                const isCurrent = currentUser.role === def.role;
                const representative = users.find(u => u.role === def.role) || currentUser;
                const Icon = def.icon;
                return (
                  <button
                    key={def.role}
                    onClick={() => handleQuickRoleSwitch(def.role)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-orange-500/15 border-orange-400 shadow-md ring-2 ring-orange-400/30'
                        : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isCurrent ? 'text-orange-400' : 'text-emerald-400'}`} />
                          <span className="font-bold text-xs text-white">{def.label}</span>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-orange-500 text-slate-950 rounded-full text-[10px] font-black uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{def.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{representative.full_name.split('(')[0]}</span>
                      <span className="text-orange-400 font-semibold">Switch Role →</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center gap-2 text-xs text-emerald-200">
              <Lock className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span>
                Access controls dynamically restrict navigation tabs, editing permissions, and signing authorities according to statutory guidelines.
              </span>
            </div>
            <button onClick={() => { store.logout(); window.location.reload(); }} className="px-2.5 py-1 rounded-lg border border-emerald-700 bg-emerald-900 hover:bg-emerald-800 text-xs font-bold">Sign out</button>
          </div>
        </div>
      )}
    </header>
  );
};
