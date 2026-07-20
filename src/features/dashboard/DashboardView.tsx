import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  TrendingUp,
  Receipt,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Printer,
  MessageCircle,
} from 'lucide-react';
import { Party, Invoice } from '../../types';

interface DashboardViewProps {
  onOpenNewBill: () => void;
  onOpenNewParty: () => void;
  onOpenNewProduct: () => void;
  onOpenNewPayment: () => void;
  onViewInvoicePrint: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewBill,
  onOpenNewParty,
  onOpenNewProduct,
  onOpenNewPayment,
  onViewInvoicePrint,
}) => {
  const { parties, products, invoices, vouchers, company } = useApp();

  // Receivables (You Get) vs Payables (You Give)
  const totalReceivable = parties
    .filter((p) => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);

  const totalPayable = parties
    .filter((p) => p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter((i) => i.date === todayStr && i.type === 'SALES');
  const todaySalesAmount = todayInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  // Cash & Bank Balances
  const cashInVouchers = vouchers.filter((v) => v.paymentMode === 'CASH');
  const cashTotal = cashInVouchers.reduce(
    (sum, v) => (v.type === 'PAYMENT_IN' ? sum + v.amount : sum - v.amount),
    45400 // Initial cash seed base
  );

  const bankTotal = vouchers
    .filter((v) => v.paymentMode !== 'CASH')
    .reduce((sum, v) => (v.type === 'PAYMENT_IN' ? sum + v.amount : sum - v.amount), 170000);

  // Total Stock Value & Alerts
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockAlert);

  // Top Customers needing payment reminders
  const topPendingCustomers = parties
    .filter((p) => p.type === 'CUSTOMER' && p.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 4);

  // WhatsApp Reminder Generator
  const sendWhatsAppReminder = (party: Party) => {
    const phone = party.phone ? party.phone.replace(/\D/g, '') : '';
    const text = `Hello ${party.name}, gentle reminder from ${company.name}. Your pending balance is ${formatCurrency(
      party.balance
    )}. Kindly settle payment via UPI: ${company.upiId || company.phone}. Thank you!`;
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Welcome back! All data is saved offline on your computer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewBill}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Bill</span>
          </button>
          <button
            onClick={onOpenNewPayment}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={onOpenNewParty}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl font-medium text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Khatabook Style - High Contrast Red/Green) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receivables - You Get */}
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">You'll Get (Receivables)</span>
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {formatCurrency(totalReceivable)}
            </h2>
            <p className="text-xs text-emerald-800/80 mt-1 font-medium">
              From {parties.filter((p) => p.balance > 0).length} pending customers
            </p>
          </div>
        </div>

        {/* Payables - You Give */}
        <div className="bg-rose-500/10 border-2 border-rose-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 tracking-wider uppercase">You'll Give (Payables)</span>
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              {formatCurrency(totalPayable)}
            </h2>
            <p className="text-xs text-rose-800/80 mt-1 font-medium">
              To {parties.filter((p) => p.balance < 0).length} suppliers
            </p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Today's Sales</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(todaySalesAmount)}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">{todayInvoices.length} Bills generated today</p>
          </div>
        </div>

        {/* Cash & Bank Balance */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Cash & Bank Balance</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(cashTotal + bankTotal)}
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex justify-between font-mono">
              <span>Cash: {formatCurrency(cashTotal)}</span>
              <span>Bank: {formatCurrency(bankTotal)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Khatabook Top Customers & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khatabook Party Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" />
              Khata Ledger - Pending Receivables
            </h3>
            <span className="text-xs text-slate-400 font-medium">Top Balances</span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topPendingCustomers.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">All customer accounts settled!</p>
            ) : (
              topPendingCustomers.map((party) => (
                <div key={party.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-all">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{party.name}</h4>
                    <p className="text-xs text-slate-500">{party.phone} • {party.city || 'Local'}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-700 text-sm font-mono">
                      + {formatCurrency(party.balance)}
                    </span>
                    <button
                      onClick={() => sendWhatsAppReminder(party)}
                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                      title="Send WhatsApp Payment Reminder"
                    >
                      <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
                      <span className="hidden sm:inline">Remind</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              Low Stock Warnings ({lowStockItems.length})
            </h3>
            <button
              onClick={onOpenNewProduct}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              + Add Item
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {lowStockItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">All items are sufficiently stocked!</p>
            ) : (
              lowStockItems.map((prod) => (
                <div key={prod.id} className="py-3.5 flex items-center justify-between hover:bg-amber-50/50 px-2 rounded-lg transition-all">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{prod.name}</h4>
                    <p className="text-xs text-slate-500">Min Alert Level: {prod.minStockAlert} {prod.unit}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full font-mono">
                      Only {prod.currentStock} {prod.unit} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center">
            <Receipt className="w-5 h-5 text-blue-600 mr-2" />
            Recent Sales Invoices
          </h3>
          <span className="text-xs text-slate-400">Total {invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No bills generated yet. Click '+ Create Sales Bill' above!
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 6).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.date)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{inv.partyName}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onViewInvoicePrint(inv)}
                        className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-md transition-all inline-flex items-center space-x-1 font-semibold text-[11px]"
                        title="Print / View Invoice"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
