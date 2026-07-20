import React, { useState } from 'react';
import { Lock, User, KeyRound, Building2 } from 'lucide-react';
import { User as UserType } from '../../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (window.electronAPI?.login) {
        const res = await window.electronAPI.login({ username, password });
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(res.message || 'Invalid username or password');
        }
      } else {
        // Web fallback login (default password 'admin123' or 'admin')
        if (password === 'admin' || password === 'admin123' || password === '') {
          onLoginSuccess({
            id: 'usr-admin',
            username,
            fullName: 'System Administrator',
            role: 'ADMIN',
            status: 'ACTIVE',
          });
        } else {
          setErrorMsg('Invalid password (Demo password: admin123)');
        }
      }
    } catch {
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 border border-slate-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Vyapar Accounting ERP</h1>
          <p className="text-xs text-slate-500 font-medium">Offline Desktop ERP & Business Management</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default: admin123)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating...' : 'Unlock Accounting ERP'}</span>
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Default Admin Credentials: <strong>admin</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
};
