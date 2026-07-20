import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Party, PartyType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Phone,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  X,
  FileText,
} from 'lucide-react';

interface PartiesViewProps {
  onOpenNewBillForParty?: (party: Party) => void;
  onOpenNewPaymentForParty?: (party: Party) => void;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  onOpenNewBillForParty,
  onOpenNewPaymentForParty,
}) => {
  const { parties, addParty, invoices, vouchers, company } = useApp();
  const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(parties[0] || null);

  // New Party Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    type: 'CUSTOMER' as PartyType,
    openingBalance: 0,
    creditLimit: 50000,
  });

  const filteredParties = parties.filter((p) => {
    const matchesType = filterType === 'ALL' || p.type === filterType;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.companyName && p.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalReceivables = parties
    .filter((p) => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);

  const totalPayables = parties
    .filter((p) => p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    addParty({
      name: formData.name,
      companyName: formData.companyName || formData.name,
      phone: formData.phone,
      email: formData.email,
      gstin: formData.gstin,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      type: formData.type,
      creditLimit: Number(formData.creditLimit) || 50000,
      balance: Number(formData.openingBalance) || 0,
    });
    setIsModalOpen(false);
    setFormData({
      name: '',
      companyName: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      type: 'CUSTOMER',
      openingBalance: 0,
      creditLimit: 50000,
    });
  };

  // Compute Selected Party Ledger Entries (Invoices + Vouchers)
  const partyInvoices = selectedParty ? invoices.filter((i) => i.partyId === selectedParty.id) : [];
  const partyVouchers = selectedParty ? vouchers.filter((v) => v.partyId === selectedParty.id) : [];

  const ledgerEntries = [
    ...partyInvoices.map((inv) => ({
      id: inv.id,
      date: inv.date,
      type: inv.type === 'SALES' ? 'Sales Bill' : 'Purchase Bill',
      refNo: inv.invoiceNumber,
      amount: inv.grandTotal,
      isDebit: inv.type === 'SALES', // Sales = + (Debit), Purchase = - (Credit)
    })),
    ...partyVouchers.map((v) => ({
      id: v.id,
      date: v.date,
      type: v.type === 'PAYMENT_IN' ? 'Payment Received' : 'Payment Given',
      refNo: v.voucherNumber,
      amount: v.amount,
      isDebit: v.type !== 'PAYMENT_IN', // Payment Received = - (Credit/Reduces balance)
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const sendWhatsAppReminder = (party: Party) => {
    const text = `Hello ${party.name}, gentle reminder from ${company.name}. Your pending balance is ${formatCurrency(
      party.balance
    )}. Kindly settle payment via UPI: ${company.upiId || company.phone}. Thank you!`;
    const url = `https://wa.me/91${party.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Receivables Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            Party Directory & Khata Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer credit/debit balances and supplier accounts</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Total You'll Get</span>
            <p className="text-base font-black text-emerald-700 font-mono">{formatCurrency(totalReceivables)}</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Total You'll Give</span>
            <p className="text-base font-black text-rose-700 font-mono">{formatCurrency(totalPayables)}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Party</span>
          </button>
        </div>
      </div>

      {/* Main Two Column View: Left Party List, Right Ledger Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Party List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
          {/* Filters & Search */}
          <div className="space-y-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['ALL', 'CUSTOMER', 'SUPPLIER'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                    filterType === type ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'ALL' ? 'All Parties' : type.toLowerCase() + 's'}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search party by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Parties List */}
          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto pr-1">
            {filteredParties.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No parties found matching criteria.</p>
            ) : (
              filteredParties.map((party) => {
                const isSelected = selectedParty?.id === party.id;
                const isReceivable = party.balance > 0;
                const isPayable = party.balance < 0;

                return (
                  <div
                    key={party.id}
                    onClick={() => setSelectedParty(party)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600 shadow-2xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 text-sm">{party.name}</h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            party.type === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {party.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {party.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-mono font-bold text-sm ${
                          isReceivable
                            ? 'text-emerald-600'
                            : isPayable
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {party.balance === 0
                          ? 'Settled'
                          : `${isReceivable ? '+' : ''} ${formatCurrency(party.balance)}`}
                      </p>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isReceivable ? 'You Get' : isPayable ? 'You Give' : 'Clear'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Party Detail Ledger */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          {selectedParty ? (
            <div className="space-y-5">
              {/* Selected Party Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedParty.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center mt-0.5">
                    <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {selectedParty.companyName} • {selectedParty.phone}
                  </p>
                  {selectedParty.gstin && (
                    <span className="inline-block mt-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      GSTIN: {selectedParty.gstin}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {selectedParty.balance > 0 && (
                    <button
                      onClick={() => sendWhatsAppReminder(selectedParty)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Remind WhatsApp</span>
                    </button>
                  )}
                  {onOpenNewBillForParty && (
                    <button
                      onClick={() => onOpenNewBillForParty(selectedParty)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Sales Bill</span>
                    </button>
                  )}
                  {onOpenNewPaymentForParty && (
                    <button
                      onClick={() => onOpenNewPaymentForParty(selectedParty)}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+ Record Payment</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Net Balance Box */}
              <div
                className={`p-4 rounded-xl flex items-center justify-between ${
                  selectedParty.balance > 0
                    ? 'bg-emerald-50 border border-emerald-200'
                    : selectedParty.balance < 0
                    ? 'bg-rose-50 border border-rose-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Net Outstanding Balance
                  </span>
                  <h3
                    className={`text-2xl font-black font-mono mt-0.5 ${
                      selectedParty.balance > 0
                        ? 'text-emerald-700'
                        : selectedParty.balance < 0
                        ? 'text-rose-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {formatCurrency(selectedParty.balance)}
                  </h3>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Credit Limit: {formatCurrency(selectedParty.creditLimit)}</p>
                  <p className="mt-0.5">City: {selectedParty.city || 'Local'}</p>
                </div>
              </div>

              {/* Transaction History Ledger */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                  <FileText className="w-4 h-4 text-blue-600 mr-1.5" />
                  Transaction Ledger History
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Ref No</th>
                        <th className="py-2.5 px-3 text-right">Debit (+)</th>
                        <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No ledger entries for this party yet.
                          </td>
                        </tr>
                      ) : (
                        ledgerEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-medium text-slate-600">{formatDate(entry.date)}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{entry.type}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{entry.refNo}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {entry.isDebit ? formatCurrency(entry.amount) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                              {!entry.isDebit ? formatCurrency(entry.amount) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              Select a party from the left list to view ledger details.
            </div>
          )}
        </div>
      </div>

      {/* Add New Party Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Customer or Supplier</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Party Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PartyType })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="CUSTOMER">Customer (Receivable)</option>
                    <option value="SUPPLIER">Supplier (Payable)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="10 digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Shop Name</label>
                  <input
                    type="text"
                    placeholder="Ramesh Electricals"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Street, City, Pincode"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
