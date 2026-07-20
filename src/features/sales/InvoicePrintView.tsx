import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { AlbaIndustrialTemplate } from './templates/AlbaIndustrialTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { CompactTemplate } from './templates/CompactTemplate';
import { Printer, ArrowLeft, Palette, Files, FileCheck } from 'lucide-react';

export type InvoiceTemplateId = 'ALBA_INDUSTRIAL' | 'MODERN' | 'CLASSIC' | 'COMPACT';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onBack: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onBack }) => {
  const { company, parties } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>('ALBA_INDUSTRIAL');
  const [isTriplicateMode, setIsTriplicateMode] = useState<boolean>(true);

  const party = parties.find((p) => p.id === invoice.partyId);

  const handlePrint = () => {
    window.print();
  };

  const renderTemplateInstance = (copyLabel: string) => {
    switch (selectedTemplate) {
      case 'ALBA_INDUSTRIAL':
        return <AlbaIndustrialTemplate invoice={invoice} company={company} party={party} copyLabel={copyLabel} />;
      case 'MODERN':
        return <ModernTemplate invoice={invoice} company={company} party={party} copyLabel={copyLabel} />;
      case 'CLASSIC':
        return <ClassicTemplate invoice={invoice} company={company} party={party} copyLabel={copyLabel} />;
      case 'COMPACT':
        return <CompactTemplate invoice={invoice} company={company} party={party} />;
      default:
        return <AlbaIndustrialTemplate invoice={invoice} company={company} party={party} copyLabel={copyLabel} />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Action & Template Selector Toolbar (Hidden on Print) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        {/* Template Design Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center text-xs font-bold text-slate-600 px-2">
            <Palette className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            <span>Design:</span>
          </div>

          <button
            onClick={() => setSelectedTemplate('ALBA_INDUSTRIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTemplate === 'ALBA_INDUSTRIAL'
                ? 'bg-red-700 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Industrial B2B Invoice
          </button>

          <button
            onClick={() => setSelectedTemplate('MODERN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTemplate === 'MODERN'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Modern Corporate
          </button>

          <button
            onClick={() => setSelectedTemplate('CLASSIC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTemplate === 'CLASSIC'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Classic Boxed
          </button>
        </div>

        {/* Triplicate Page Copy Mode Toggle */}
        <div className="flex items-center space-x-2">
          <label className="inline-flex items-center space-x-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTriplicateMode}
              onChange={(e) => setIsTriplicateMode(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <Files className="w-4 h-4 text-blue-600" />
            <span>Triplicate (3 Copies: Original, Duplicate, Office)</span>
          </label>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {isTriplicateMode ? '3 Pages' : '1 Page'} (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Printable Pages Container */}
      <div id="printable-invoice" className="space-y-8 print:space-y-0">
        {isTriplicateMode ? (
          <>
            {/* Page 1: Original Copy */}
            <div className="print-page border-b-4 border-dashed border-slate-300 pb-8 print:pb-0 print:border-b-0 print:break-after-page">
              <div className="no-print mb-2 text-xs font-bold text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200 flex items-center">
                <FileCheck className="w-4 h-4 mr-1.5" />
                PAGE 1 OF 3: ORIGINAL COPY FOR RECIPIENT
              </div>
              {renderTemplateInstance('ORIGINAL FOR RECIPIENT')}
            </div>

            {/* Page 2: Duplicate Copy */}
            <div className="print-page border-b-4 border-dashed border-slate-300 pb-8 print:pb-0 print:border-b-0 print:break-after-page">
              <div className="no-print mb-2 text-xs font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center">
                <Files className="w-4 h-4 mr-1.5" />
                PAGE 2 OF 3: DUPLICATE COPY FOR TRANSPORTER
              </div>
              {renderTemplateInstance('DUPLICATE FOR TRANSPORTER')}
            </div>

            {/* Page 3: Office Copy */}
            <div className="print-page">
              <div className="no-print mb-2 text-xs font-bold text-purple-800 bg-purple-50 p-2 rounded-lg border border-purple-200 flex items-center">
                <Files className="w-4 h-4 mr-1.5" />
                PAGE 3 OF 3: TRIPLICATE / OFFICE COPY
              </div>
              {renderTemplateInstance('TRIPLICATE / OFFICE COPY')}
            </div>
          </>
        ) : (
          /* Single Page Copy */
          <div className="print-page">{renderTemplateInstance('ORIGINAL FOR RECIPIENT')}</div>
        )}
      </div>
    </div>
  );
};
