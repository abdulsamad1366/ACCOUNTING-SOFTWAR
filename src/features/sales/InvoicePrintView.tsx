import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { ModernTemplate } from './templates/ModernTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { CompactTemplate } from './templates/CompactTemplate';
import { Printer, ArrowLeft, Palette } from 'lucide-react';

export type InvoiceTemplateId = 'MODERN' | 'CLASSIC' | 'COMPACT';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onBack: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onBack }) => {
  const { company, parties } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>('MODERN');

  const party = parties.find((p) => p.id === invoice.partyId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Action & Template Selector Toolbar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print">
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
            Classic Boxed (Tally)
          </button>

          <button
            onClick={() => setSelectedTemplate('COMPACT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTemplate === 'COMPACT'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Compact POS
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF (Ctrl+P)</span>
        </button>
      </div>

      {/* Printable Area Rendering Selected Template */}
      <div id="printable-invoice">
        {selectedTemplate === 'MODERN' && <ModernTemplate invoice={invoice} company={company} party={party} />}
        {selectedTemplate === 'CLASSIC' && <ClassicTemplate invoice={invoice} company={company} party={party} />}
        {selectedTemplate === 'COMPACT' && <CompactTemplate invoice={invoice} company={company} party={party} />}
      </div>
    </div>
  );
};
