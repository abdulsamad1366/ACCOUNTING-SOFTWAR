import React from 'react';
import { Company, Invoice, Party } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Building2 } from 'lucide-react';

interface TemplateProps {
  invoice: Invoice;
  company: Company;
  party?: Party;
  copyLabel?: string;
}

export const ModernTemplate: React.FC<TemplateProps> = ({
  invoice,
  company,
  party,
  copyLabel = 'ORIGINAL FOR RECIPIENT',
}) => {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-xl text-slate-900 font-sans space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{company.name}</h1>
            <p className="text-xs text-slate-500">{company.tagline || 'Authorized Business Invoice'}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center space-x-1 justify-end mb-1">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 font-black text-xs rounded-full uppercase tracking-wider">
              TAX INVOICE
            </span>
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 font-bold text-[10px] rounded uppercase">
              {copyLabel}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1">
            Bill No: <span className="font-mono text-blue-700">{invoice.invoiceNumber}</span>
          </p>
          <p className="text-xs text-slate-500">Date: {formatDate(invoice.date)}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-6 text-xs">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Company Details</span>
          <p className="font-semibold text-slate-800">{company.address}, {company.city}, {company.state}</p>
          <p className="text-slate-600">Phone: {company.phone} | Email: {company.email}</p>
          <p className="font-mono font-bold text-blue-900 mt-1">GSTIN: {company.gstin}</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Billed To (Buyer)</span>
          <p className="font-bold text-slate-900 text-sm">{invoice.partyName}</p>
          {party && <p className="text-slate-600">{party.address}, {party.city}, {party.state}</p>}
          <p className="text-slate-600">Phone: {invoice.partyPhone || party?.phone || 'N/A'}</p>
          {invoice.partyGstin && <p className="font-mono font-bold text-blue-900">GSTIN: {invoice.partyGstin}</p>}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Item Description</th>
              <th className="py-3 px-2 text-center">HSN</th>
              <th className="py-3 px-2 text-center">Qty</th>
              <th className="py-3 px-3 text-right">Rate</th>
              <th className="py-3 px-2 text-center">GST</th>
              <th className="py-3 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                <td className="py-3 px-3 font-bold text-slate-800">{item.productName}</td>
                <td className="py-3 px-2 text-center font-mono text-slate-600">{item.hsnCode}</td>
                <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity} {item.unit}</td>
                <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.price)}</td>
                <td className="py-3 px-2 text-center font-mono text-slate-600">{item.gstRate}%</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary */}
      <div className="grid grid-cols-2 gap-6 pt-2 text-xs">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <span className="font-bold text-slate-700">Payment Details:</span>
          <p className="text-slate-600">Bank: <span className="font-medium text-slate-900">{company.bankName}</span></p>
          <p className="text-slate-600">A/c No: <span className="font-mono font-bold text-slate-900">{company.accountNo}</span></p>
          <p className="text-slate-600">IFSC: <span className="font-mono text-slate-900">{company.ifsc}</span></p>
          <p className="text-slate-600">UPI ID: <span className="font-mono font-bold text-blue-700">{company.upiId}</span></p>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2 text-right">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {!invoice.isInterstate ? (
            <>
              <div className="flex justify-between text-slate-500">
                <span>CGST:</span>
                <span className="font-mono">{formatCurrency(invoice.cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SGST:</span>
                <span className="font-mono">{formatCurrency(invoice.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-blue-600 font-semibold">
              <span>IGST:</span>
              <span className="font-mono">{formatCurrency(invoice.igstTotal)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-blue-200 text-sm font-black text-slate-900">
            <span>Grand Total:</span>
            <span className="font-mono text-blue-800 text-base">{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-[11px] text-slate-500">
        <div>
          <span className="font-bold text-slate-700 block mb-1">Terms & Conditions:</span>
          <p className="whitespace-pre-line">{company.terms}</p>
        </div>
        <div className="text-right flex flex-col justify-end items-end space-y-6">
          <p className="font-bold text-slate-800">For {company.name}</p>
          <div className="border-t border-slate-400 pt-1 w-44 text-center font-medium">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};
