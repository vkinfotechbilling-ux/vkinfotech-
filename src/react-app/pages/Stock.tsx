import { useState, useMemo, useEffect } from 'react';
import { productService, Product } from '../services/ProductService';
import { stockService, StockLog } from '../services/StockService';
import {
  Search,

  RefreshCw,
  History,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
  BarChart3,
  Zap,
  Target,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';



interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
  timestamp: string;
}

interface UsageTrend {
  productId: string;
  productName: string;
  avgDailyUsage: number;
  daysUntilStockout: number;
  reorderSuggestion: number;
}

export default function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);

  useEffect(() => {
    // Load data
    setProducts(productService.getAllProducts());
    setStockLogs(stockService.getAllLogs());
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState<StockLog[]>([]);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    updateType: 'IN' as 'IN' | 'OUT',
    quantity: '',
    reason: '',
    remarks: ''
  });

  const categories = ['Electronics', 'Mobile', 'Computers', 'Audio', 'Accessories'];
  const brands = ['Samsung', 'Apple', 'HP', 'Sony', 'Dell', 'LG', 'Lenovo', 'OnePlus'];
  const reasons = {
    IN: ['Purchase', 'Return', 'Adjustment'],
    OUT: ['Billing', 'Damage', 'Adjustment']
  };

  // Automatic Stock Analysis - Calculate usage trends
  const usageTrends = useMemo(() => {
    const trends: UsageTrend[] = [];

    products.forEach(product => {
      const productLogs = stockLogs.filter(log =>
        log.productId === product.id && log.changeType === 'OUT' && log.reason === 'Billing'
      );

      if (productLogs.length > 0) {
        const totalUsed = productLogs.reduce((sum, log) => sum + log.quantity, 0);
        const avgDailyUsage = totalUsed / 7; // Assuming 7 days of data
        const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(product.stock / avgDailyUsage) : 999;
        const reorderSuggestion = Math.ceil(avgDailyUsage * 14); // 2 weeks supply

        trends.push({
          productId: product.id,
          productName: product.name,
          avgDailyUsage,
          daysUntilStockout,
          reorderSuggestion
        });
      }
    });

    return trends;
  }, [products, stockLogs]);

  // Automatic Stock Alerts Generation
  const stockAlerts = useMemo(() => {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      const trend = usageTrends.find(t => t.productId === product.id);

      // Critical: Out of stock
      if (product.stock === 0) {
        alerts.push({
          id: `A${alerts.length + 1}`,
          productId: product.id,
          productName: product.name,
          type: 'critical',
          message: 'Product is out of stock',
          suggestion: trend
            ? `Immediate reorder recommended: ${trend.reorderSuggestion} ${product.unit}`
            : `Reorder at least ${product.minStock * 2} ${product.unit}`,
          timestamp: new Date().toLocaleString('en-IN')
        });
      }
      // Warning: Low stock
      else if (product.stock <= product.minStock) {
        alerts.push({
          id: `A${alerts.length + 1}`,
          productId: product.id,
          productName: product.name,
          type: 'warning',
          message: `Low stock: ${product.stock} ${product.unit} remaining`,
          suggestion: trend
            ? `Reorder suggested: ${trend.reorderSuggestion} ${product.unit} (${trend.daysUntilStockout} days until stockout)`
            : `Reorder ${product.minStock * 2} ${product.unit} soon`,
          timestamp: new Date().toLocaleString('en-IN')
        });
      }
      // Info: Stock will run out soon based on usage
      else if (trend && trend.daysUntilStockout < 7 && trend.daysUntilStockout > 0) {
        alerts.push({
          id: `A${alerts.length + 1}`,
          productId: product.id,
          productName: product.name,
          type: 'info',
          message: `Stock projected to run out in ${trend.daysUntilStockout} days`,
          suggestion: `Based on usage trend (${trend.avgDailyUsage.toFixed(1)} ${product.unit}/day), reorder ${trend.reorderSuggestion} ${product.unit}`,
          timestamp: new Date().toLocaleString('en-IN')
        });
      }
    });

    return alerts.sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2 };
      return priority[a.type] - priority[b.type];
    });
  }, [products, usageTrends]);

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    if (stock <= minStock) return { label: 'Low Stock', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle };
    return { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle };
  };

  const totalStockQty = products.reduce((sum, p) => sum + p.stock, 0);
  const criticalAlerts = stockAlerts.filter(a => a.type === 'critical').length;
  const warningAlerts = stockAlerts.filter(a => a.type === 'warning').length;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesBrand = !filterBrand || product.brand === filterBrand;

    let matchesStockStatus = true;
    if (filterStockStatus === 'Available') {
      matchesStockStatus = product.stock > product.minStock;
    } else if (filterStockStatus === 'Low Stock') {
      matchesStockStatus = product.stock > 0 && product.stock <= product.minStock;
    } else if (filterStockStatus === 'Out of Stock') {
      matchesStockStatus = product.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesStockStatus;
  });

  const handleUpdateStock = (product: Product) => {
    setSelectedProduct(product);
    setUpdateForm({
      updateType: 'IN',
      quantity: '',
      reason: '',
      remarks: ''
    });
    setFormErrors({});
    setShowUpdateModal(true);
  };

  const handleViewHistory = (product: Product) => {
    const history = stockLogs.filter(log => log.productId === product.id);
    setSelectedProductHistory(history);
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const handleInitiateUpdate = () => {
    // Validation
    const errors: Record<string, boolean> = {};
    if (!updateForm.quantity) errors.quantity = true;
    if (!updateForm.reason) errors.reason = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!selectedProduct) return;

    const quantity = parseInt(updateForm.quantity);
    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    // Check negative stock
    const oldStock = selectedProduct.stock;
    const newStock = updateForm.updateType === 'IN'
      ? oldStock + quantity
      : oldStock - quantity;

    if (newStock < 0) {
      alert('Cannot decrease stock below 0');
      return;
    }

    setAuthPassword('');
    setAuthError(false);
    setShowAuthModal(true);
  };

  const handleAuthSubmit = () => {
    if (!authPassword) {
      setAuthError(true);
      return;
    }
    setShowAuthModal(false);
    applyStockUpdate();
  };


  const applyStockUpdate = () => {
    if (!selectedProduct) return;

    const quantity = parseInt(updateForm.quantity);
    const oldStock = selectedProduct.stock;
    const newStock = updateForm.updateType === 'IN'
      ? oldStock + quantity
      : oldStock - quantity;

    // Update product stock
    productService.updateProduct(selectedProduct.id, {
      stock: newStock,
      updatedAt: new Date().toLocaleString('en-IN')
    });
    setProducts(productService.getAllProducts()); // Refresh

    // Add stock log
    const newLog: StockLog = {
      id: `L${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      oldStock,
      newStock,
      changeType: updateForm.updateType,
      quantity,
      reason: updateForm.reason,
      remarks: updateForm.remarks,
      updatedBy: 'Admin',
      dateTime: new Date().toLocaleString('en-IN')
    };
    stockService.addLog(newLog);

    setStockLogs(stockService.getAllLogs()); // Refresh

    // Success Animation
    setIsUpdateSuccess(true);

    // Close modal after delay
    setTimeout(() => {
      setIsUpdateSuccess(false);
      setShowUpdateModal(false);
    }, 1500);
  };

  const handleAutoReorder = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const trend = usageTrends.find(t => t.productId === productId);

    if (!product || !trend) {
      alert('Unable to calculate reorder quantity');
      return;
    }

    const confirmed = confirm(
      `Auto-reorder for ${product.name}?\n\n` +
      `Current Stock: ${product.stock} ${product.unit}\n` +
      `Avg Daily Usage: ${trend.avgDailyUsage.toFixed(1)} ${product.unit}\n` +
      `Suggested Reorder: ${trend.reorderSuggestion} ${product.unit}\n\n` +
      `This will add ${trend.reorderSuggestion} ${product.unit} to your stock.`
    );

    if (confirmed) {
      // Simulate reorder
      const oldStock = product.stock;
      const newStock = oldStock + trend.reorderSuggestion;

      setProducts(products.map(p =>
        p.id === productId
          ? { ...p, stock: newStock, updatedAt: new Date().toLocaleString('en-IN') }
          : p
      ));

      const newLog: StockLog = {
        id: `L${(stockLogs.length + 1).toString().padStart(3, '0')}`,
        productId: product.id,
        productName: product.name,
        oldStock,
        newStock,
        changeType: 'IN',
        quantity: trend.reorderSuggestion,
        reason: 'Purchase',
        remarks: 'Auto-reorder based on usage analysis',
        updatedBy: 'System',
        dateTime: new Date().toLocaleString('en-IN')
      };
      setStockLogs([newLog, ...stockLogs]);

      alert('Auto-reorder completed successfully!');
    }
  };


  const getDateFilter = (range: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'daily':
        return today;
      case 'weekly':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'monthly':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return monthAgo;
      case 'yearly':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return yearAgo;
    }
  };

  const handleExportExcel = (dateRange: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const filterDate = getDateFilter(dateRange);

    // Filter stock logs by date
    const filteredLogs = stockLogs.filter(log => {
      const logDate = new Date(log.dateTime);
      return logDate >= filterDate;
    });

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary Statistics
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.stock > p.minStock).length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

    const stockInLogs = filteredLogs.filter(log => log.changeType === 'IN');
    const stockOutLogs = filteredLogs.filter(log => log.changeType === 'OUT');
    const totalStockIn = stockInLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalStockOut = stockOutLogs.reduce((sum, log) => sum + log.quantity, 0);
    const salesLogs = filteredLogs.filter(log => log.reason === 'Billing');
    const totalSales = salesLogs.reduce((sum, log) => sum + log.quantity, 0);

    const rangeLabel = dateRange === 'daily' ? 'Today' :
      dateRange === 'weekly' ? 'Last 7 Days' :
        dateRange === 'monthly' ? 'Last 30 Days' : 'Last Year';

    const summaryData = [
      ['VK INFO TECH - STOCK SUMMARY REPORT'],
      ['Generated On:', new Date().toLocaleString('en-IN')],
      ['Date Range:', rangeLabel],
      [''],
      ['STOCK OVERVIEW'],
      ['Total Products', totalProducts],
      ['Available (Good Stock)', inStockProducts],
      ['Low Stock Alert', lowStockProducts],
      ['Out of Stock', outOfStockProducts],
      ['Total Stock Value', `₹${totalStockValue.toLocaleString()}`],
      [''],
      ['STOCK MOVEMENTS (Selected Period)'],
      ['Total Stock IN', totalStockIn],
      ['Total Stock OUT', totalStockOut],
      ['Total Sales (Units)', totalSales],
      ['Net Stock Movement', totalStockIn - totalStockOut],
      [''],
      ['CHART DATA - Stock Status Distribution'],
      ['Status', 'Count'],
      ['Available', inStockProducts],
      ['Low Stock', lowStockProducts],
      ['Out of Stock', outOfStockProducts],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Current Stock Details
    const wsStock = XLSX.utils.json_to_sheet(products.map(p => ({
      'Product ID': p.id,
      'Product Name': p.name,
      'Brand': p.brand,
      'Category': p.category,
      'Current Stock': p.stock,
      'Min Stock': p.minStock,
      'Unit': p.unit,
      'Price': p.price,
      'Stock Value': p.stock * p.price,
      'GST %': p.gst,
      'Status': p.status,
      'Stock Status': p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'Available'
    })));
    XLSX.utils.book_append_sheet(wb, wsStock, "Stock Details");

    // Sheet 3: Stock Movements (Filtered by date)
    const wsMovements = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
      'Date & Time': log.dateTime,
      'Product ID': log.productId,
      'Product Name': log.productName,
      'Type': log.changeType === 'IN' ? 'Stock IN' : 'Stock OUT',
      'Quantity': log.quantity,
      'Reason': log.reason,
      'Old Stock': log.oldStock,
      'New Stock': log.newStock,
      'Remarks': log.remarks || '-',
      'Updated By': log.updatedBy
    })));
    XLSX.utils.book_append_sheet(wb, wsMovements, "Stock Movements");

    // Sheet 4: Category-wise Summary
    const categoryStats = products.reduce((acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = { count: 0, totalStock: 0, totalValue: 0 };
      }
      acc[p.category].count++;
      acc[p.category].totalStock += p.stock;
      acc[p.category].totalValue += p.stock * p.price;
      return acc;
    }, {} as Record<string, { count: number; totalStock: number; totalValue: number }>);

    const categoryData = Object.entries(categoryStats).map(([category, stats]) => ({
      'Category': category,
      'Products': stats.count,
      'Total Stock': stats.totalStock,
      'Stock Value': `₹${stats.totalValue.toLocaleString()}`
    }));
    const wsCategory = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCategory, "Category Analysis");

    const filename = `VKINFOTECHSTOCKS_${rangeLabel.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
    setShowExportModal(false);
  };



  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
          <p className="text-gray-500 mt-1">Intelligent stock monitoring with automatic analysis</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAlertsModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all hover:scale-105 relative"
          >
            <Bell size={20} />
            Alerts
            {stockAlerts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {stockAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
          >
            <FileSpreadsheet size={20} />
            Excel
          </button>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <p className="text-gray-800 text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Stock Qty</p>
              <p className="text-gray-800 text-2xl font-bold">{totalStockQty}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Available</p>
              <p className="text-gray-800 text-2xl font-bold">
                {products.filter(p => p.stock > p.minStock).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Warnings</p>
              <p className="text-gray-800 text-2xl font-bold">{warningAlerts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Critical</p>
              <p className="text-gray-800 text-2xl font-bold">{criticalAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Analysis Insights */}
      {stockAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="text-orange-600" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Automatic Analysis - Action Required</h3>
              <div className="space-y-2">
                {stockAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-100 shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${alert.type === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {alert.type.toUpperCase()}
                        </span>
                        <span className="text-gray-800 font-semibold">{alert.productName}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{alert.message}</p>
                      <p className="text-green-600 text-sm mt-1">💡 {alert.suggestion}</p>
                    </div>
                    {usageTrends.find(t => t.productId === alert.productId) && (
                      <button
                        onClick={() => handleAutoReorder(alert.productId)}
                        className="ml-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                      >
                        <Zap size={16} />
                        Auto Reorder
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {stockAlerts.length > 3 && (
                <button
                  onClick={() => setShowAlertsModal(true)}
                  className="mt-3 text-orange-600 hover:text-orange-700 text-sm font-semibold"
                >
                  View all {stockAlerts.length} alerts →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Stock Status</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Product ID</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Product Name</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Brand</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Category</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Current Stock</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Usage Trend</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Stock Status</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  const StatusIcon = stockStatus.icon;
                  const trend = usageTrends.find(t => t.productId === product.id);

                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-semibold">{product.id}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.brand}</td>
                      <td className="py-3 px-4 text-gray-600">{product.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 text-lg font-bold">{product.stock}</span>
                          <span className="text-gray-500 text-sm">{product.unit}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Min: {product.minStock}</div>
                      </td>
                      <td className="py-3 px-4">
                        {trend ? (
                          <div className="text-sm">
                            <div className="text-purple-600 flex items-center gap-1">
                              <BarChart3 size={14} />
                              {trend.avgDailyUsage.toFixed(1)} {product.unit}/day
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${trend.daysUntilStockout < 3 ? 'text-red-600' :
                              trend.daysUntilStockout < 7 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                              <Target size={14} />
                              {trend.daysUntilStockout < 999 ? `${trend.daysUntilStockout}d left` : 'Stable'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No data</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2 ${stockStatus.color}`}>
                          <StatusIcon size={18} />
                          <span className="font-semibold">{stockStatus.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStock(product)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all"
                            title="Update Stock"
                          >
                            <RefreshCw size={16} />
                            Update
                          </button>
                          <button
                            onClick={() => handleViewHistory(product)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
                            title="View History"
                          >
                            <History size={16} />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Updates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <History className="text-green-600" size={24} />
          Recent Stock Updates
        </h2>
        <div className="space-y-3">
          {stockLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800 font-semibold">{log.productName}</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${log.changeType === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {log.changeType === 'IN' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {log.changeType === 'IN' ? '+' : '-'}{log.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Old: {log.oldStock} → New: {log.newStock}</span>
                    <span className="text-orange-600">{log.reason}</span>
                    {log.remarks && <span className="text-gray-500">({log.remarks})</span>}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-gray-600">{log.updatedBy}</div>
                  <div className="text-gray-400 flex items-center gap-1 justify-end mt-1">
                    <Clock size={12} />
                    {log.dateTime}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="text-orange-600" />
                  Stock Alerts & Recommendations
                </h2>
                <p className="text-gray-500 text-sm mt-1">Auto-generated based on usage patterns</p>
              </div>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {stockAlerts.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle size={48} className="mx-auto mb-4" />
                  <p className="text-xl font-semibold">All stock levels are healthy!</p>
                  <p className="text-gray-500 mt-2">No alerts or recommendations at this time.</p>
                </div>
              ) : (
                stockAlerts.map((alert) => {
                  const product = products.find(p => p.id === alert.productId);
                  const trend = usageTrends.find(t => t.productId === alert.productId);

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-lg p-5 border-2 ${alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${alert.type === 'critical' ? 'bg-red-100 text-red-700' :
                              alert.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                              {alert.type.toUpperCase()}
                            </span>
                            <span className="text-gray-800 text-lg font-bold">{alert.productName}</span>
                          </div>
                          <p className="text-gray-700 font-semibold mb-2">{alert.message}</p>
                          <p className="text-green-600 mb-3">💡 {alert.suggestion}</p>
                          {trend && (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="bg-gray-100 rounded p-2">
                                <div className="text-gray-600">Current Stock</div>
                                <div className="text-gray-800 font-bold">{product?.stock} {product?.unit}</div>
                              </div>
                              <div className="bg-gray-100 rounded p-2">
                                <div className="text-gray-600">Daily Usage</div>
                                <div className="text-gray-800 font-bold">{trend.avgDailyUsage.toFixed(1)} {product?.unit}</div>
                              </div>
                              <div className="bg-gray-100 rounded p-2">
                                <div className="text-gray-600">Suggested Reorder</div>
                                <div className="text-gray-800 font-bold">{trend.reorderSuggestion} {product?.unit}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        {trend && (
                          <button
                            onClick={() => {
                              handleAutoReorder(alert.productId);
                              setShowAlertsModal(false);
                            }}
                            className="ml-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                          >
                            <Zap size={18} />
                            Auto Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdateModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800">Update Stock</h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {isUpdateSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full animate-[bounce_0.5s_ease-out]">
                    <CheckCircle size={48} className="text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-green-600 uppercase tracking-widest animate-pulse mb-2">
                  Updated!
                </h3>
                <p className="text-gray-500 font-medium text-center">
                  Stock successfully updated.<br />
                  <span className="font-bold text-gray-800">
                    {updateForm.updateType === 'IN' ? '+' : '-'}{updateForm.quantity} {selectedProduct.unit}
                  </span>
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">Product</label>
                  <div className="font-bold text-gray-800 text-lg">{selectedProduct.name}</div>
                  <div className="text-gray-500 text-sm">Current Stock: {selectedProduct.stock} {selectedProduct.unit}</div>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm mb-2">Update Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUpdateForm({ ...updateForm, updateType: 'IN' })}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all ${updateForm.updateType === 'IN'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      STOCK IN (+)
                    </button>
                    <button
                      onClick={() => setUpdateForm({ ...updateForm, updateType: 'OUT' })}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all ${updateForm.updateType === 'OUT'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      STOCK OUT (-)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={updateForm.quantity}
                    onChange={(e) => {
                      setUpdateForm({ ...updateForm, quantity: e.target.value });
                      if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: false });
                    }}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.quantity ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                    placeholder="Enter quantity"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm mb-2">Reason *</label>
                  <select
                    value={updateForm.reason}
                    onChange={(e) => {
                      setUpdateForm({ ...updateForm, reason: e.target.value });
                      if (formErrors.reason) setFormErrors({ ...formErrors, reason: false });
                    }}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.reason ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                  >
                    <option value="">Select Reason</option>
                    {reasons[updateForm.updateType].map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm mb-2">Remarks (Optional)</label>
                  <textarea
                    value={updateForm.remarks}
                    onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>

                {updateForm.quantity && (
                  <div className={`border rounded-lg p-3 ${updateForm.updateType === 'IN' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className={`font-semibold ${updateForm.updateType === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      New Stock: {updateForm.updateType === 'IN'
                        ? selectedProduct.stock + parseInt(updateForm.quantity || '0')
                        : selectedProduct.stock - parseInt(updateForm.quantity || '0')
                      } {selectedProduct.unit}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInitiateUpdate}
                    disabled={isUpdateSuccess}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-500 transform ${isUpdateSuccess
                      ? 'bg-green-500 text-white scale-110 ring-4 ring-green-200'
                      : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                      }`}
                  >
                    {isUpdateSuccess ? (
                      <div className="flex flex-col items-center justify-center animate-bounce">
                        <Check size={28} className="mb-1" />
                        <span className="text-xs uppercase tracking-wider font-bold">Updated!</span>
                      </div>
                    ) : (
                      'Update Stock'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Stock History</h2>
                <p className="text-gray-500 mt-1">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {selectedProductHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No stock history found for this product
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">Date & Time</th>
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">Old Stock</th>
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">New Stock</th>
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">Change</th>
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">Reason</th>
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">Remarks</th>
                        <th className="text-left py-3 px-3 text-gray-600 font-bold">Updated By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProductHistory.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 text-gray-600 text-sm flex items-center gap-1">
                            <Clock size={14} />
                            {log.dateTime}
                          </td>
                          <td className="py-3 px-3 text-gray-800">{log.oldStock}</td>
                          <td className="py-3 px-3 text-gray-800 font-bold">{log.newStock}</td>
                          <td className="py-3 px-3">
                            <span className={`flex items-center gap-1 font-semibold ${log.changeType === 'IN' ? 'text-green-400' : 'text-red-400'
                              }`}>
                              {log.changeType === 'IN' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              {log.changeType === 'IN' ? '+' : '-'}{log.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-yellow-400">{log.reason}</td>
                          <td className="py-3 px-3 text-gray-400 text-sm">{log.remarks || '-'}</td>
                          <td className="py-3 px-3 text-blue-200">{log.updatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Select Export Range</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Choose the time period for stock data export:</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExportExcel('daily')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl transition-all hover:scale-105"
              >
                <Clock size={24} className="text-blue-600" />
                <span className="font-semibold text-gray-800">Daily</span>
                <span className="text-xs text-gray-600">Today's Data</span>
              </button>

              <button
                onClick={() => handleExportExcel('weekly')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-xl transition-all hover:scale-105"
              >
                <Calendar size={24} className="text-green-600" />
                <span className="font-semibold text-gray-800">Weekly</span>
                <span className="text-xs text-gray-600">Last 7 Days</span>
              </button>

              <button
                onClick={() => handleExportExcel('monthly')}
                className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl transition-all hover:scale-105"
              >
                <BarChart3 size={24} className="text-purple-600" />
                <span className="font-semibold text-gray-800">Monthly</span>
                <span className="text-xs text-gray-600">Last 30 Days</span>
              </button>

              <button
                onClick={() => handleExportExcel('yearly')}
                className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 rounded-xl transition-all hover:scale-105"
              >
                <TrendingUp size={24} className="text-orange-600" />
                <span className="font-semibold text-gray-800">Yearly</span>
                <span className="text-xs text-gray-600">Last Year</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Glitch Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative bg-gray-900 border-2 border-red-500 text-red-500 p-8 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] w-[400px] overflow-hidden animate-pulse">

            {/* Glitch Overlay Effects */}
            <div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-overlay animate-ping"></div>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ background: 'linear-gradient(to bottom, transparent 50%, #000 50%)', backgroundSize: '100% 4px' }}>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500 relative mb-6">
                <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping opacity-20"></div>
                <RefreshCw size={40} className="text-red-500 animate-spin-slow" />
              </div>

              <h3 className="text-2xl font-black uppercase tracking-widest mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                System Locked
              </h3>
              <p className="text-red-300 text-sm mb-6 font-mono tracking-wider">
                Authentication Required to Modify Stock
              </p>

              <div className="mb-6 relative">
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => {
                    setAuthPassword(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="ENTER PASSWORD"
                  className="w-full bg-black/50 border-2 border-red-500 text-red-500 placeholder-red-800 px-4 py-3 rounded font-mono text-center tracking-[0.2em] focus:outline-none focus:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()}
                />
                {authError && (
                  <p className="text-red-500 font-bold text-xs mt-2 animate-bounce uppercase">
                    Access Denied: Invalid Credentials
                  </p>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono uppercase text-sm tracking-wider"
                >
                  Abort
                </button>
                <button
                  onClick={handleAuthSubmit}
                  className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-all font-mono uppercase text-sm tracking-wider shadow-[4px_4px_0_#991b1b] active:translate-y-1 active:shadow-none relative overflow-hidden group"
                >
                  <span className="relative z-10">Authenticate</span>
                  {/* Button Glitch Effect */}
                  <span className="absolute top-0 left-[-100%] w-full h-full bg-white/20 skew-x-[45deg] group-hover:animate-[shimmer_1s_infinite]"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
