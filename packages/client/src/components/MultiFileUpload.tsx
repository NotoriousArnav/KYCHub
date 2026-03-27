import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface MultiFileUploadProps {
  label: string;
  description?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  required?: boolean;
}

export function MultiFileUpload({
  label,
  description,
  value,
  onChange,
  maxFiles = 10,
  required = false,
}: MultiFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const type = 'government-id';
        
        try {
          const result = await api.uploadFile(file, type);
          uploadedUrls.push(result.url);
          setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }

      if (uploadedUrls.length < filesToUpload.length) {
        setError(`${filesToUpload.length - uploadedUrls.length} file(s) failed to upload`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const isImage = (url: string) => {
    return url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.webp');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {value.map((url, index) => (
            <div key={index} className="relative rounded-lg border overflow-hidden group">
              {isImage(url) ? (
                <img src={api.getFileUrl(url)} alt={`Document ${index + 1}`} className="w-full h-24 object-cover" />
              ) : (
                <div className="h-24 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Doc {index + 1}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-muted/50",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center">
              {uploadProgress !== null && (
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, PDF up to 10MB each • Max {maxFiles} files
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {value.length}/{maxFiles} files uploaded
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
