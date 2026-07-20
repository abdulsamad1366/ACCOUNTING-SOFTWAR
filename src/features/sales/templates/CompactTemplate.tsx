import React from 'react';
import { Company, Invoice, Party } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface TemplateProps {
  invoice: Invoice;
  company: Company;
  party?: Party;
}

export const CompactTemplate: React.FC<TemplateProps> = ({ invoice, company, party }) => {
  return (
    <div className="bg-white p-6 max-w-2xl mx-auto border border-slate-300 rounded-xl shadow-md text-slate-900 font-mono space-y-4">
      {/* Header */}
      <div className="text-center border-b border-dashed border-slate-400 pb-3">
        <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase">{company.name}</h1>
        <p className="text-[11px] text-slate-600 font-sans">{company.address}, {company.city}</p>
        <p className="text-[11px] text-slate-600 font-sans">Phone: {company.phone} | GSTIN: {company.gstin}</p>
        <div className="mt-2 font-bold text-xs bg-slate-100 inline-block px-3 py-1 rounded">
          RETAIL SALES RECEIPT #{invoice.invoiceNumber}
        </div>
      </div>

      {/* Details */}
      <div className="flex justify-between text-xs font-sans pb-2 border-b border-dashed border-slate-300">
        <div>
          <span className="text-slate-500 block text-[10px]">Customer:</span>
          <p className="font-bold text-slate-900">{invoice.partyName}</p>
          {party && <p className="text-slate-600 text-[11px]">{party.phone}</p>}
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[10px]">Date:</span>
          <p className="font-bold text-slate-900">{formatDate(invoice.date)}</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-400 font-bold text-slate-700">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoice.items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-1.5 font-bold text-slate-800">
                {item.productName}
                <span className="block text-[10px] text-slate-500 font-sans font-normal">HSN: {item.hsnCode} ({item.gstRate}% GST)</span>
              </td>
              <td className="py-1.5 text-center">{item.quantity}</td>
              <td className="py-1.5 text-right">{formatCurrency(item.price)}</td>
              <td className="py-1.5 text-right font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-xs text-right">
        <div className="flex justify-between">
          <span className="text-slate-600">Subtotal:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Taxes (GST):</span>
          <span>{formatCurrency(invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-900 font-black text-sm text-slate-900">
          <span>NET PAYABLE:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] font-sans text-slate-500 pt-4 border-t border-slate-200">
        <p className="font-bold text-slate-700">Thank you for your business!</p>
        <p>{company.terms}</p>
      </div>
    </div>
  );
};
