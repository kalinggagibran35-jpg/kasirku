import { useState } from 'react';
import { Camera } from 'lucide-react';

// Color mapping based on product color or category
const colorGradients: Record<string, string> = {
  'merah': 'from-red-400 to-rose-600',
  'maroon': 'from-red-800 to-rose-900',
  'hijau': 'from-emerald-400 to-green-600',
  'zamrud': 'from-emerald-500 to-teal-700',
  'kuning': 'from-yellow-300 to-amber-500',
  'emas': 'from-yellow-400 to-amber-600',
  'ungu': 'from-purple-400 to-violet-600',
  'putih': 'from-gray-100 to-slate-300',
  'mutiara': 'from-gray-100 to-pink-200',
  'hitam': 'from-gray-700 to-slate-900',
  'biru': 'from-blue-400 to-indigo-600',
  'pink': 'from-pink-300 to-rose-500',
  'orange': 'from-orange-300 to-amber-500',
};

const categoryIcons: Record<string, string> = {
  'Baju Bodo': '👗',
  'Baju Bodo Anak': '👧',
  'Sarung': '🧣',
  'Aksesori': '💎',
};

function getGradient(color: string): string {
  const lowerColor = color.toLowerCase();
  for (const [key, gradient] of Object.entries(colorGradients)) {
    if (lowerColor.includes(key)) return gradient;
  }
  return 'from-primary-400 to-primary-700';
}

interface ProductImageProps {
  src?: string;
  name: string;
  color: string;
  category: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: string;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-10 h-10',
  sm: 'w-14 h-14',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-full h-48',
};

const iconSizes: Record<string, string> = {
  xs: 'text-lg',
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

export default function ProductImage({
  src,
  name,
  color,
  category,
  size = 'md',
  className = '',
  rounded = 'rounded-xl',
}: ProductImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasValidSrc = src && src.trim().length > 0 && !imgError;
  const gradient = getGradient(color);
  const icon = categoryIcons[category] || '👗';

  return (
    <div
      className={`${sizeClasses[size]} ${rounded} overflow-hidden relative flex-shrink-0 ${className}`}
    >
      {hasValidSrc ? (
        <>
          {/* Loading placeholder */}
          {!imgLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center animate-pulse`}>
              <span className={iconSizes[size]}>{icon}</span>
            </div>
          )}
          <img
            src={src}
            alt={name}
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        /* Fallback: gradient with icon */
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
          <span className={`${iconSizes[size]} drop-shadow-lg`}>{icon}</span>
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <pattern id={`pattern-${name.replace(/\s/g, '')}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="white" />
              </pattern>
              <rect width="100" height="100" fill={`url(#pattern-${name.replace(/\s/g, '')})`} />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// Image upload component for forms
interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  productName?: string;
  productColor?: string;
  productCategory?: string;
}

export function ImageUpload({
  value,
  onChange,
  productName = '',
  productColor = '',
  productCategory = 'Baju Bodo',
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Resize image to max 600px to save localStorage space
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        onChange(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">Gambar Produk</label>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setUrlMode(false)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              !urlMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setUrlMode(true)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              urlMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {urlMode ? (
        <input
          type="url"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field text-sm"
          placeholder="https://example.com/gambar-produk.jpg"
        />
      ) : (
        <div
          onDrop={handleDrop}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          <Camera size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 font-medium">
            {dragActive ? 'Lepaskan gambar di sini' : 'Klik atau seret gambar ke sini'}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (maks. 5MB)</p>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative group">
          <ProductImage
            src={value}
            name={productName}
            color={productColor}
            category={productCategory}
            size="xl"
            rounded="rounded-xl"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            ✕
          </button>
        </div>
      )}

      {!value && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Preview tanpa gambar:</span>
          <ProductImage
            src=""
            name={productName}
            color={productColor}
            category={productCategory}
            size="xs"
            rounded="rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
