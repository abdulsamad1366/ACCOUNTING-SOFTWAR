import React from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer, ArrowLeft, Building2 } from 'lucide-react';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onBack: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onBack }) => {
  const { company, parties } = useApp();

  const party = parties.find((p) => p.id === invoice.partyId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Action Toolbar (Hidden on Print) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs no-print">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Download PDF (Ctrl+P)</span>
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div
        id="printable-invoice"
        className="bg-white p-8 rounded-xl border border-slate-300 shadow-lg text-slate-900 font-sans space-y-6"
      >
        {/* Header Title */}
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <h1 className="text-xl font-black tracking-widest text-slate-900 uppercase">TAX INVOICE</h1>
        </div>

        {/* Company Header Info & Invoice Metadata */}
        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-300">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{company.name}</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">{company.address}, {company.city}, {company.state} - {company.pincode}</p>
            <p className="text-xs text-slate-600">Phone: {company.phone} | Email: {company.email}</p>
            <p className="text-xs font-mono font-bold text-slate-800 mt-1">GSTIN: {company.gstin}</p>
          </div>

          <div className="text-right space-y-1 text-xs">
            <p className="font-bold text-sm text-slate-900">Bill No: <span className="font-mono">{invoice.invoiceNumber}</span></p>
            <p className="text-slate-600">Date: <span className="font-medium">{formatDate(invoice.date)}</span></p>
            <p className="text-slate-600">Due Date: <span className="font-medium">{formatDate(invoice.dueDate)}</span></p>
            <p className="text-slate-600">Status: <span className="font-bold uppercase text-blue-700">{invoice.status}</span></p>
          </div>
        </div>

        {/* Billed To Customer Details */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-1">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Billed To (Buyer):</span>
          <h3 className="font-bold text-slate-900 text-sm">{invoice.partyName}</h3>
          {party && <p className="text-slate-600">{party.address}, {party.city}, {party.state}</p>}
          <p className="text-slate-600">Phone: {invoice.partyPhone || party?.phone || 'N/A'}</p>
          {invoice.partyGstin && <p className="font-mono font-bold text-slate-800">GSTIN: {invoice.partyGstin}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <th className="py-2.5 px-3 border-r border-slate-300">#</th>
              <th className="py-2.5 px-3 border-r border-slate-300">Item Description</th>
              <th className="py-2.5 px-2 border-r border-slate-300 text-center">HSN</th>
              <th className="py-2.5 px-2 border-r border-slate-300 text-center">Qty</th>
              <th className="py-2.5 px-3 border-r border-slate-300 text-right">Rate</th>
              <th className="py-2.5 px-2 border-r border-slate-300 text-center">GST %</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {invoice.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-2.5 px-3 border-r border-slate-300 text-slate-500 font-mono">{idx + 1}</td>
                <td className="py-2.5 px-3 border-r border-slate-300 font-semibold">{item.productName}</td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-center font-mono">{item.hsnCode}</td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-center font-bold">{item.quantity} {item.unit}</td>
                <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono">{formatCurrency(item.price)}</td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-center font-mono">{item.gstRate}%</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation & Bank Info Summary */}
        <div className="grid grid-cols-2 gap-6 pt-2 text-xs">
          {/* Bank & Payment Details */}
          <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 space-y-1">
            <span className="font-bold text-slate-700 text-[11px]">Bank Details for Payment:</span>
            <p className="text-slate-600">Bank: <span className="font-medium text-slate-800">{company.bankName}</span></p>
            <p className="text-slate-600">A/c No: <span className="font-mono font-bold text-slate-800">{company.accountNo}</span></p>
            <p className="text-slate-600">IFSC Code: <span className="font-mono text-slate-800">{company.ifsc}</span></p>
            <p className="text-slate-600">UPI ID: <span className="font-mono text-blue-700 font-bold">{company.upiId}</span></p>
          </div>

          {/* Grand Totals */}
          <div className="space-y-1.5 text-right font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>CGST Total:</span>
              <span className="font-mono">{formatCurrency(invoice.cgstTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>SGST Total:</span>
              <span className="font-mono">{formatCurrency(invoice.sgstTotal)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-base font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-800">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Paid Amount:</span>
              <span className="font-mono text-emerald-700 font-bold">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Balance Due:</span>
              <span className="font-mono text-rose-600 font-bold">{formatCurrency(invoice.grandTotal - invoice.paidAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Terms & Signatures */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-300 text-[11px] text-slate-600">
          <div>
            <span className="font-bold text-slate-800 block mb-1">Terms & Conditions:</span>
            <p className="whitespace-pre-line">{company.terms}</p>
          </div>

          <div className="text-right flex flex-col justify-end items-end space-y-8">
            <p className="font-bold text-slate-800">For {company.name}</p>
            <div className="border-t border-slate-400 pt-1 w-48 text-center text-slate-500 font-medium">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
