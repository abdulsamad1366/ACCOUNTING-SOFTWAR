import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem, InvoiceType, Party } from '../../types';
import { formatCurrency, getTodayDateString, getDateInDays } from '../../utils/formatters';
import { X, Plus, Trash2, Receipt } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParty?: Party | null;
  invoiceType?: InvoiceType;
  onSaveSuccess?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  initialParty,
  invoiceType = 'SALES',
  onSaveSuccess,
}) => {
  const { parties, products, createInvoice } = useApp();

  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialParty?.id || '');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [dueDate, setDueDate] = useState<string>(getDateInDays(15));
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const partyOptions = parties.filter((p) =>
    invoiceType === 'SALES' ? p.type === 'CUSTOMER' : p.type === 'SUPPLIER'
  );
  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  // Add Item Row
  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const newItem: InvoiceItem = {
      id: `ITM-${Date.now()}-${Math.random()}`,
      productId: defaultProd.id,
      productName: defaultProd.name,
      hsnCode: defaultProd.hsnCode,
      quantity: 1,
      unit: defaultProd.unit,
      price: invoiceType === 'SALES' ? defaultProd.salePrice : defaultProd.purchasePrice,
      gstRate: defaultProd.gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,
    };
    calculateItemTotals(newItem);
    setItems((prev) => [...prev, newItem]);
  };

  const calculateItemTotals = (item: InvoiceItem) => {
    const taxable = item.quantity * item.price;
    const totalGst = (taxable * item.gstRate) / 100;
    item.cgstAmount = totalGst / 2;
    item.sgstAmount = totalGst / 2;
    item.igstAmount = 0;
    item.total = taxable + totalGst;
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.productId = prod.id;
      item.productName = prod.name;
      item.hsnCode = prod.hsnCode;
      item.unit = prod.unit;
      item.price = invoiceType === 'SALES' ? prod.salePrice : prod.purchasePrice;
      item.gstRate = prod.gstRate;
      calculateItemTotals(item);
      updated[index] = item;
      return updated;
    });
  };

  const handleItemUpdate = (index: number, field: keyof InvoiceItem, value: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      calculateItemTotals(item);
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Totals Computation
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cgstTotal = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const sgstTotal = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const rawGrandTotal = subtotal + cgstTotal + sgstTotal - discount;
  const grandTotal = Math.round(rawGrandTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId) {
      alert('Please select a customer/party');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item to the bill');
      return;
    }

    createInvoice({
      type: invoiceType,
      partyId: selectedPartyId,
      partyName: selectedParty ? selectedParty.name : 'Cash Sale',
      partyPhone: selectedParty?.phone,
      partyGstin: selectedParty?.gstin,
      date,
      dueDate,
      items,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      discount,
      grandTotal,
      paidAmount: Number(paidAmount) || 0,
      status: Number(paidAmount) >= grandTotal ? 'PAID' : Number(paidAmount) > 0 ? 'PARTIAL' : 'UNPAID',
      notes,
    });

    onClose();
    if (onSaveSuccess) onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold">
              Create New {invoiceType === 'SALES' ? 'Sales Bill' : 'Purchase Bill'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Party & Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select {invoiceType === 'SALES' ? 'Customer' : 'Supplier'} *
              </label>
              <select
                required
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              >
                <option value="">-- Choose Party --</option>
                {partyOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.companyName ? `(${p.companyName})` : ''} - Bal: ₹{p.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Line Items</h3>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-2 w-20">HSN</th>
                    <th className="py-2.5 px-2 w-20">Qty</th>
                    <th className="py-2.5 px-2 w-24">Price (₹)</th>
                    <th className="py-2.5 px-2 w-20">GST %</th>
                    <th className="py-2.5 px-3 text-right w-28">Total</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No items added yet. Click '+ Add Item' above!
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-medium"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 font-mono text-slate-500">{item.hsnCode}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemUpdate(idx, 'quantity', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemUpdate(idx, 'price', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 font-mono text-slate-600">{item.gstRate}%</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Billing Calculation Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
              <textarea
                rows={3}
                placeholder="Payment terms, delivery details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Subtotal (Taxable):</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>CGST:</span>
                <span className="font-mono">{formatCurrency(cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SGST:</span>
                <span className="font-mono">{formatCurrency(sgstTotal)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
                <span className="font-mono font-black text-xl text-blue-700">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span>Payment Received (₹):</span>
                <input
                  type="number"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-32 p-1.5 border border-slate-300 rounded text-right font-mono font-bold text-emerald-700 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Save & Create Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
