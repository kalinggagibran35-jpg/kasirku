import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CalendarClock,
  CreditCard,
  Printer,
  X,
  Tag,
  Check,
} from 'lucide-react';
import type { Product, CartItem, TransactionType } from '../types';
import { getActiveProducts, addTransaction, getCurrentUser, formatCurrency, getStoreSettings } from '../store';
import ProductImage from '../components/ProductImage';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [rentalDays, setRentalDays] = useState(1);
  const [deposit, setDeposit] = useState('');
  const [notes, setNotes] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState('');

  useEffect(() => {
    setProducts(getActiveProducts());
  }, []);

  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.color.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'Semua' || p.category === categoryFilter;
      return matchSearch && matchCategory && p.stock > 0;
    });
  }, [products, search, categoryFilter]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.type === transactionType);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item =>
          item.product.id === product.id && item.type === transactionType
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: calculateSubtotal(product, item.quantity + 1, transactionType, item.rental_days, item.discount_percent),
              }
            : item
        );
      }
      const price = transactionType === 'sale' ? product.price_sell : product.price_rent;
      const discount = product.discount_percent;
      const subtotal = price * (1 - discount / 100);
      return [...prev, {
        product,
        quantity: 1,
        type: transactionType,
        rental_days: transactionType === 'rental' ? rentalDays : 0,
        discount_percent: discount,
        subtotal,
      }];
    });
  };

  const calculateSubtotal = (product: Product, qty: number, type: TransactionType, days: number, discount: number) => {
    const price = type === 'sale' ? product.price_sell : product.price_rent * days;
    return price * qty * (1 - discount / 100);
  };

  const updateQuantity = (productId: string, type: TransactionType, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId && item.type === type) {
          const newQty = Math.max(1, Math.min(item.product.stock, item.quantity + delta));
          return {
            ...item,
            quantity: newQty,
            subtotal: calculateSubtotal(item.product, newQty, item.type, item.rental_days, item.discount_percent),
          };
        }
        return item;
      })
    );
  };

  const updateRentalDays = (productId: string, days: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId && item.type === 'rental') {
          const d = Math.max(1, days);
          return {
            ...item,
            rental_days: d,
            subtotal: calculateSubtotal(item.product, item.quantity, 'rental', d, item.discount_percent),
          };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, type: TransactionType, discount: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId && item.type === type) {
          const d = Math.min(100, Math.max(0, discount));
          return {
            ...item,
            discount_percent: d,
            subtotal: calculateSubtotal(item.product, item.quantity, item.type, item.rental_days, d),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, type: TransactionType) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.type === type)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = cart.reduce((sum, item) => {
    const price = item.type === 'sale' ? item.product.price_sell : item.product.price_rent * item.rental_days;
    return sum + (price * item.quantity * item.discount_percent / 100);
  }, 0);

  const hasRental = cart.some(item => item.type === 'rental');

  const processPayment = () => {
    const user = getCurrentUser();
    if (!user) return;

    const payment = Number(paymentAmount);
    if (payment < cartTotal) return;

    const rentalStart = new Date();
    const maxDays = Math.max(...cart.filter(i => i.type === 'rental').map(i => i.rental_days), 0);
    const rentalEnd = new Date(rentalStart);
    rentalEnd.setDate(rentalEnd.getDate() + maxDays);

    const transaction = addTransaction({
      type: hasRental ? 'rental' : 'sale',
      items: cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        type: item.type,
        price: item.type === 'sale' ? item.product.price_sell : item.product.price_rent,
        rental_days: item.rental_days,
        discount_percent: item.discount_percent,
        subtotal: item.subtotal,
      })),
      subtotal: cartTotal + discountTotal,
      discount_total: discountTotal,
      total: cartTotal,
      payment_amount: payment,
      change_amount: payment - cartTotal,
      customer_name: customerName,
      customer_phone: customerPhone,
      cashier_id: user.id,
      cashier_name: user.name,
      status: hasRental ? 'pending' : 'completed',
      rental_start: hasRental ? rentalStart.toISOString() : undefined,
      rental_end: hasRental ? rentalEnd.toISOString() : undefined,
      rental_status: hasRental ? 'active' : undefined,
      deposit: hasRental ? Number(deposit) || 0 : undefined,
      notes,
    });

    setLastTransactionId(transaction.id);
    setShowPayment(false);
    setShowReceipt(true);
    setProducts(getActiveProducts());
  };

  const resetAll = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentAmount('');
    setDeposit('');
    setNotes('');
    setShowReceipt(false);
    setLastTransactionId('');
  };

  const colorMap: Record<string, string> = {
    'Baju Bodo': 'bg-primary-100 text-primary-700',
    'Baju Bodo Anak': 'bg-pink-100 text-pink-700',
    'Sarung': 'bg-amber-100 text-amber-700',
    'Aksesori': 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Kasir / POS</h1>
          <p className="text-gray-500 mt-1">Proses penjualan dan penyewaan baju bodo</p>
        </div>
        {/* Transaction Type Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTransactionType('sale')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              transactionType === 'sale' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingCart size={16} /> Jual
          </button>
          <button
            onClick={() => setTransactionType('rental')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              transactionType === 'rental' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarClock size={16} /> Sewa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Products Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filter */}
          <div className="card !p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari produk..."
                  className="input-field pl-11"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-primary-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {transactionType === 'rental' && (
              <div className="mt-3 flex items-center gap-3 bg-purple-50 px-4 py-2.5 rounded-xl">
                <CalendarClock size={16} className="text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">Default durasi sewa:</span>
                <input
                  type="number"
                  min="1"
                  value={rentalDays}
                  onChange={e => setRentalDays(Math.max(1, Number(e.target.value)))}
                  className="w-20 px-3 py-1.5 rounded-lg border border-purple-200 text-center text-sm font-semibold focus:ring-2 focus:ring-purple-300 outline-none"
                />
                <span className="text-sm text-purple-600">hari</span>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="card !p-0 overflow-hidden text-left hover:shadow-lg hover:border-primary-200 transition-all group cursor-pointer active:scale-[0.98]"
              >
                {/* Product Image */}
                <div className="relative">
                  <ProductImage
                    src={product.image_url}
                    name={product.name}
                    color={product.color}
                    category={product.category}
                    size="xl"
                    rounded="rounded-none"
                    className="!h-36"
                  />
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className={`badge text-xs ${colorMap[product.category] || 'bg-gray-100 text-gray-600'} shadow-sm`}>
                      {product.category}
                    </span>
                    {product.discount_percent > 0 && (
                      <span className="badge bg-red-500 text-white text-xs flex items-center gap-1 shadow-sm">
                        <Tag size={10} /> -{product.discount_percent}%
                      </span>
                    )}
                  </div>
                  {/* Add button overlay */}
                  <div className="absolute bottom-2 right-2">
                    <div className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shadow-lg">
                      <Plus size={18} />
                    </div>
                  </div>
                  {/* Stock indicator */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shadow-sm ${
                      product.stock <= 3 ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-700'
                    }`}>
                      Stok: {product.stock}
                    </span>
                  </div>
                </div>
                {/* Product Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary-700 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {product.size} • {product.color}
                  </div>
                  <div className="mt-2">
                    {transactionType === 'sale' ? (
                      <div>
                        {product.discount_percent > 0 && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatCurrency(product.price_sell)}
                          </p>
                        )}
                        <p className="text-base font-bold text-primary-700">
                          {formatCurrency(product.price_sell * (1 - product.discount_percent / 100))}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-base font-bold text-purple-700">
                          {formatCurrency(product.price_rent)}
                          <span className="text-xs font-normal text-gray-400">/hari</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 font-medium">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="lg:col-span-2">
          <div className="card sticky top-4 !p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 p-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <ShoppingCart size={20} /> Keranjang
                </h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                  {cart.length} item
                </span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="text-gray-500 font-medium">Keranjang masih kosong</p>
                  <p className="text-sm text-gray-400 mt-1">Pilih produk untuk menambahkan</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={`${item.product.id}-${item.type}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Cart item thumbnail */}
                      <ProductImage
                        src={item.product.image_url}
                        name={item.product.name}
                        color={item.product.color}
                        category={item.product.category}
                        size="xs"
                        rounded="rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.type === 'sale' ? '🛒 Jual' : '📅 Sewa'}
                          {item.type === 'rental' && ` • ${item.rental_days} hari`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.type)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center bg-gray-100 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.type, -1)}
                          className="p-1.5 rounded-l-lg hover:bg-gray-200 text-gray-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-semibold min-w-[32px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.type, 1)}
                          className="p-1.5 rounded-r-lg hover:bg-gray-200 text-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {item.type === 'rental' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={item.rental_days}
                            onChange={e => updateRentalDays(item.product.id, Number(e.target.value))}
                            className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-center text-xs font-semibold"
                          />
                          <span className="text-xs text-gray-400">hr</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Tag size={12} className="text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_percent}
                          onChange={e => updateItemDiscount(item.product.id, item.type, Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-center text-xs font-semibold"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                      <p className="ml-auto text-sm font-bold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-5 space-y-4">
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <span className="text-red-500 font-semibold">-{formatCurrency(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">TOTAL</span>
                  <span className="text-2xl font-bold text-primary-700">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCart([])}
                    className="btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Kosongkan
                  </button>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="btn-primary text-sm flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} /> Bayar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">💳 Pembayaran</h2>
              <button onClick={() => setShowPayment(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Pelanggan</label>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="input-field"
                    placeholder="Nama pelanggan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Telepon</label>
                  <input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="input-field"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
              {hasRental && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deposit Sewa</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={e => setDeposit(e.target.value)}
                    className="input-field"
                    placeholder="Jumlah deposit"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>

              {/* Cart items summary with images */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ringkasan Item</p>
                {cart.map(item => (
                  <div key={`${item.product.id}-${item.type}`} className="flex items-center gap-3 bg-white rounded-lg p-2">
                    <ProductImage
                      src={item.product.image_url}
                      name={item.product.name}
                      color={item.product.color}
                      category={item.product.category}
                      size="xs"
                      rounded="rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity}x • {item.type === 'sale' ? 'Jual' : `Sewa ${item.rental_days}hr`}
                        {item.discount_percent > 0 && ` • -${item.discount_percent}%`}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-gray-800">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({cart.length} item)</span>
                    <span className="font-medium">{formatCurrency(cartTotal + discountTotal)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Diskon</span>
                      <span className="text-red-500 font-medium">-{formatCurrency(discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Bayar</span>
                    <span className="text-primary-700">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah Bayar</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="input-field text-xl font-bold text-center"
                  placeholder="0"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[cartTotal, Math.ceil(cartTotal / 50000) * 50000, Math.ceil(cartTotal / 100000) * 100000].map(
                    (amount, i) => (
                      <button
                        key={i}
                        onClick={() => setPaymentAmount(amount.toString())}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
                      >
                        {formatCurrency(amount)}
                      </button>
                    )
                  )}
                </div>
              </div>
              {Number(paymentAmount) >= cartTotal && Number(paymentAmount) > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-600">Kembalian</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(Number(paymentAmount) - cartTotal)}
                  </p>
                </div>
              )}
              <button
                onClick={processPayment}
                disabled={Number(paymentAmount) < cartTotal || cart.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={20} /> Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 text-center border-b border-dashed border-gray-300" id="receipt">
              {(() => {
                const ss = getStoreSettings();
                return (
                  <>
                    {ss.store_logo ? (
                      <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-2">
                        <img src={ss.store_logo} alt="Logo" className="w-full h-full object-contain p-1" />
                      </div>
                    ) : (
                      <div className="text-4xl mb-2">👗</div>
                    )}
                    <h2 className="text-xl font-bold text-gray-900">{ss.store_name || 'Baju Bodo'}</h2>
                    <p className="text-xs text-gray-500">{ss.store_subtitle || 'Jual Beli & Penyewaan Baju Tradisional Bugis Makassar'}</p>
                    {ss.store_address && <p className="text-xs text-gray-400 mt-0.5">{ss.store_address}</p>}
                    {ss.store_phone && <p className="text-xs text-gray-400">Tel: {ss.store_phone}</p>}
                  </>
                );
              })()}
              <div className="border-t border-dashed border-gray-300 mt-4 pt-4">
                <p className="text-sm font-mono text-gray-600">ID: {lastTransactionId}</p>
                <p className="text-sm text-gray-500">{new Date().toLocaleString('id-ID')}</p>
                {customerName && <p className="text-sm text-gray-600 mt-1">Pelanggan: {customerName}</p>}
              </div>
              <div className="mt-4 space-y-2 text-left">
                {cart.map(item => (
                  <div key={`${item.product.id}-${item.type}`} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity}x {item.type === 'sale'
                          ? formatCurrency(item.product.price_sell)
                          : `${formatCurrency(item.product.price_rent)}/hr × ${item.rental_days}hr`}
                        {item.discount_percent > 0 && ` (-${item.discount_percent}%)`}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-4">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 mt-4 pt-4 space-y-1">
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <span className="text-red-500 font-medium">-{formatCurrency(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bayar</span>
                  <span>{formatCurrency(Number(paymentAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kembali</span>
                  <span>{formatCurrency(Number(paymentAmount) - cartTotal)}</span>
                </div>
              </div>
              <p className="mt-6 text-xs text-gray-400">{getStoreSettings().receipt_footer || 'Terima kasih atas kunjungan Anda! 🙏'}</p>
            </div>
            <div className="p-4 flex gap-3">
              <button onClick={() => window.print()} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Printer size={16} /> Cetak
              </button>
              <button onClick={resetAll} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Check size={16} /> Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
