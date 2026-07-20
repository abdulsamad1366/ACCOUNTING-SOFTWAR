import React from 'react';
import { Search, Download, Calendar, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExportBackup: () => void;
  toastMessage: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onExportBackup,
  toastMessage,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs no-print">
      {/* Search Input */}
      <div className="relative w-80 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search party, bill #, item..."
          className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="flex items-center space-x-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Date Display */}
        <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(todayStr)}</span>
        </div>

        {/* 1-Click Backup Export Button */}
        <button
          onClick={onExportBackup}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Download Local Database Backup JSON"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Backup Data</span>
        </button>
      </div>
    </header>
  );
};
