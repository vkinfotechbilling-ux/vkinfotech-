import { useState, useEffect } from 'react';
import { productService, Product } from '../services/ProductService';
import {
  Plus,
  Search,


  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products
  // Load products
  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts().catch(err => {
        console.error("Error fetching products:", err);
        return [];
      });
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load products", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddSuccess, setIsAddSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    price: '',
    stock: '',
    minStock: '',
    unit: 'pcs',
    status: 'Active' as 'Active' | 'Inactive',
    serialNumber: '',
    model: '',
    warranty: '',
    gstRate: '0',
    hsnCode: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  const categories = ['CCTV Access', 'Laptop', 'PC', 'Accessories'];
  const brands = ['Samsung', 'Apple', 'HP', 'Sony', 'Dell', 'LG', 'Lenovo', 'OnePlus'];
  const units = ['pcs', 'box', 'nos'];

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    if (stock <= minStock) return { label: 'Low Stock', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle };
    return { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle };
  };

  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesBrand = !filterBrand || product.brand === filterBrand;
    const matchesStatus = !filterStatus || product.status === filterStatus;

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      category: '',
      description: '',
      price: '',
      stock: '',
      minStock: '',
      unit: 'pcs',
      status: 'Active',
      serialNumber: '',
      model: '',
      warranty: '',
      gstRate: '0',
      hsnCode: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit,
      status: product.status,
      serialNumber: product.serialNumber || '',
      model: product.model || '',
      warranty: product.warranty || '',
      gstRate: (product.gstRate || 0).toString(),
      hsnCode: product.hsnCode || ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const handleDeleteProduct = (product: Product) => {
    setDeleteTarget(product);
    setShowDeleteModal(true);
    setShowDeleteSuccess(false);
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    const success = await productService.deleteProduct(deleteTarget.id);
    if (success) {
      setProducts(products.filter(p => p.id !== deleteTarget.id));
      setIsDeleting(false);
      setShowDeleteSuccess(true);

      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        setShowDeleteSuccess(false);
      }, 2000);
    } else {
      setIsDeleting(false);
      alert('Failed to delete product');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleSaveProduct = async () => {
    // Validation
    const errors: Record<string, boolean> = {};
    if (!formData.name) errors.name = true;
    if (!formData.brand) errors.brand = true;
    if (!formData.category) errors.category = true;
    if (!formData.price) errors.price = true;
    if (!formData.stock) errors.stock = true;
    if (!formData.minStock) errors.minStock = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProduct) {
      // Update existing product
      const updated = await productService.updateProduct(editingProduct.id, {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        unit: formData.unit,
        status: formData.status,
        serialNumber: formData.serialNumber,
        model: formData.model,
        warranty: formData.warranty,
        gstRate: parseFloat(formData.gstRate),
        hsnCode: formData.hsnCode,
        updatedAt: new Date().toISOString().split('T')[0]
      });

      if (updated) {
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
        setIsAddSuccess(true);
        setTimeout(() => {
          setIsAddSuccess(false);
          setShowAddModal(false);
        }, 1500);
      } else {
        alert('Failed to update product');
      }

    } else {
      // Add new product
      const newProduct = await productService.addProduct({
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        unit: formData.unit,
        status: formData.status,
        serialNumber: formData.serialNumber,
        model: formData.model,
        warranty: formData.warranty,
        gstRate: parseFloat(formData.gstRate),
        hsnCode: formData.hsnCode
      });

      if (newProduct) {
        setProducts([...products, newProduct]);
        setIsAddSuccess(true);
        setFormData({
          name: '',
          brand: '',
          category: '',
          description: '',
          price: '',
          stock: '',
          minStock: '',
          unit: 'pcs',
          status: 'Active',
          serialNumber: '',
          model: '',
          warranty: '',
          gstRate: '0',
          hsnCode: ''
        });
        setTimeout(() => {
          setIsAddSuccess(false);
          setShowAddModal(false);
        }, 1500);
      } else {
        alert('Failed to add product');
      }
    }
  };

  // ... (rest of the file until the button)


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

    // Filter products by updated date
    const filteredProducts = products.filter(p => {
      const updateDate = new Date(p.updatedAt);
      return updateDate >= filterDate;
    });

    const rangeLabel = dateRange === 'daily' ? 'Today' :
      dateRange === 'weekly' ? 'Last_7_Days' :
        dateRange === 'monthly' ? 'Last_30_Days' : 'Last_Year';

    const ws = XLSX.utils.json_to_sheet(filteredProducts.map(p => ({
      'Product ID': p.id,
      'Name': p.name,
      'Brand': p.brand,
      'Category': p.category,
      'Description': p.description,
      'Price': p.price,
      'Stock': p.stock,
      'Min Stock': p.minStock,
      'Unit': p.unit,
      'Status': p.status,
      'Created': p.createdAt,
      'Updated': p.updatedAt
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");

    const filename = `VK_INFOTECH_PRODUCTS_${rangeLabel}.xlsx`;
    XLSX.writeFile(wb, filename);
    setShowExportModal(false);
  };



  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products Management</h1>
          <p className="text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <div className="flex gap-3">

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
          >
            <FileSpreadsheet size={20} />
            Excel
          </button>
          <button
            onClick={() => loadProducts()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
            title="Refresh Data"
          >
            <Clock size={20} />
            Refresh
          </button>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <p className="text-gray-800 text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">In Stock</p>
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
              <p className="text-gray-500 text-sm">Low Stock</p>
              <p className="text-gray-800 text-2xl font-bold">
                {products.filter(p => p.stock > 0 && p.stock <= p.minStock).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Out of Stock</p>
              <p className="text-gray-800 text-2xl font-bold">
                {products.filter(p => p.stock === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name, brand, or ID..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-4 text-gray-600 font-bold">ID</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Product Name</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Brand</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Category</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Price</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Stock</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Status</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Branch</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Created By</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Updated</th>
                <th className="text-left py-4 px-4 text-gray-600 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-gray-100 rounded-full mb-3">
                        <Package size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-800 font-bold text-lg">
                        {searchTerm || filterCategory || filterBrand || filterStatus
                          ? 'No products match your filters'
                          : 'Your inventory is currently empty'}
                      </p>
                      <p className="text-gray-500 max-w-xs mt-1">
                        {searchTerm || filterCategory || filterBrand || filterStatus
                          ? 'Try adjusting your search or filters to find what you are looking for.'
                          : 'Get started by adding your first product to the inventory.'}
                      </p>
                      {(searchTerm || filterCategory || filterBrand || filterStatus) && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterCategory('');
                            setFilterBrand('');
                            setFilterStatus('');
                          }}
                          className="mt-4 text-green-600 font-bold hover:underline"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  const StatusIcon = stockStatus.icon;

                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-semibold">{product.id}</td>
                      <td className="py-3 px-4">
                        <p className="text-gray-800 font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-gray-500 text-xs">{product.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{product.brand}</td>
                      <td className="py-3 px-4 text-gray-600">{product.category}</td>
                      <td className="py-3 px-4 text-gray-800 font-semibold">₹{product.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-semibold">{product.stock}</span>
                          <span className="text-gray-500 text-xs">{product.unit}</span>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${stockStatus.color.replace('text-green-400', 'text-green-600').replace('text-yellow-400', 'text-yellow-600').replace('text-red-400', 'text-red-600')}`}>
                          <StatusIcon size={14} />
                          <span className="text-xs">{stockStatus.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${product.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                          {product.branch || 'Main'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {product.createdBy || 'System'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{product.updatedAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {isAddSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full animate-[bounce_0.5s_ease-out]">
                    <CheckCircle size={48} className="text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-green-600 uppercase tracking-widest animate-pulse mb-2">
                  {editingProduct ? 'Updated!' : 'Added!'}
                </h3>
                <p className="text-gray-500 font-medium mb-6">
                  Product successfully {editingProduct ? 'updated' : 'added'} to inventory.
                </p>
                <button
                  onClick={() => {
                    setIsAddSuccess(false);
                    setShowAddModal(false);
                  }}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Basic Details */}
                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-4">Basic Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.name ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Brand *</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => {
                          setFormData({ ...formData, brand: e.target.value });
                          if (formErrors.brand) setFormErrors({ ...formErrors, brand: false });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.brand ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                        placeholder="Enter brand name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          if (formErrors.category) setFormErrors({ ...formErrors, category: false });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.category ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-600 text-sm mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={2}
                        placeholder="Product description (optional)"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-4">Pricing Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Price *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => {
                          setFormData({ ...formData, price: e.target.value });
                          if (formErrors.price) setFormErrors({ ...formErrors, price: false });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.price ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Extended Details */}
                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-4">Extended Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Serial Number</label>
                      <input
                        type="text"
                        value={formData.serialNumber || ''}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Model Number</label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Warranty Period</label>
                      <input
                        type="text"
                        value={formData.warranty || ''}
                        onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g. 1 Year"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">GST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.gstRate}
                        onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">HSN Code</label>
                      <input
                        type="text"
                        value={formData.hsnCode}
                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="HSN Code"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Details */}
                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-4">Stock Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Opening Stock *</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => {
                          setFormData({ ...formData, stock: e.target.value });
                          if (formErrors.stock) setFormErrors({ ...formErrors, stock: false });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.stock ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-2">Minimum Stock Level *</label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => {
                          setFormData({ ...formData, minStock: e.target.value });
                          if (formErrors.minStock) setFormErrors({ ...formErrors, minStock: false });
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${formErrors.minStock ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-bold text-green-600 mb-4">Product Status</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-800">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                        className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                      />
                      <span className="text-gray-800">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </div>
            )}
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

            <p className="text-gray-600 mb-6">Choose the time period for product data export:</p>

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
      {/* Custom Glitch Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`relative bg-gray-900 border-2 border-red-500 text-red-500 p-8 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] w-[400px] text-center overflow-hidden
            ${isDeleting ? 'animate-pulse' : ''}`}>

            {/* Glitch Overlay Effects */}
            {isDeleting && (
              <div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-overlay animate-ping"></div>
            )}

            {!showDeleteSuccess ? (
              <>
                <div className="mb-6 relative">
                  <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500 relative">
                    <Trash2 size={40} className={`text-red-500 ${isDeleting ? 'animate-bounce' : ''}`} />
                    {isDeleting && (
                      <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping opacity-20"></div>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-widest mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                  Confirm Deletion
                </h3>
                <p className="text-red-300 text-sm mb-8 font-mono">
                  Are you sure you want to eliminate <br />
                  <span className="font-bold text-white bg-red-600 px-1">{deleteTarget?.name}</span>?
                  <br /> This action is <span className="underline decoration-wavy">irreversible</span>.
                </p>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono uppercase text-sm tracking-wider"
                  >
                    Abort
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-all font-mono uppercase text-sm tracking-wider shadow-[4px_4px_0_#991b1b] active:translate-y-1 active:shadow-none relative overflow-hidden group"
                  >
                    {isDeleting ? 'Purging...' : 'Execute'}
                    {/* Button Glitch Effect */}
                    <span className="absolute top-0 left-[-100%] w-full h-full bg-white/20 skew-x-[45deg] group-hover:animate-[shimmer_1s_infinite]"></span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full animate-[bounce_0.5s_ease-out]">
                    <CheckCircle size={48} className="text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-green-500 uppercase tracking-widest animate-pulse">
                  Deleted
                </h3>
                <p className="text-green-300 font-mono text-sm mt-2">Target successfully removed.</p>
              </div>
            )}

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ background: 'linear-gradient(to bottom, transparent 50%, #000 50%)', backgroundSize: '100% 4px' }}>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
