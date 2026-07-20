import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { HsnSummaryItem } from '../../types';
import { FileBarChart, Printer, Table } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { invoices, vouchers, products } = useApp();
  const [hsnSummary, setHsnSummary] = useState<HsnSummaryItem[]>([]);

  useEffect(() => {
    if (window.electronAPI?.getHsnSummary) {
      window.electronAPI.getHsnSummary().then((data) => {
        if (data) setHsnSummary(data);
      });
    } else {
      // Local fallback calculation
      const hsnMap: Record<string, HsnSummaryItem> = {};
      invoices
        .filter((i) => i.type === 'SALES')
        .forEach((inv) => {
          inv.items.forEach((item) => {
            const key = `${item.hsnCode}_${item.gstRate}`;
            if (!hsnMap[key]) {
              hsnMap[key] = {
                hsnCode: item.hsnCode || 'N/A',
                gstRate: item.gstRate,
                totalQty: 0,
                unit: item.unit || 'Pcs',
                taxableValue: 0,
                cgstAmount: 0,
                sgstAmount: 0,
                igstAmount: 0,
                totalTax: 0,
              };
            }
            const taxable = item.quantity * item.price;
            hsnMap[key].totalQty += item.quantity;
            hsnMap[key].taxableValue += taxable;
            hsnMap[key].cgstAmount += item.cgstAmount;
            hsnMap[key].sgstAmount += item.sgstAmount;
            hsnMap[key].igstAmount += item.igstAmount || 0;
            hsnMap[key].totalTax += item.cgstAmount + item.sgstAmount + (item.igstAmount || 0);
          });
        });
      setHsnSummary(Object.values(hsnMap));
    }
  }, [invoices]);

  // Profit & Loss Calculation
  const totalSalesTaxable = invoices
    .filter((i) => i.type === 'SALES')
    .reduce((sum, i) => sum + i.subtotal, 0);

  const totalSalesGST = invoices
    .filter((i) => i.type === 'SALES')
    .reduce((sum, i) => sum + i.cgstTotal + i.sgstTotal + i.igstTotal, 0);

  const totalPurchasesCost = invoices
    .filter((i) => i.type === 'PURCHASE')
    .reduce((sum, i) => sum + i.subtotal, 0);

  const totalExpenses = vouchers
    .filter((v) => v.type === 'EXPENSE')
    .reduce((sum, v) => sum + v.amount, 0);

  const grossProfit = totalSalesTaxable - totalPurchasesCost;
  const netProfit = grossProfit - totalExpenses;

  // Total Stock Valuation
  const totalStockValuation = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

  const handlePrintReports = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileBarChart className="w-6 h-6 text-blue-600 mr-2" />
            Financial Reports & GST Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated Profit & Loss Statement, Stock Valuation, and GSTR-1 HSN Summary</p>
        </div>

        <button
          onClick={handlePrintReports}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all active:scale-95 cursor-pointer no-print"
        >
          <Printer className="w-4 h-4" />
          <span>Print Reports (Ctrl+P)</span>
        </button>
      </div>

      {/* Profit & Loss Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
          Profit & Loss Statement (P&L Summary)
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100 font-semibold">
            <span className="text-slate-700">Total Revenue / Sales (Taxable):</span>
            <span className="font-mono text-emerald-700 font-bold">{formatCurrency(totalSalesTaxable)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 font-semibold">
            <span className="text-slate-700">Less: Direct Cost of Purchases:</span>
            <span className="font-mono text-rose-700 font-bold">- {formatCurrency(totalPurchasesCost)}</span>
          </div>

          <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-lg font-bold text-slate-900 text-sm">
            <span>Gross Profit:</span>
            <span className="font-mono text-blue-700">{formatCurrency(grossProfit)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 font-semibold">
            <span className="text-slate-700">Less: Indirect Operating Expenses (Rent, Salary, Utilities):</span>
            <span className="font-mono text-rose-700 font-bold">- {formatCurrency(totalExpenses)}</span>
          </div>

          <div className="flex justify-between py-3 bg-emerald-50 border border-emerald-200 px-4 rounded-xl font-black text-base text-emerald-800">
            <span>NET PROFIT:</span>
            <span className="font-mono">{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* GST Summary & Stock Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GST Filing Helper */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            GST Tax Summary (GSTR-1 / GSTR-3B Helper)
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Output CGST Collected:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totalSalesGST / 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Output SGST Collected:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totalSalesGST / 2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-blue-700">
              <span>Total Tax Output Payable:</span>
              <span className="font-mono">{formatCurrency(totalSalesGST)}</span>
            </div>
          </div>
        </div>

        {/* Stock Valuation Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Inventory Asset Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Items in Catalog:</span>
              <span className="font-mono font-bold text-slate-900">{products.length} Items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Closing Stock Valuation:</span>
              <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalStockValuation)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* GSTR-1 HSN Summary Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <Table className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">
            GSTR-1 HSN-Wise Tax Summary Table
          </h2>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-3">HSN Code</th>
                <th className="py-3 px-2 text-center">GST %</th>
                <th className="py-3 px-2 text-center">Total Qty</th>
                <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                <th className="py-3 px-3 text-right">CGST (₹)</th>
                <th className="py-3 px-3 text-right">SGST (₹)</th>
                <th className="py-3 px-3 text-right">IGST (₹)</th>
                <th className="py-3 px-3 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hsnSummary.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No HSN sales data available yet.
                  </td>
                </tr>
              ) : (
                hsnSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.hsnCode}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-600">{item.gstRate}%</td>
                    <td className="py-3 px-2 text-center font-bold">{item.totalQty} {item.unit}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{formatCurrency(item.taxableValue)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{formatCurrency(item.cgstAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{formatCurrency(item.sgstAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{formatCurrency(item.igstAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">{formatCurrency(item.totalTax)}</td>
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
