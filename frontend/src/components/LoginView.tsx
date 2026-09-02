
import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck, Eye, EyeOff, LogIn } from 'lucide-react';
import { store } from '../lib/store';

export const LoginView: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (user: string, pass: string) => {
    setBusy(true); setError('');
    const result = await store.login(user, pass);
    setBusy(false);
    if (result.success) onAuthenticated(); else setError(result.message);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(username, password);
  };

  // Quick login helper
  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    // Auto-submit after a tiny delay to let state update
    setTimeout(() => {
      signIn(user, pass);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-lg"><ShieldCheck /></div>
            <div><h1 className="font-black text-xl text-slate-900">EARPMS</h1><p className="text-xs text-slate-500">Edo State Ministry of Education Secure Sign In</p></div>
          </div>

          {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

          <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1">Username or email</label>
          <input id="username" autoFocus autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-emerald-500" required />

          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative mb-6">
            <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
            <input id="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 pl-10 pr-11 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" required />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
            </button>
          </div>

          {/* Quick Access Logins */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2">Quick Access Logins (Demo):</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => quickLogin('subeb_chairman', 'ChangeMe!2026')} className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-800 border border-orange-300 rounded-lg font-bold transition-colors">Super Admin</button>
              <button type="button" onClick={() => quickLogin('director_exams', 'ChangeMe!2026')} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 border border-amber-300 rounded-lg font-bold transition-colors">Director</button>
              <button type="button" onClick={() => quickLogin('principal_emotan', 'ChangeMe!2026')} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 border border-emerald-300 rounded-lg font-bold transition-colors">Principal</button>
              <button type="button" onClick={() => quickLogin('teacher_egharevba', 'ChangeMe!2026')} className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-800 border border-teal-300 rounded-lg font-bold transition-colors">Teacher</button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Demo password: <span className="font-mono font-bold">ChangeMe!2026</span></p>
          </div>

          <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4"/>{busy ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>

        <p className="text-center text-[10px] text-emerald-100/70 mt-4">© Edo State Ministry of Education — EARPMS</p>
      </div>
    </div>
  );
};
