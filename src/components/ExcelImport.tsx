import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileDown,
  ArrowRight,
  Loader2,
  Info,
  Check,
} from 'lucide-react';
// types used by excel utils
import { downloadTemplate, exportProducts, parseExcelFile, type ImportResult, type ImportRow } from '../utils/excel';
import { addProduct, getProducts, formatCurrency } from '../store';

interface ExcelImportProps {
  onClose: () => void;
  onImportDone: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function ExcelImport({ onClose, onImportDone }: ExcelImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [importOnlyValid, setImportOnlyValid] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setFileName(file.name);

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError('Format file tidak didukung. Gunakan file .xlsx, .xls, atau .csv');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file terlalu besar (maks 10MB).');
      return;
    }

    try {
      const result = await parseExcelFile(file);
      setImportResult(result);
      setStep('preview');
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleRowExpand = (rowNum: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum);
      else next.add(rowNum);
      return next;
    });
  };

  const removeRow = (rowNum: number) => {
    if (!importResult) return;
    const filtered = importResult.rows.filter(r => r.rowNumber !== rowNum);
    setImportResult({
      rows: filtered,
      totalRows: filtered.length,
      validRows: filtered.filter(r => r.isValid).length,
      errorRows: filtered.filter(r => !r.isValid).length,
      warningRows: filtered.filter(r => r.isValid && r.warnings.length > 0).length,
    });
  };

  const handleImport = async () => {
    if (!importResult) return;

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    const rowsToImport = importOnlyValid
      ? importResult.rows.filter(r => r.isValid)
      : importResult.rows;

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i];

      if (!row.isValid && importOnlyValid) {
        skipped++;
      } else {
        try {
          addProduct(row.data);
          imported++;
        } catch {
          skipped++;
        }
      }

      setImportProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
      setImportedCount(imported);
      setSkippedCount(skipped);

      // Small delay for visual feedback
      if (rowsToImport.length > 10) {
        await new Promise(r => setTimeout(r, 30));
      }
    }

    setStep('done');
  };

  const handleExport = () => {
    const products = getProducts();
    exportProducts(products);
  };

  const renderStatusBadge = (row: ImportRow) => {
    if (!row.isValid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle size={12} /> Error
        </span>
      );
    }
    if (row.warnings.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <AlertTriangle size={12} /> Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={12} /> OK
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <FileSpreadsheet size={22} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import / Export Produk</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 'upload' && 'Upload file Excel untuk menambahkan produk secara massal'}
                {step === 'preview' && `Preview ${importResult?.totalRows || 0} produk dari "${fileName}"`}
                {step === 'importing' && 'Sedang mengimport produk...'}
                {step === 'done' && 'Import selesai!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => downloadTemplate()}
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group text-left"
                >
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors shrink-0">
                    <Download size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">Download Template</p>
                    <p className="text-xs text-blue-600 mt-0.5">File Excel template dengan panduan lengkap</p>
                  </div>
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all group text-left"
                >
                  <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors shrink-0">
                    <FileDown size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">Export Produk</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Download semua produk ke file Excel</p>
                  </div>
                </button>
              </div>

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                  dragOver
                    ? 'border-primary-500 bg-primary-50 scale-[1.01]'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  dragOver ? 'bg-primary-200' : 'bg-gray-100'
                }`}>
                  <Upload size={28} className={dragOver ? 'text-primary-600' : 'text-gray-400'} />
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  {dragOver ? 'Lepaskan file di sini' : 'Seret & lepas file Excel di sini'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  atau klik untuk memilih file
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Format: .xlsx, .xls, .csv • Maks 10MB • Maks 500 produk
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Gagal membaca file</p>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Guide Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-xs text-amber-700">
                    <p className="font-semibold text-sm text-amber-800">Panduan Import:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Download <strong>Template Excel</strong> terlebih dahulu</li>
                      <li>Isi data produk sesuai format (lihat sheet "Panduan")</li>
                      <li>Hapus baris contoh, lalu isi dengan data Anda</li>
                      <li>Upload file yang sudah diisi</li>
                      <li>Preview & koreksi data, lalu klik Import</li>
                    </ol>
                    <p className="text-amber-600">
                      💡 Kolom wajib: <strong>Nama Produk, Kategori, Harga Jual, Stok</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && importResult && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{importResult.totalRows}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Baris</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{importResult.validRows}</p>
                  <p className="text-xs text-emerald-600 mt-1">✓ Valid</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.errorRows}</p>
                  <p className="text-xs text-red-600 mt-1">✗ Error</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{importResult.warningRows}</p>
                  <p className="text-xs text-amber-600 mt-1">⚠ Warning</p>
                </div>
              </div>

              {/* Import Options */}
              {importResult.errorRows > 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <Info size={18} className="text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-700">
                      Ada <strong>{importResult.errorRows} baris dengan error</strong>.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={importOnlyValid}
                      onChange={e => setImportOnlyValid(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-blue-700 font-medium">Lewati baris error</span>
                  </label>
                </div>
              )}

              {/* Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[45vh]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-12">#</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Nama Produk</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Kategori</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Harga Jual</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Harga Sewa</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">Stok</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">Ukuran</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">Diskon</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importResult.rows.map((row) => (
                        <tr key={row.rowNumber}>
                          {/* Row number */}
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-gray-400 font-mono">{row.rowNumber}</span>
                          </td>
                          {/* Status */}
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => (row.errors.length > 0 || row.warnings.length > 0) && toggleRowExpand(row.rowNumber)}
                              className="flex items-center gap-1"
                            >
                              {renderStatusBadge(row)}
                              {(row.errors.length > 0 || row.warnings.length > 0) && (
                                expandedRows.has(row.rowNumber)
                                  ? <ChevronUp size={12} className="text-gray-400" />
                                  : <ChevronDown size={12} className="text-gray-400" />
                              )}
                            </button>
                            {/* Expanded errors/warnings */}
                            {expandedRows.has(row.rowNumber) && (
                              <div className="mt-2 space-y-1">
                                {row.errors.map((err, i) => (
                                  <p key={`e${i}`} className="text-xs text-red-600 flex items-start gap-1">
                                    <AlertCircle size={11} className="shrink-0 mt-0.5" /> {err}
                                  </p>
                                ))}
                                {row.warnings.map((warn, i) => (
                                  <p key={`w${i}`} className="text-xs text-amber-600 flex items-start gap-1">
                                    <AlertTriangle size={11} className="shrink-0 mt-0.5" /> {warn}
                                  </p>
                                ))}
                              </div>
                            )}
                          </td>
                          {/* Name */}
                          <td className={`px-3 py-2.5 font-medium ${row.isValid ? 'text-gray-900' : 'text-red-700'}`}>
                            {row.data.name || <span className="text-red-400 italic">kosong</span>}
                            {row.data.color && (
                              <span className="block text-xs text-gray-400 font-normal">{row.data.color}</span>
                            )}
                          </td>
                          {/* Category */}
                          <td className="px-3 py-2.5 text-xs text-gray-600">
                            {row.data.category || <span className="text-red-400 italic">kosong</span>}
                          </td>
                          {/* Price Sell */}
                          <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-900">
                            {row.data.price_sell > 0 ? formatCurrency(row.data.price_sell) : <span className="text-red-400">Rp 0</span>}
                          </td>
                          {/* Price Rent */}
                          <td className="px-3 py-2.5 text-right text-xs text-purple-600">
                            {formatCurrency(row.data.price_rent)}/hr
                          </td>
                          {/* Stock */}
                          <td className="px-3 py-2.5 text-center text-xs">
                            <span className={`font-semibold ${row.data.stock === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                              {row.data.stock}
                            </span>
                          </td>
                          {/* Size */}
                          <td className="px-3 py-2.5 text-center text-xs text-gray-600">{row.data.size}</td>
                          {/* Discount */}
                          <td className="px-3 py-2.5 text-center text-xs">
                            {row.data.discount_percent > 0 ? (
                              <span className="text-red-600 font-semibold">{row.data.discount_percent}%</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => removeRow(row.rowNumber)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Hapus baris"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importResult.rows.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">Semua baris telah dihapus. Tidak ada yang akan diimport.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <Loader2 size={56} className="text-primary-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-700">{importProgress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">Mengimport produk...</p>
                <p className="text-sm text-gray-500 mt-1">
                  {importedCount} produk berhasil diimport
                  {skippedCount > 0 && `, ${skippedCount} dilewati`}
                </p>
              </div>
              <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check size={40} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">Import Berhasil! 🎉</p>
                <p className="text-gray-500 mt-2">
                  <strong className="text-emerald-600">{importedCount} produk</strong> berhasil ditambahkan
                  {skippedCount > 0 && (
                    <span className="text-amber-600"> • {skippedCount} dilewati</span>
                  )}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-5 text-center space-y-1 min-w-[280px]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600">Berhasil diimport:</span>
                  <span className="font-bold text-emerald-700">{importedCount} produk</span>
                </div>
                {skippedCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-600">Dilewati (error):</span>
                    <span className="font-bold text-amber-700">{skippedCount} produk</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-emerald-200">
                  <span className="text-gray-600">Total produk sekarang:</span>
                  <span className="font-bold text-gray-900">{getProducts().length} produk</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {step === 'upload' && 'Format: .xlsx, .xls, .csv'}
              {step === 'preview' && `File: ${fileName}`}
              {step === 'importing' && 'Mohon tunggu...'}
              {step === 'done' && 'Import selesai'}
            </div>
            <div className="flex items-center gap-3">
              {step === 'upload' && (
                <button onClick={onClose} className="btn-secondary">
                  Tutup
                </button>
              )}
              {step === 'preview' && (
                <>
                  <button
                    onClick={() => {
                      setStep('upload');
                      setImportResult(null);
                      setFileName('');
                      setError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="btn-secondary"
                  >
                    Ganti File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={
                      !importResult ||
                      importResult.rows.length === 0 ||
                      (importOnlyValid && importResult.validRows === 0)
                    }
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    Import {importOnlyValid ? importResult?.validRows : importResult?.totalRows} Produk
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
              {step === 'done' && (
                <button
                  onClick={() => {
                    onImportDone();
                    onClose();
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
