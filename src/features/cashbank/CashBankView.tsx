import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VoucherType } from '../../types';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, X, Trash2 } from 'lucide-react';

export const CashBankView: React.FC = () => {
  const { vouchers, addVoucher, deleteVoucher, parties } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'PAYMENT_IN' as VoucherType,
    partyId: '',
    category: 'Customer Payment',
    amount: 0,
    paymentMode: 'CASH' as 'CASH' | 'HDFC_BANK' | 'ICICI_BANK' | 'UPI',
    referenceNo: '',
    notes: '',
  });

  const cashVouchers = vouchers.filter((v) => v.paymentMode === 'CASH');
  const cashTotal = cashVouchers.reduce(
    (sum, v) => (v.type === 'PAYMENT_IN' ? sum + v.amount : sum - v.amount),
    45400
  );

  const bankVouchers = vouchers.filter((v) => v.paymentMode !== 'CASH');
  const bankTotal = bankVouchers.reduce(
    (sum, v) => (v.type === 'PAYMENT_IN' ? sum + v.amount : sum - v.amount),
    170000
  );

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;
    const selectedParty = parties.find((p) => p.id === formData.partyId);

    addVoucher({
      type: formData.type,
      date: getTodayDateString(),
      partyId: formData.partyId || undefined,
      partyName: selectedParty ? selectedParty.name : undefined,
      category: formData.category,
      amount: Number(formData.amount),
      paymentMode: formData.paymentMode,
      referenceNo: formData.referenceNo,
      notes: formData.notes,
    });

    setIsModalOpen(false);
    setFormData({
      type: 'PAYMENT_IN',
      partyId: '',
      category: 'Customer Payment',
      amount: 0,
      paymentMode: 'CASH',
      referenceNo: '',
      notes: '',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Wallet className="w-6 h-6 text-indigo-600 mr-2" />
            Cash & Bank Book
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Track cash-in-hand, bank balances, and record business expenses</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Payment / Expense</span>
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Available Cash & Bank</span>
          <h2 className="text-2xl font-black text-slate-900 font-mono mt-2">{formatCurrency(cashTotal + bankTotal)}</h2>
        </div>
        <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl shadow-2xs">
          <span className="text-xs font-bold uppercase text-emerald-800">Cash In Hand</span>
          <h2 className="text-2xl font-black text-emerald-700 font-mono mt-2">{formatCurrency(cashTotal)}</h2>
        </div>
        <div className="bg-indigo-50/80 border border-indigo-200 p-5 rounded-2xl shadow-2xs">
          <span className="text-xs font-bold uppercase text-indigo-800">Bank Accounts Balance</span>
          <h2 className="text-2xl font-black text-indigo-700 font-mono mt-2">{formatCurrency(bankTotal)}</h2>
        </div>
      </div>

      {/* Recent Vouchers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Payment & Expense Log History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category / Party</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const isIn = v.type === 'PAYMENT_IN';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{v.voucherNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(v.date)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {v.partyName ? `${v.partyName} (${v.category})` : v.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono">{v.paymentMode}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isIn ? 'text-emerald-700' : 'text-rose-700'}>
                          {isIn ? '+' : '-'} {formatCurrency(v.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteVoucher(v.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Payment / Expense Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VoucherType })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="PAYMENT_IN">Payment Received (+) (Got Money)</option>
                  <option value="PAYMENT_OUT">Payment Given (-) (Paid Supplier)</option>
                  <option value="EXPENSE">Expense Entry (-) (Rent, Snacks, Utility)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Party (Optional)</label>
                <select
                  value={formData.partyId}
                  onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">-- No Specific Party (General Expense) --</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="HDFC_BANK">HDFC Bank</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Customer Payment, Shop Rent, Tea"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
