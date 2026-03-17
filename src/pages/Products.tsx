import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Tag,
  Package,
  Save,
  Grid3X3,
  List,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import type { Product } from '../types';
import { getProducts, addProduct, updateProduct, deleteProduct, formatCurrency, getCurrentUser } from '../store';
import ProductImage, { ImageUpload } from '../components/ProductImage';
import ExcelImport from '../components/ExcelImport';
import { downloadTemplate, exportProducts } from '../utils/excel';

const categories = ['Baju Bodo', 'Baju Bodo Anak', 'Sarung', 'Aksesori'];
const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'All Size', 'Anak', '-'];

const emptyForm: Omit<Product, 'id' | 'created_at'> = {
  name: '',
  category: 'Baju Bodo',
  description: '',
  price_sell: 0,
  price_rent: 0,
  stock: 0,
  size: 'M',
  color: '',
  discount_percent: 0,
  image_url: '',
  active: true,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showExcelModal, setShowExcelModal] = useState(false);

  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.color.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'Semua' || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price_sell: product.price_sell,
      price_rent: product.price_rent,
      stock: product.stock,
      size: product.size,
      color: product.color,
      discount_percent: product.discount_percent,
      image_url: product.image_url,
      active: product.active,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || form.price_sell <= 0) return;
    if (editId) {
      updateProduct(editId, form);
    } else {
      addProduct(form);
    }
    setProducts(getProducts());
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setProducts(getProducts());
    setDeleteConfirm(null);
  };

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const allCategories = ['Semua', ...categories];

  const colorMap: Record<string, string> = {
    'Baju Bodo': 'bg-primary-100 text-primary-700',
    'Baju Bodo Anak': 'bg-pink-100 text-pink-700',
    'Sarung': 'bg-amber-100 text-amber-700',
    'Aksesori': 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Produk</h1>
          <p className="text-gray-500 mt-1">Kelola inventori baju bodo dan aksesori</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List size={18} />
            </button>
          </div>
          {isAdmin && (
            <>
              {/* Excel Buttons */}
              <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
                <button
                  onClick={() => downloadTemplate()}
                  className="p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  title="Download Template Excel"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setShowExcelModal(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  title="Import dari Excel"
                >
                  <Upload size={18} />
                </button>
                <button
                  onClick={() => exportProducts(products)}
                  className="p-2 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                  title="Export ke Excel"
                >
                  <FileSpreadsheet size={18} />
                </button>
              </div>
              <button onClick={openAdd} className="btn-primary flex items-center gap-2">
                <Plus size={18} /> Tambah Produk
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="input-field pl-11"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                catFilter === cat ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <div key={product.id} className="card !p-0 overflow-hidden group hover:shadow-lg transition-all duration-300">
              {/* Product Image */}
              <div className="relative">
                <ProductImage
                  src={product.image_url}
                  name={product.name}
                  color={product.color}
                  category={product.category}
                  size="xl"
                  rounded="rounded-none"
                />
                {/* Overlay badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className={`badge ${colorMap[product.category] || 'bg-gray-100 text-gray-600'} shadow-sm`}>
                    {product.category}
                  </span>
                  {product.discount_percent > 0 && (
                    <span className="badge bg-red-500 text-white shadow-sm flex items-center gap-1">
                      <Tag size={10} /> -{product.discount_percent}%
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={product.active ? 'badge-success shadow-sm' : 'badge-danger shadow-sm'}>
                    {product.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                {/* Admin edit overlay */}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-3 bg-white rounded-xl text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="p-3 bg-white rounded-xl text-red-600 hover:bg-red-50 transition-colors shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900 leading-snug">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{product.size} • {product.color}</p>
                </div>
                {product.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {product.discount_percent > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(product.price_sell)}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary-700">
                      {formatCurrency(product.price_sell * (1 - product.discount_percent / 100))}
                    </p>
                    <p className="text-xs text-purple-600 font-medium">
                      Sewa: {formatCurrency(product.price_rent)}/hari
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${product.stock <= 3 ? 'text-red-600' : product.stock <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {product.stock}
                    </span>
                    <p className="text-xs text-gray-400">stok</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-500 font-medium">Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>
      ) : (
        /* LIST/TABLE VIEW */
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-4 rounded-tl-2xl">Produk</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Ukuran</th>
                  <th className="px-5 py-4">Harga Jual</th>
                  <th className="px-5 py-4">Harga Sewa</th>
                  <th className="px-5 py-4">Stok</th>
                  <th className="px-5 py-4">Diskon</th>
                  <th className="px-5 py-4">Status</th>
                  {isAdmin && <th className="px-5 py-4 rounded-tr-2xl">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={product.image_url}
                          name={product.name}
                          color={product.color}
                          category={product.category}
                          size="sm"
                          rounded="rounded-lg"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{product.color}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${colorMap[product.category] || 'bg-gray-100 text-gray-600'}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{product.size}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(product.price_sell)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-purple-700">
                      {formatCurrency(product.price_rent)}<span className="text-xs text-gray-400 font-normal">/hr</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold ${product.stock <= 3 ? 'text-red-600' : product.stock <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {product.discount_percent > 0 ? (
                        <span className="badge bg-red-100 text-red-600 flex items-center gap-1 w-fit">
                          <Tag size={10} /> {product.discount_percent}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={product.active ? 'badge-success' : 'badge-danger'}>
                        {product.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="px-5 py-16 text-center">
                      <div className="text-5xl mb-3">📦</div>
                      <p className="text-gray-500 font-medium">Tidak ada produk ditemukan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 flex items-center justify-between">
            <span>Total: {filtered.length} produk</span>
            {isAdmin && (
              <button
                onClick={() => exportProducts(products)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer count for grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span>Menampilkan {filtered.length} produk</span>
          {isAdmin && (
            <button
              onClick={() => exportProducts(products)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package size={22} /> {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Image Upload */}
                <div className="lg:col-span-2">
                  <ImageUpload
                    value={form.image_url}
                    onChange={(val) => updateField('image_url', val)}
                    productName={form.name}
                    productColor={form.color}
                    productCategory={form.category}
                  />
                </div>

                {/* Right: Form Fields */}
                <div className="lg:col-span-3 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Produk *</label>
                    <input
                      value={form.name}
                      onChange={e => updateField('name', e.target.value)}
                      className="input-field"
                      placeholder="Contoh: Baju Bodo Merah Maroon"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                      <select
                        value={form.category}
                        onChange={e => updateField('category', e.target.value)}
                        className="input-field"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ukuran</label>
                      <select
                        value={form.size}
                        onChange={e => updateField('size', e.target.value)}
                        className="input-field"
                      >
                        {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Warna</label>
                      <input
                        value={form.color}
                        onChange={e => updateField('color', e.target.value)}
                        className="input-field"
                        placeholder="Contoh: Merah Maroon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok</label>
                      <input
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={e => updateField('stock', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Jual (Rp) *</label>
                      <input
                        type="number"
                        min="0"
                        value={form.price_sell}
                        onChange={e => updateField('price_sell', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Sewa/Hari (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.price_rent}
                        onChange={e => updateField('price_rent', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Diskon (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.discount_percent}
                        onChange={e => updateField('discount_percent', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                      <select
                        value={form.active ? 'true' : 'false'}
                        onChange={e => updateField('active', e.target.value === 'true')}
                        className="input-field"
                      >
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description - full width */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Deskripsi produk..."
                />
              </div>

              {form.discount_percent > 0 && (
                <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
                  <Tag size={18} className="text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Harga setelah diskon:</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(form.price_sell * (1 - form.discount_percent / 100))}
                      <span className="text-sm text-gray-400 line-through ml-2">{formatCurrency(form.price_sell)}</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Batal
                </button>
                <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save size={18} /> {editId ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900">Hapus Produk?</h3>
            <p className="text-sm text-gray-500 mt-2">Produk yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelModal && (
        <ExcelImport
          onClose={() => setShowExcelModal(false)}
          onImportDone={() => setProducts(getProducts())}
        />
      )}
    </div>
  );
}
