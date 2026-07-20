import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem, InvoiceType, Party } from '../../types';
import { formatCurrency, getTodayDateString, getDateInDays } from '../../utils/formatters';
import { X, Plus, Trash2, Receipt, AlertTriangle, ShieldAlert, Truck } from 'lucide-react';

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
  invoiceType: initialType = 'SALES',
  onSaveSuccess,
}) => {
  const { parties, products, createInvoice } = useApp();

  const [activeType, setActiveType] = useState<InvoiceType>(initialType);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialParty?.id || '');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [dueDate, setDueDate] = useState<string>(getDateInDays(15));
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isInterstate, setIsInterstate] = useState<boolean>(false);

  if (!isOpen) return null;

  const partyOptions = parties.filter((p) =>
    activeType === 'SALES' || activeType === 'QUOTATION' || activeType === 'SALES_RETURN'
      ? p.type === 'CUSTOMER'
      : p.type === 'SUPPLIER'
  );
  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  const calculateItemTotals = (item: InvoiceItem, interstate: boolean = isInterstate) => {
    const taxable = item.quantity * item.price;
    const totalGst = (taxable * item.gstRate) / 100;
    if (interstate) {
      item.cgstAmount = 0;
      item.sgstAmount = 0;
      item.igstAmount = totalGst;
    } else {
      item.cgstAmount = totalGst / 2;
      item.sgstAmount = totalGst / 2;
      item.igstAmount = 0;
    }
    item.total = taxable + totalGst;
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const newItem: InvoiceItem = {
      id: `ITM-${Date.now()}-${Math.random()}`,
      productId: defaultProd.id,
      productName: defaultProd.name,
      hsnCode: defaultProd.hsnCode,
      quantity: 1,
      unit: defaultProd.unitName || defaultProd.unit || 'Pcs',
      price:
        activeType === 'SALES' || activeType === 'QUOTATION' || activeType === 'SALES_RETURN'
          ? defaultProd.salePrice
          : defaultProd.purchasePrice,
      gstRate: defaultProd.gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0,
    };
    calculateItemTotals(newItem, isInterstate);
    setItems((prev) => [...prev, newItem]);
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
      item.unit = prod.unitName || prod.unit || 'Pcs';
      item.price =
        activeType === 'SALES' || activeType === 'QUOTATION' || activeType === 'SALES_RETURN'
          ? prod.salePrice
          : prod.purchasePrice;
      item.gstRate = prod.gstRate;
      calculateItemTotals(item, isInterstate);
      updated[index] = item;
      return updated;
    });
  };

  const handleItemUpdate = (index: number, field: keyof InvoiceItem, value: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      calculateItemTotals(item, isInterstate);
      updated[index] = item;
      return updated;
    });
  };

  const handleToggleInterstate = (checked: boolean) => {
    setIsInterstate(checked);
    setItems((prev) =>
      prev.map((item) => {
        const updated = { ...item };
        calculateItemTotals(updated, checked);
        return updated;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals Computation & Auto Round-Off
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cgstTotal = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const sgstTotal = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const igstTotal = items.reduce((sum, item) => sum + item.igstAmount, 0);
  const rawGrandTotal = subtotal + cgstTotal + sgstTotal + igstTotal - discount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = (grandTotal - rawGrandTotal).toFixed(2);

  // Business Logic Alerts
  const isEWayBillRequired = grandTotal >= 50000;
  const projectedUnpaid = Math.max(0, grandTotal - paidAmount);
  const isCreditLimitExceeded =
    selectedParty &&
    selectedParty.creditLimit > 0 &&
    selectedParty.balance + projectedUnpaid > selectedParty.creditLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId && activeType !== 'QUOTATION') {
      alert('Please select a party/customer');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    await createInvoice({
      type: activeType,
      partyId: selectedPartyId || undefined,
      partyName: selectedParty ? selectedParty.name : 'Cash Sale',
      partyPhone: selectedParty?.phone,
      partyGstin: selectedParty?.gstin,
      date,
      dueDate,
      items,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discount,
      grandTotal,
      paidAmount: Number(paidAmount) || 0,
      status:
        activeType === 'QUOTATION'
          ? 'DRAFT'
          : Number(paidAmount) >= grandTotal
          ? 'PAID'
          : Number(paidAmount) > 0
          ? 'PARTIAL'
          : 'UNPAID',
      notes,
      isInterstate,
    });

    onClose();
    if (onSaveSuccess) onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header & Document Type Switcher */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold tracking-tight">Create Voucher / Invoice Document</h2>
          </div>

          {/* Type Selector Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveType('SALES')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeType === 'SALES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => setActiveType('PURCHASE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeType === 'PURCHASE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchase
            </button>
            <button
              type="button"
              onClick={() => setActiveType('QUOTATION')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeType === 'QUOTATION' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quotation
            </button>
            <button
              type="button"
              onClick={() => setActiveType('SALES_RETURN')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeType === 'SALES_RETURN' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales Return
            </button>
          </div>

          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* E-Way Bill & Credit Limit Banners */}
          {isCreditLimitExceeded && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl flex items-center space-x-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Credit Limit Warning:</strong> Adding this bill will exceed {selectedParty?.name}'s credit limit of{' '}
                <strong>{formatCurrency(selectedParty?.creditLimit || 0)}</strong> (Current Balance:{' '}
                {formatCurrency(selectedParty?.balance || 0)}).
              </span>
            </div>
          )}

          {isEWayBillRequired && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-xl flex items-center space-x-2 text-xs">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>GST E-Way Bill Compliant:</strong> Invoice total exceeds ₹50,000 threshold. Generated bill will include E-Way Bill compliance indicators.
              </span>
            </div>
          )}

          {/* Party & Date Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select {activeType === 'SALES' || activeType === 'QUOTATION' || activeType === 'SALES_RETURN' ? 'Customer' : 'Supplier'} *
              </label>
              <select
                required={activeType !== 'QUOTATION'}
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

            <div className="flex flex-col justify-center">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax System</label>
              <label className="inline-flex items-center space-x-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={isInterstate}
                  onChange={(e) => handleToggleInterstate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-800">Interstate (IGST)</span>
              </label>
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
                      <tr key={item.id || idx} className="hover:bg-slate-50">
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

            <div className="space-y-1.5 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Subtotal (Taxable):</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {!isInterstate ? (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST:</span>
                    <span className="font-mono">{formatCurrency(cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST:</span>
                    <span className="font-mono">{formatCurrency(sgstTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>IGST (Interstate):</span>
                  <span className="font-mono">{formatCurrency(igstTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Auto Round-Off:</span>
                <span className="font-mono">{Number(roundOff) >= 0 ? `+${roundOff}` : roundOff}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
                <span className="font-mono font-black text-xl text-blue-700">{formatCurrency(grandTotal)}</span>
              </div>

              {activeType !== 'QUOTATION' && (
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
              )}
            </div>
          </div>

          {/* Submit Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Save {activeType === 'QUOTATION' ? 'Quotation' : 'Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
