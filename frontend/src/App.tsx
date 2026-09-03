/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { store, AppStoreState } from './lib/store';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExaminationsView } from './components/ExaminationsView';
import { AssessmentView } from './components/AssessmentView';
import { ResultsView } from './components/ResultsView';
import { ReportCardsView } from './components/ReportCardsView';
import { AcademicSetupView } from './components/AcademicSetupView';
import { AdminView } from './components/AdminView';
import { ContentManagementView } from './components/ContentManagementView';
import { DailyRollCallView } from './components/DailyRollCallView';
import { VerifyModal } from './components/VerifyModal';
import { StudentCbtPortalModal } from './components/StudentCbtPortalModal';
import { User } from './types';
import { LoginView } from './components/LoginView';

export default function App() {
  const [storeState, setStoreState] = useState<AppStoreState>(store.getState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showStudentCbtModal, setShowStudentCbtModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | undefined>(undefined);
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(store.isAuthenticated());

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (store.isAuthenticated()) {
        const ok = await store.hydrate();
        if (mounted) setAuthenticated(ok);
      }
      if (mounted) setAuthReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setStoreState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setStoreState({ ...store.getState() });
  };

  const handleSwitchUser = (user: User) => {
    // Non-demo fallback only. In demo mode Navbar performs a server-issued JWT switch.
    store.setCurrentUser(user);
  };

  const handleNavigate = (tab: string, extra?: any) => {
    setCurrentTab(tab);
    if (extra?.studentId) {
      setSelectedStudentForReport(extra.studentId);
    }
    if (tab === 'cbt-portal') {
      setShowStudentCbtModal(true);
    }
  };

  const handleGenerateReportCard = (studentId: string, sessionId: string, termId: string) => {
    store.generateReportCard(studentId, sessionId, termId);
    setSelectedStudentForReport(studentId);
    setCurrentTab('report-cards');
  };

  if (!authReady) return <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-white">Loading EARPMS…</div>;
  if (!authenticated) return <LoginView onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={storeState.currentUser}
        users={storeState.users}
        schools={storeState.schools}
        systemConfig={storeState.systemConfig}
        onSwitchUser={handleSwitchUser}
        onOpenVerifyModal={() => setShowVerifyModal(true)}
        onOpenStudentCbtModal={() => setShowStudentCbtModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            storeState={storeState}
            onNavigate={handleNavigate}
            onOpenVerifyModal={() => setShowVerifyModal(true)}
            onOpenStudentCbtModal={() => setShowStudentCbtModal(true)}
          />
        )}

        {currentTab === 'examinations' && (
          <ExaminationsView
            storeState={storeState}
            onRefresh={handleRefresh}
            onOpenStudentCbtModal={() => setShowStudentCbtModal(true)}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'assessment' && (
          <AssessmentView
            storeState={storeState}
            onRefresh={handleRefresh}
          />
        )}

        {currentTab === 'results' && (
          <ResultsView
            storeState={storeState}
            onRefresh={handleRefresh}
            onGenerateReportCard={handleGenerateReportCard}
          />
        )}

        {currentTab === 'report-cards' && (
          <ReportCardsView
            storeState={storeState}
            onRefresh={handleRefresh}
            onOpenVerifyModal={() => setShowVerifyModal(true)}
            initialStudentId={selectedStudentForReport}
          />
        )}

        {(currentTab === 'daily-rollcall' || currentTab === 'rollcall') && (
          <DailyRollCallView
            currentUser={storeState.currentUser}
          />
        )}

        {currentTab === 'academic-setup' && (
          <AcademicSetupView
            storeState={storeState}
            onRefresh={handleRefresh}
          />
        )}

        {currentTab === 'content-mgmt' && (
          <ContentManagementView
            storeState={storeState}
            onRefresh={handleRefresh}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView
            storeState={storeState}
            onRefresh={handleRefresh}
              />
        )}
      </main>

      {/* Public Digital Certificate / Report Card Verification Modal */}
      <VerifyModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />

      {/* Integrated Student CBT & Offline Exam Portal Modal */}
      {showStudentCbtModal && (
        <StudentCbtPortalModal
          storeState={storeState}
          onClose={() => setShowStudentCbtModal(false)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">{storeState.systemConfig?.board_name || 'Edo State Ministry of Education'}</span>
            <span>•</span>
            <span>{storeState.systemConfig?.system_title || 'Electronic Academic Records, Paper & Marking System (EARPMS)'}</span>
          </div>
          <div className="text-slate-400">
            {storeState.systemConfig?.footer_note || 'Powered by Secure QR Provenance & Gemini 3.7 Flash AI Theory Marking'}
          </div>
        </div>
      </footer>
    </div>
  );
}