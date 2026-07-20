import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './features/dashboard/DashboardView';
import { PartiesView } from './features/parties/PartiesView';
import { InvoicesView } from './features/sales/InvoicesView';
import { InvoiceModal } from './features/sales/InvoiceModal';
import { InvoicePrintView } from './features/sales/InvoicePrintView';
import { InventoryView } from './features/inventory/InventoryView';
import { CashBankView } from './features/cashbank/CashBankView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';
import { Invoice, Party } from './types';

const AppContent: React.FC = () => {
  const { company, exportDataJSON, toastMessage } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Printable view states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [selectedPartyForBill, setSelectedPartyForBill] = useState<Party | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Keyboard Shortcuts (F2: New Bill, F3: Parties, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setInvoiceType('SALES');
        setSelectedPartyForBill(null);
        setIsInvoiceModalOpen(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('parties');
      } else if (e.key === 'Escape') {
        setIsInvoiceModalOpen(false);
        setViewingInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNewBill = (type: 'SALES' | 'PURCHASE' = 'SALES', party?: Party) => {
    setInvoiceType(type);
    setSelectedPartyForBill(party || null);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900 select-none">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setViewingInvoice(null);
          setActiveTab(tab);
        }}
        companyName={company.name}
        gstin={company.gstin}
        onOpenQuickBill={() => handleOpenNewBill('SALES')}
        onOpenQuickParty={() => setActiveTab('parties')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onExportBackup={exportDataJSON}
          toastMessage={toastMessage}
        />

        <main className="flex-1 pb-12">
          {viewingInvoice ? (
            <InvoicePrintView invoice={viewingInvoice} onBack={() => setViewingInvoice(null)} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onOpenNewBill={() => handleOpenNewBill('SALES')}
                  onOpenNewParty={() => setActiveTab('parties')}
                  onOpenNewProduct={() => setActiveTab('inventory')}
                  onOpenNewPayment={() => setActiveTab('cashbank')}
                  onViewInvoicePrint={(inv) => setViewingInvoice(inv)}
                />
              )}

              {activeTab === 'parties' && (
                <PartiesView
                  onOpenNewBillForParty={(party) => handleOpenNewBill('SALES', party)}
                  onOpenNewPaymentForParty={() => setActiveTab('cashbank')}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesView
                  onOpenNewBill={() => handleOpenNewBill('SALES')}
                  onViewInvoicePrint={(inv) => setViewingInvoice(inv)}
                />
              )}

              {activeTab === 'purchases' && (
                <InvoicesView
                  onOpenNewBill={() => handleOpenNewBill('PURCHASE')}
                  onViewInvoicePrint={(inv) => setViewingInvoice(inv)}
                />
              )}

              {activeTab === 'inventory' && <InventoryView />}

              {activeTab === 'cashbank' && <CashBankView />}

              {activeTab === 'reports' && <ReportsView />}

              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Invoice Creation Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        initialParty={selectedPartyForBill}
        invoiceType={invoiceType}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
