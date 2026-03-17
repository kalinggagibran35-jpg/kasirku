import * as XLSX from 'xlsx';
import type { Product } from '../types';

// Column mapping for Excel template
const EXCEL_COLUMNS = [
  { key: 'name', header: 'Nama Produk *', width: 30, required: true },
  { key: 'category', header: 'Kategori *', width: 18, required: true },
  { key: 'description', header: 'Deskripsi', width: 40, required: false },
  { key: 'price_sell', header: 'Harga Jual (Rp) *', width: 18, required: true },
  { key: 'price_rent', header: 'Harga Sewa/Hari (Rp)', width: 20, required: false },
  { key: 'stock', header: 'Stok *', width: 10, required: true },
  { key: 'size', header: 'Ukuran', width: 12, required: false },
  { key: 'color', header: 'Warna', width: 15, required: false },
  { key: 'discount_percent', header: 'Diskon (%)', width: 12, required: false },
  { key: 'image_url', header: 'URL Gambar', width: 40, required: false },
  { key: 'active', header: 'Status (Aktif/Nonaktif)', width: 22, required: false },
];

const VALID_CATEGORIES = ['Baju Bodo', 'Baju Bodo Anak', 'Sarung', 'Aksesori'];
const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'All Size', 'Anak', '-'];

export interface ImportRow {
  rowNumber: number;
  data: Omit<Product, 'id' | 'created_at'>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface ImportResult {
  rows: ImportRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
}

/**
 * Generate and download an Excel template for product import
 */
export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();

  // ========== SHEET 1: Template ==========
  const templateHeaders = EXCEL_COLUMNS.map(c => c.header);

  // Sample data rows
  const sampleData = [
    [
      'Baju Bodo Merah Maroon',
      'Baju Bodo',
      'Baju Bodo tradisional warna merah maroon, bahan organza premium',
      850000,
      150000,
      12,
      'M',
      'Merah Maroon',
      0,
      '',
      'Aktif',
    ],
    [
      'Sarung Sutera Bugis',
      'Sarung',
      'Sarung sutera asli Bugis motif Lontara',
      500000,
      100000,
      20,
      'All Size',
      'Merah-Emas',
      10,
      '',
      'Aktif',
    ],
    [
      'Aksesori Kalung Bodo',
      'Aksesori',
      'Kalung tradisional pelengkap baju bodo',
      350000,
      75000,
      15,
      '-',
      'Emas',
      0,
      '',
      'Aktif',
    ],
  ];

  const wsData = [templateHeaders, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = EXCEL_COLUMNS.map(c => ({ wch: c.width }));

  // Style the header row (XLSX doesn't support styles natively, but we add row heights)
  ws['!rows'] = [{ hpt: 25 }]; // Header row height

  XLSX.utils.book_append_sheet(wb, ws, 'Template Import Produk');

  // ========== SHEET 2: Panduan ==========
  const guideData = [
    ['📖 PANDUAN IMPORT PRODUK BAJU BODO POS'],
    [''],
    ['KOLOM', 'WAJIB', 'KETERANGAN', 'CONTOH'],
    ['Nama Produk', 'Ya', 'Nama lengkap produk', 'Baju Bodo Merah Maroon'],
    ['Kategori', 'Ya', 'Pilih: Baju Bodo / Baju Bodo Anak / Sarung / Aksesori', 'Baju Bodo'],
    ['Deskripsi', 'Tidak', 'Deskripsi detail produk', 'Baju Bodo tradisional...'],
    ['Harga Jual (Rp)', 'Ya', 'Harga jual dalam Rupiah (angka saja)', '850000'],
    ['Harga Sewa/Hari (Rp)', 'Tidak', 'Harga sewa per hari (default: 0)', '150000'],
    ['Stok', 'Ya', 'Jumlah stok tersedia (minimal 0)', '12'],
    ['Ukuran', 'Tidak', 'Pilih: S / M / L / XL / XXL / All Size / Anak / -', 'M'],
    ['Warna', 'Tidak', 'Warna produk', 'Merah Maroon'],
    ['Diskon (%)', 'Tidak', 'Persentase diskon 0-100 (default: 0)', '10'],
    ['URL Gambar', 'Tidak', 'Link gambar produk (opsional)', 'https://...'],
    ['Status', 'Tidak', 'Aktif atau Nonaktif (default: Aktif)', 'Aktif'],
    [''],
    ['⚠️ CATATAN PENTING:'],
    ['1. Kolom bertanda (*) wajib diisi'],
    ['2. Baris pertama (header) TIDAK boleh dihapus atau diubah'],
    ['3. Hapus baris contoh sebelum mengisi data Anda'],
    ['4. Harga dan stok harus berupa angka (tanpa titik/koma)'],
    ['5. Kategori harus sesuai dengan pilihan yang tersedia'],
    ['6. File yang didukung: .xlsx, .xls, .csv'],
    ['7. Maksimal 500 produk per import'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 50 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

  // ========== SHEET 3: Referensi ==========
  const refData = [
    ['📋 REFERENSI DATA'],
    [''],
    ['KATEGORI YANG TERSEDIA'],
    ...VALID_CATEGORIES.map(c => [c]),
    [''],
    ['UKURAN YANG TERSEDIA'],
    ...VALID_SIZES.map(s => [s]),
    [''],
    ['STATUS YANG TERSEDIA'],
    ['Aktif'],
    ['Nonaktif'],
  ];

  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef['!cols'] = [{ wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

  // Download
  XLSX.writeFile(wb, 'Template_Import_Produk_BajuBodo.xlsx');
}

/**
 * Export existing products to Excel
 */
export function exportProducts(products: Product[]): void {
  const wb = XLSX.utils.book_new();

  const headers = EXCEL_COLUMNS.map(c => c.header);
  const data = products.map(p => [
    p.name,
    p.category,
    p.description,
    p.price_sell,
    p.price_rent,
    p.stock,
    p.size,
    p.color,
    p.discount_percent,
    p.image_url,
    p.active ? 'Aktif' : 'Nonaktif',
  ]);

  const wsData = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = EXCEL_COLUMNS.map(c => ({ wch: c.width }));

  XLSX.utils.book_append_sheet(wb, ws, 'Produk');

  // Add summary sheet
  const summaryData = [
    ['📊 RINGKASAN EXPORT PRODUK'],
    [''],
    ['Total Produk', products.length],
    ['Produk Aktif', products.filter(p => p.active).length],
    ['Produk Nonaktif', products.filter(p => !p.active).length],
    [''],
    ['Per Kategori:'],
    ...VALID_CATEGORIES.map(cat => [
      cat,
      products.filter(p => p.category === cat).length,
    ]),
    [''],
    ['Tanggal Export', new Date().toLocaleString('id-ID')],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Produk_BajuBodo_${dateStr}.xlsx`);
}

/**
 * Parse and validate an uploaded Excel file
 */
export function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON (skip header row)
        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          header: EXCEL_COLUMNS.map(c => c.key),
          range: 1, // skip header row
          defval: '',
        });

        if (rawData.length === 0) {
          reject(new Error('File Excel kosong atau tidak memiliki data.'));
          return;
        }

        if (rawData.length > 500) {
          reject(new Error('Maksimal 500 produk per import. File Anda memiliki ' + rawData.length + ' baris.'));
          return;
        }

        const rows: ImportRow[] = rawData.map((row, index) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          // Parse and validate each field
          const name = String(row.name || '').trim();
          const category = String(row.category || '').trim();
          const description = String(row.description || '').trim();
          const priceSellRaw = row.price_sell;
          const priceRentRaw = row.price_rent;
          const stockRaw = row.stock;
          const size = String(row.size || 'M').trim();
          const color = String(row.color || '').trim();
          const discountRaw = row.discount_percent;
          const imageUrl = String(row.image_url || '').trim();
          const statusRaw = String(row.active || 'Aktif').trim().toLowerCase();

          // Validate required fields
          if (!name) errors.push('Nama produk wajib diisi');
          if (name.length > 100) errors.push('Nama produk maksimal 100 karakter');

          if (!category) {
            errors.push('Kategori wajib diisi');
          } else if (!VALID_CATEGORIES.includes(category)) {
            // Try fuzzy match
            const matched = VALID_CATEGORIES.find(
              c => c.toLowerCase() === category.toLowerCase()
            );
            if (!matched) {
              errors.push(`Kategori "${category}" tidak valid. Pilih: ${VALID_CATEGORIES.join(', ')}`);
            }
          }

          // Parse numbers
          const priceSell = typeof priceSellRaw === 'number'
            ? priceSellRaw
            : Number(String(priceSellRaw).replace(/[^\d.-]/g, '')) || 0;

          const priceRent = typeof priceRentRaw === 'number'
            ? priceRentRaw
            : Number(String(priceRentRaw).replace(/[^\d.-]/g, '')) || 0;

          const stock = typeof stockRaw === 'number'
            ? Math.round(stockRaw)
            : Math.round(Number(String(stockRaw).replace(/[^\d.-]/g, '')) || 0);

          const discountPercent = typeof discountRaw === 'number'
            ? discountRaw
            : Number(String(discountRaw).replace(/[^\d.-]/g, '')) || 0;

          if (priceSell <= 0) errors.push('Harga jual harus lebih dari 0');
          if (priceSell > 999999999) errors.push('Harga jual terlalu besar');
          if (priceRent < 0) warnings.push('Harga sewa negatif, akan diubah ke 0');
          if (stock < 0) errors.push('Stok tidak boleh negatif');
          if (discountPercent < 0 || discountPercent > 100) errors.push('Diskon harus antara 0-100%');

          // Validate size
          let validSize = size;
          if (size && !VALID_SIZES.includes(size)) {
            const matched = VALID_SIZES.find(s => s.toLowerCase() === size.toLowerCase());
            if (matched) {
              validSize = matched;
            } else {
              warnings.push(`Ukuran "${size}" tidak standar, akan tetap digunakan`);
            }
          }

          // Parse active status
          const active = !['nonaktif', 'tidak', 'no', 'false', '0', 'inactive'].includes(statusRaw);

          // Validate image URL
          if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            warnings.push('URL gambar harus dimulai dengan http:// atau https://');
          }

          // Warnings
          if (!description) warnings.push('Deskripsi kosong');
          if (priceRent === 0) warnings.push('Harga sewa tidak diisi (default: 0)');
          if (stock === 0) warnings.push('Stok 0');

          // Resolve correct category casing
          const resolvedCategory = VALID_CATEGORIES.find(
            c => c.toLowerCase() === category.toLowerCase()
          ) || category;

          const productData: Omit<Product, 'id' | 'created_at'> = {
            name,
            category: resolvedCategory,
            description,
            price_sell: priceSell,
            price_rent: Math.max(0, priceRent),
            stock: Math.max(0, stock),
            size: validSize || 'M',
            color: color || '-',
            discount_percent: Math.max(0, Math.min(100, discountPercent)),
            image_url: imageUrl,
            active,
          };

          return {
            rowNumber: index + 2, // +2 because row 1 is header, index is 0-based
            data: productData,
            errors,
            warnings,
            isValid: errors.length === 0,
          };
        });

        // Filter out completely empty rows
        const nonEmptyRows = rows.filter(
          r => r.data.name || r.data.category || r.data.price_sell > 0
        );

        resolve({
          rows: nonEmptyRows,
          totalRows: nonEmptyRows.length,
          validRows: nonEmptyRows.filter(r => r.isValid).length,
          errorRows: nonEmptyRows.filter(r => !r.isValid).length,
          warningRows: nonEmptyRows.filter(r => r.isValid && r.warnings.length > 0).length,
        });
      } catch (err) {
        reject(new Error('Gagal membaca file Excel. Pastikan format file benar. ' + (err as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file. Silakan coba lagi.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
