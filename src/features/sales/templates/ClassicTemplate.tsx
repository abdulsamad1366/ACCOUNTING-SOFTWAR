import React from 'react';
import { Company, Invoice, Party } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface TemplateProps {
  invoice: Invoice;
  company: Company;
  party?: Party;
  copyLabel?: string;
}

export const ClassicTemplate: React.FC<TemplateProps> = ({
  invoice,
  company,
  party,
  copyLabel = 'ORIGINAL FOR RECIPIENT',
}) => {
  return (
    <div className="bg-white p-6 rounded-none border-2 border-slate-900 text-slate-900 font-serif space-y-4">
      {/* Title Header Box */}
      <div className="border-b-2 border-slate-900 text-center pb-2 relative">
        <h1 className="text-xl font-bold tracking-widest uppercase">TAX INVOICE</h1>
        <span className="absolute right-0 top-0 text-[10px] font-sans font-bold uppercase border border-slate-900 px-1.5 py-0.5 bg-slate-100">
          {copyLabel}
        </span>
      </div>

      {/* Seller & Buyer Box */}
      <div className="grid grid-cols-2 border border-slate-900 text-xs">
        <div className="p-3 border-r border-slate-900 space-y-1 font-sans">
          <span className="font-bold uppercase text-[10px] text-slate-500 block">Seller Details</span>
          <h2 className="font-bold text-sm uppercase font-serif">{company.name}</h2>
          <p>{company.address}, {company.city}, {company.state} - {company.pincode}</p>
          <p>Phone: {company.phone}</p>
          <p className="font-mono font-bold">GSTIN: {company.gstin}</p>
        </div>

        <div className="p-3 space-y-1 font-sans">
          <div className="flex justify-between">
            <span className="font-bold uppercase text-[10px] text-slate-500">Invoice Details</span>
            <span className="font-mono font-bold text-sm">#{invoice.invoiceNumber}</span>
          </div>
          <p>Date: <span className="font-mono">{formatDate(invoice.date)}</span></p>
          <p>Due Date: <span className="font-mono">{formatDate(invoice.dueDate)}</span></p>
          <div className="pt-2 border-t border-slate-300">
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Buyer (Party)</span>
            <p className="font-bold text-sm">{invoice.partyName}</p>
            {party && <p>{party.address}, {party.city}</p>}
            {invoice.partyGstin && <p className="font-mono font-bold">GSTIN: {invoice.partyGstin}</p>}
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <table className="w-full text-left text-xs border-collapse border border-slate-900 font-sans">
        <thead>
          <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
            <th className="py-2 px-2 border-r border-slate-900 text-center w-10">S.N.</th>
            <th className="py-2 px-3 border-r border-slate-900">Description of Goods</th>
            <th className="py-2 px-2 border-r border-slate-900 text-center">HSN/SAC</th>
            <th className="py-2 px-2 border-r border-slate-900 text-center">Quantity</th>
            <th className="py-2 px-3 border-r border-slate-900 text-right">Rate (₹)</th>
            <th className="py-2 px-2 border-r border-slate-900 text-center">GST %</th>
            <th className="py-2 px-3 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {invoice.items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-mono">{idx + 1}</td>
              <td className="py-2 px-3 border-r border-slate-900 font-semibold">{item.productName}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-mono">{item.hsnCode}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-bold">{item.quantity} {item.unit}</td>
              <td className="py-2 px-3 border-r border-slate-900 text-right font-mono">{formatCurrency(item.price)}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-mono">{item.gstRate}%</td>
              <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Calculation Box */}
      <div className="grid grid-cols-2 border border-slate-900 text-xs font-sans">
        <div className="p-3 border-r border-slate-900 space-y-1">
          <span className="font-bold text-slate-700 block">Bank Account Details:</span>
          <p>Bank: {company.bankName}</p>
          <p>A/c No: <span className="font-mono font-bold">{company.accountNo}</span></p>
          <p>IFSC Code: <span className="font-mono">{company.ifsc}</span></p>
        </div>

        <div className="p-3 space-y-1 text-right">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {!invoice.isInterstate ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-mono">{formatCurrency(invoice.cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-mono">{formatCurrency(invoice.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-slate-800 font-bold">
              <span>IGST:</span>
              <span className="font-mono">{formatCurrency(invoice.igstTotal)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-900 text-sm font-black">
            <span>Total Invoice Amount:</span>
            <span className="font-mono text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-4 text-[10px] font-sans">
        <div>
          <span className="font-bold block uppercase text-slate-700">Declaration & Terms:</span>
          <p className="whitespace-pre-line">{company.terms}</p>
        </div>
        <div className="text-right flex flex-col justify-end items-end space-y-6">
          <p className="font-bold uppercase text-slate-900">For {company.name}</p>
          <div className="border-t border-slate-900 pt-1 w-44 text-center font-bold">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};
