import { useState, useRef } from 'react';
import { api } from '../lib/api';

interface Props {
  onUpload: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ onUpload, label = 'Upload Image' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5 MB)');
      return;
    }

    setError(null);
    setUploading(true);

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<{ data: { url: string } }>('/upload/image', formData);
      onUpload(res.data.url);
    } catch (err) {
      setError((err as Error).message);
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
        ) : (
          <div className="text-gray-500">
            <div className="text-3xl mb-2">📷</div>
            <p className="text-sm">{uploading ? 'Uploading...' : label}</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5 MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
