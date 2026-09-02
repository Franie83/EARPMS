
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Search, Award, Building2, QrCode } from 'lucide-react';
import { store, AppStoreState } from '../lib/store';
import { ReportCard } from '../types';

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  isOpen,
  onClose,
  initialCode = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [searched, setSearched] = useState(false);
  const [matchedCard, setMatchedCard] = useState<ReportCard | null>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    const state = store.getState();
    const found = state.reportCards.find(rc =>
      rc.verification_code.toUpperCase() === clean ||
      rc.id.toUpperCase() === clean
    );

    setMatchedCard(found || null);
    setSearched(true);
  };

  const student = matchedCard ? store.getState().students.find(s => s.id === matchedCard.student_id) : null;
  const school = student ? store.getState().schools.find(sc => sc.id === student.school_id) : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Edo State Ministry of Education Digital Certificate & Report Verification
              </h3>
              <p className="text-[11px] text-slate-500">Official Authenticity Verification Portal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-3 mb-6">
          <div>
            <label className="font-bold text-slate-700 text-xs block mb-1">
              Enter Verification Code or QR Payload
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. EDS-RC-2026-ORD-004-98A"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 uppercase focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify</span>
              </button>
            </div>
          </div>
        </form>

        {searched && (
          <div className="mt-4">
            {matchedCard && student ? (
              <div className="p-5 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>OFFICIAL EDO STATE MINISTRY OF EDUCATION CERTIFIED RECORD FOUND</span>
                </div>

                <div className="space-y-1 text-xs border-t border-emerald-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Pupil Name:</span>
                    <strong className="text-emerald-950 font-bold">{student.full_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Admission No:</span>
                    <strong className="font-mono text-emerald-950">{student.admission_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">School:</span>
                    <span className="font-medium text-emerald-900">{school?.name} ({school?.lga} LGA)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Overall Average:</span>
                    <strong className="font-black text-emerald-950">{matchedCard.average_percent.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Class Position:</span>
                    <strong className="font-bold text-emerald-950">{matchedCard.position} in Class</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Issued On:</span>
                    <span className="text-emerald-900">{new Date(matchedCard.issued_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Digital Token:</span>
                    <span className="font-mono text-[10px] text-emerald-800">{matchedCard.verification_code}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-center space-y-2">
                <XCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="font-bold text-xs">Record Not Found or Invalid Code</h4>
                <p className="text-[11px] text-rose-700">
                  The verification code "{code}" does not match any authenticated report card in the official Edo State Ministry of Education database registry.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
