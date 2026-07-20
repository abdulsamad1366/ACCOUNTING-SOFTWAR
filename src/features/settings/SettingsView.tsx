import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Download, Upload, RefreshCw, Save, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { company, updateCompany, exportDataJSON, importDataJSON, resetToDemoData } = useApp();
  const [formData, setFormData] = useState({ ...company });

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = await importDataJSON(content);
        if (success) {
          alert('Database restored successfully from backup file!');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Settings className="w-6 h-6 text-blue-600 mr-2" />
            Company Settings & Data Backup
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Customize your business details, invoice printing terms, and manage local data backups</p>
        </div>
      </div>

      {/* 1-Click Backup & Restore Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h2 className="text-base font-bold">Offline Data Security & Backup</h2>
        </div>
        <p className="text-xs text-slate-300">
          All your accounting records are stored 100% locally on your computer. Create regular backup copies to keep your business records safe.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportDataJSON}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Database Backup (.json)</span>
          </button>

          <label className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-700 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Restore From File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('Reset to initial sample demo data? Your current data will be overwritten.')) {
                resetToDemoData();
              }
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 px-3.5 py-2.5 rounded-xl font-medium text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Company Profile Form */}
      <form onSubmit={handleSaveCompany} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
          Company Profile & Tax Registration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN *</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Office Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>

        <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3 pt-4">
          Bank & UPI QR Payment Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
            <input
              type="text"
              value={formData.accountNo}
              onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
            <input
              type="text"
              value={formData.ifsc}
              onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID for Customer Payment</label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
