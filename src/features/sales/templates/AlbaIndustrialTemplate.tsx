import React from 'react';
import { Company, Invoice, Party } from '../../../types';
import { formatCurrency, formatDate, numberToWordsInRupees } from '../../../utils/formatters';

interface TemplateProps {
  invoice: Invoice;
  company: Company;
  party?: Party;
  copyLabel?: string;
}

export const AlbaIndustrialTemplate: React.FC<TemplateProps> = ({
  invoice,
  company,
  party,
  copyLabel = 'ORIGINAL FOR RECIPIENT',
}) => {
  const isInterstate = invoice.isInterstate;
  const rawTotal = invoice.subtotal + invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal - invoice.discount;
  const roundOff = (invoice.grandTotal - rawTotal).toFixed(2);

  const companyShortName = company.name ? company.name.split(' ')[0] : 'ERP';

  return (
    <div className="bg-white p-6 rounded-none border-2 border-slate-900 text-slate-900 font-sans text-xs space-y-2">
      {/* Top Header Banner */}
      <div className="relative border-b-2 border-slate-900 pb-2 text-center">
        {/* ISO Circle Badge Left */}
        <div className="absolute left-0 top-0 w-16 h-16 border-2 border-slate-900 rounded-full flex flex-col items-center justify-center text-[8px] font-bold leading-tight text-center p-1">
          <span>ISO 9001:2015</span>
          <span className="font-black text-[9px] border-y border-slate-900 w-full py-[1px] my-[1px] uppercase truncate">
            {companyShortName}
          </span>
          <span>CERTIFIED</span>
        </div>

        {/* Top Badges Right */}
        <div className="absolute right-0 top-0 flex items-center space-x-1">
          <span className="border-2 border-slate-900 font-black px-2 py-0.5 text-[11px] tracking-wider uppercase bg-white">
            TAX INVOICE
          </span>
          <span className="border-2 border-slate-900 font-bold px-2 py-0.5 text-[10px] uppercase bg-red-50 text-red-900 border-red-900">
            {copyLabel}
          </span>
        </div>

        {/* Company Title & Details */}
        <h1 className="text-2xl font-black text-red-700 tracking-wider uppercase font-serif">
          {company.name}
        </h1>
        <p className="font-bold text-[11px] text-slate-800">
          {company.tagline || 'Manufacturers & Authorized Business Distributors'}
        </p>

        <div className="flex justify-center items-center space-x-6 text-[11px] font-bold mt-0.5">
          <span>GSTIN : {company.gstin}</span>
          <span>STATE : {company.state || 'Delhi'}</span>
        </div>

        <p className="text-[10px] text-slate-700 mt-0.5">
          {company.address}, {company.city}, {company.state} {company.pincode ? `- ${company.pincode}` : ''} | MOB.: {company.phone}
        </p>
      </div>

      {/* Buyer & Metadata Grid */}
      <div className="grid grid-cols-2 border-2 border-slate-900 text-xs divide-x-2 divide-slate-900">
        {/* Left: Buyers / Receivers Box */}
        <div className="p-2.5 space-y-1">
          <span className="font-bold underline text-[11px] block">Buyers / Receivers</span>
          <h2 className="font-bold text-sm uppercase">{party?.companyName || invoice.partyName}</h2>
          <p className="font-semibold">{party?.address || 'Customer Address'}</p>
          <p>{party?.city || ''} {party?.state ? `, ${party.state}` : ''} {party?.pincode ? `- ${party.pincode}` : ''}</p>
          <div className="flex justify-between pt-1 border-t border-slate-300 font-bold">
            <span>STATE : {party?.state || 'State'}</span>
            <span>Code : {party?.stateCode || '07'}</span>
          </div>
          <p className="font-mono font-bold pt-0.5">GSTIN : {invoice.partyGstin || party?.gstin || 'N/A'}</p>
        </div>

        {/* Right: Invoice Metadata Grid */}
        <div className="divide-y divide-slate-900">
          <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5 font-bold">
            <div>Invoice No. : <span className="font-mono">{invoice.invoiceNumber}</span></div>
            <div>Dated : <span className="font-mono">{formatDate(invoice.date)}</span></div>
          </div>

          <div className="p-1.5 font-bold">
            Destination : <span>{party?.city || 'Local'}</span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
            <div>Transport : <span className="font-semibold">By Road</span></div>
            <div>Due Date : <span className="font-mono">{formatDate(invoice.dueDate)}</span></div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
            <div>Pvt. Mark : <span className="font-bold">GEN</span></div>
            <div>Reverse Charge : <span className="font-bold">No</span></div>
          </div>

          <div className="p-1.5 font-bold">
            Status : <span className="uppercase text-blue-800">{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* Main Items Grid Table */}
      <table className="w-full text-left text-xs border-collapse border-2 border-slate-900">
        <thead>
          <tr className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-900 text-[11px]">
            <th className="py-2 px-2 border-r border-slate-900 text-center w-8">S.N.</th>
            <th className="py-2 px-3 border-r border-slate-900">PARTICULARS</th>
            <th className="py-2 px-2 border-r border-slate-900 text-center w-20">HSN/ASC</th>
            <th className="py-2 px-2 border-r border-slate-900 text-center w-16">GST%</th>
            <th className="py-2 px-2 border-r border-slate-900 text-center w-20">QUANTITY</th>
            <th className="py-2 px-3 border-r border-slate-900 text-right w-20">RATE</th>
            <th className="py-2 px-3 text-right w-24">AMOUNT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-400 font-semibold">
          {invoice.items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono text-[11px]">{idx + 1}</td>
              <td className="py-1.5 px-3 border-r border-slate-900 font-bold uppercase">{item.productName}</td>
              <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono text-[11px]">{item.hsnCode}</td>
              <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono text-[11px]">{item.gstRate.toFixed(1)}</td>
              <td className="py-1.5 px-2 border-r border-slate-900 text-center font-bold">{item.quantity} {item.unit || 'PCS'}</td>
              <td className="py-1.5 px-3 border-r border-slate-900 text-right font-mono">{formatCurrency(item.price)}</td>
              <td className="py-1.5 px-3 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tax Summary Table & Totals Stack */}
      <div className="grid grid-cols-12 border-2 border-slate-900 divide-x-2 divide-slate-900 text-xs">
        {/* Left 7 Columns: GST Summary */}
        <div className="col-span-7 flex flex-col justify-between p-2 space-y-2">
          <table className="w-full text-center border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold">
                <th className="py-1 px-1 border-r border-slate-900">GST%</th>
                <th className="py-1 px-1 border-r border-slate-900">AMOUNT</th>
                <th className="py-1 px-1 border-r border-slate-900">DISC.</th>
                <th className="py-1 px-1 border-r border-slate-900">TAXABLE AMT.</th>
                {isInterstate ? (
                  <th className="py-1 px-1">IGST</th>
                ) : (
                  <>
                    <th className="py-1 px-1 border-r border-slate-900">CGST</th>
                    <th className="py-1 px-1">SGST</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="font-mono font-semibold">
              <tr>
                <td className="py-1 border-r border-slate-900">{invoice.items[0]?.gstRate || 18}.00</td>
                <td className="py-1 border-r border-slate-900">{invoice.subtotal.toFixed(2)}</td>
                <td className="py-1 border-r border-slate-900">{invoice.discount.toFixed(2)}</td>
                <td className="py-1 border-r border-slate-900">{(invoice.subtotal - invoice.discount).toFixed(2)}</td>
                {isInterstate ? (
                  <td className="py-1">{invoice.igstTotal.toFixed(2)}</td>
                ) : (
                  <>
                    <td className="py-1 border-r border-slate-900">{invoice.cgstTotal.toFixed(2)}</td>
                    <td className="py-1">{invoice.sgstTotal.toFixed(2)}</td>
                  </>
                )}
              </tr>
              <tr className="border-t-2 border-slate-900 font-bold bg-slate-50">
                <td className="py-1 border-r border-slate-900">TOTAL</td>
                <td className="py-1 border-r border-slate-900">{invoice.subtotal.toFixed(2)}</td>
                <td className="py-1 border-r border-slate-900">{invoice.discount.toFixed(2)}</td>
                <td className="py-1 border-r border-slate-900">{(invoice.subtotal - invoice.discount).toFixed(2)}</td>
                {isInterstate ? (
                  <td className="py-1">{invoice.igstTotal.toFixed(2)}</td>
                ) : (
                  <>
                    <td className="py-1 border-r border-slate-900">{invoice.cgstTotal.toFixed(2)}</td>
                    <td className="py-1">{invoice.sgstTotal.toFixed(2)}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>

          <div className="font-bold text-xs pt-1 border-t border-slate-900">
            TOTAL GST AMOUNT = <span className="font-mono font-black">{formatCurrency(invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal)}</span>
          </div>
        </div>

        {/* Right 5 Columns: Grand Totals Stack */}
        <div className="col-span-5 p-2 font-mono text-right space-y-1 text-xs">
          <div className="flex justify-between font-bold">
            <span className="font-sans">TOTAL</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-700">
            <span className="font-sans">DISCOUNT</span>
            <span>{formatCurrency(invoice.discount)}</span>
          </div>
          <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-300">
            <span className="font-sans">Taxable Amount :</span>
            <span>{formatCurrency(invoice.subtotal - invoice.discount)}</span>
          </div>

          {isInterstate ? (
            <div className="flex justify-between text-slate-800">
              <span className="font-sans">Add : IGST</span>
              <span>{formatCurrency(invoice.igstTotal)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-800">
                <span className="font-sans">Add : CGST</span>
                <span>{formatCurrency(invoice.cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-800">
                <span className="font-sans">Add : SGST</span>
                <span>{formatCurrency(invoice.sgstTotal)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-slate-600">
            <span className="font-sans">Round off :</span>
            <span>{roundOff}</span>
          </div>

          <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-black text-sm text-slate-900 bg-slate-100 p-1 rounded">
            <span className="font-sans">Total Invoice Amount :</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Amount In Words Banner */}
      <div className="border-2 border-slate-900 p-2 font-bold text-xs bg-slate-50 flex items-center">
        <span className="text-red-700 mr-2">₹ (In Words) :</span>
        <span className="font-serif text-slate-900 font-black tracking-wide">
          {numberToWordsInRupees(invoice.grandTotal)}
        </span>
      </div>

      {/* Legal Disclaimer Line */}
      <p className="text-[9px] text-slate-600 font-semibold leading-tight text-center">
        All Goods are Packed with the highest care possible and we take every precaution for the safe delivery of goods but our liability for breakage, loss or damage ceases with the despatch of goods. If necessary, goods and weight of parcels may be compared with R/R before delivery.
      </p>

      {/* Footer 3-Column Section (Terms, Bank, Signature Block) */}
      <div className="grid grid-cols-12 border-2 border-slate-900 divide-x-2 divide-slate-900 text-[10px]">
        {/* Left Column: Terms & Conditions */}
        <div className="col-span-4 p-2 space-y-1">
          <span className="font-bold text-red-700 underline block text-[11px]">Terms & Conditions :</span>
          <p className="whitespace-pre-line text-slate-800 text-[9px] font-medium leading-tight">
            {company.terms || '1. Goods once sold will not be taken back.\n2. All disputes subject to local jurisdiction.'}
          </p>
        </div>

        {/* Middle Column: Bank Details */}
        <div className="col-span-4 p-2 space-y-1 font-sans">
          <span className="font-bold text-red-700 underline block text-[11px]">Bank Details :</span>
          <p className="font-semibold">Acc.No. : <span className="font-mono font-bold text-slate-900">{company.accountNo}</span></p>
          <p className="font-semibold">Bank : <span className="font-bold">{company.bankName}</span></p>
          <p className="font-semibold">IFSC Code : <span className="font-mono font-bold text-slate-900">{company.ifsc}</span></p>
          <p className="font-semibold">Branch : <span>{company.branch}</span></p>
        </div>

        {/* Right Column: Signature Block */}
        <div className="col-span-4 p-2 text-center flex flex-col justify-between items-center text-[10px]">
          <p className="text-[9px] text-slate-600">Certified that the particulars given above are true and correct</p>
          <p className="font-bold text-red-700 text-[11px] uppercase">For {company.name}</p>

          {/* Signature Graphic Box */}
          <div className="my-2 border border-slate-400 p-1 rounded bg-slate-50 w-36 h-10 flex items-center justify-center relative">
            <span className="text-blue-800 font-serif italic text-xs tracking-wider opacity-80 select-none">
              Sign & Stamp
            </span>
          </div>

          <div className="w-full flex justify-between px-2 pt-1 border-t border-slate-400 font-bold text-slate-800">
            <span>(COMMON SEAL)</span>
            <span>Authorised Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};
