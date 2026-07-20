import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ShoppingCart,
  Package,
  Wallet,
  FileBarChart,
  Settings,
  Plus,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'parties' | 'invoices' | 'purchases' | 'inventory' | 'cashbank' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  companyName: string;
  gstin: string;
  onOpenQuickBill: () => void;
  onOpenQuickParty: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  companyName,
  gstin,
  onOpenQuickBill,
  onOpenQuickParty,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'parties', label: 'Parties (Khata)', icon: <Users className="w-5 h-5" /> },
    { id: 'invoices', label: 'Sales Bills', icon: <Receipt className="w-5 h-5" /> },
    { id: 'purchases', label: 'Purchase Bills', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'inventory', label: 'Stock Inventory', icon: <Package className="w-5 h-5" /> },
    { id: 'cashbank', label: 'Cash & Bank', icon: <Wallet className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports & P&L', icon: <FileBarChart className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings & Backup', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none no-print">
      {/* Company Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-semibold text-white truncate text-base leading-tight">{companyName}</h2>
            <p className="text-xs text-emerald-400 font-mono flex items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span>
              {gstin ? `GST: ${gstin}` : 'Offline Local App'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800/80">
        <button
          onClick={onOpenQuickBill}
          className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Bill</span>
        </button>
        <button
          onClick={onOpenQuickParty}
          className="flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Party</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Offline Desktop Status Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
            Local Desktop
          </span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">Offline</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Data saved securely on PC</p>
      </div>
    </aside>
  );
};
