import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Package, Plus, Search, AlertTriangle, Trash2, X } from 'lucide-react';

interface InventoryViewProps {
  onOpenNewProductModal?: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = () => {
  const { products, addProduct, deleteProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Wires & Cables',
    unit: 'Pcs',
    hsnCode: '8544',
    gstRate: 18,
    salePrice: 0,
    purchasePrice: 0,
    currentStock: 0,
    minStockAlert: 10,
  });

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category || 'General')))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hsnCode.includes(searchTerm);
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    addProduct({
      code: formData.code || `PRD-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      hsnCode: formData.hsnCode || '8544',
      gstRate: Number(formData.gstRate) || 18,
      salePrice: Number(formData.salePrice) || 0,
      purchasePrice: Number(formData.purchasePrice) || 0,
      currentStock: Number(formData.currentStock) || 0,
      minStockAlert: Number(formData.minStockAlert) || 10,
    });
    setIsModalOpen(false);
    setFormData({
      code: '',
      name: '',
      category: 'Wires & Cables',
      unit: 'Pcs',
      hsnCode: '8544',
      gstRate: 18,
      salePrice: 0,
      purchasePrice: 0,
      currentStock: 0,
      minStockAlert: 10,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-2" />
            Stock & Inventory Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Track live stock quantities, HSN codes, and low stock warnings</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Stock Value</span>
            <p className="text-base font-black text-slate-900 font-mono">{formatCurrency(totalStockValue)}</p>
          </div>
          {lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Low Stock Alerts</span>
              <p className="text-base font-black text-amber-700 font-mono flex items-center justify-end">
                <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
                {lowStockCount} Items
              </p>
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product name, SKU or HSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">HSN</th>
                <th className="py-3 px-4 text-center">GST %</th>
                <th className="py-3 px-4 text-right">Sale Price</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No products found. Click '+ Add New Product' above!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLowStock = prod.currentStock <= prod.minStockAlert;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{prod.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{prod.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{prod.category}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">{prod.hsnCode}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">{prod.gstRate}%</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(prod.salePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                            isLowStock ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => deleteProduct(prod.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Inventory Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Polycab 1.5 sqmm Wire"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Lighting / Wires"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (Pcs/Kg/Box)</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Mtr">Mtr</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    placeholder="8544"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value={18}>18%</option>
                    <option value={12}>12%</option>
                    <option value={5}>5%</option>
                    <option value={0}>0% (Exempted)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Warning Level</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
