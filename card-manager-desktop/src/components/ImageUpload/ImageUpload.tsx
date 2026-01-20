import React, { useState, useRef, useEffect } from 'react';
import { ImageService } from '../../services/ImageService';
import './ImageUpload.css';

interface ImageUploadProps {
  cardCode: string;
  currentImageUrl: string | null;
  onImageUploaded: (url: string | null) => void;
}

function ImageUpload({ cardCode, currentImageUrl, onImageUploaded }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    } else {
      setPreview(null);
    }
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = ImageService.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    const result = await ImageService.uploadImage(file, cardCode);
    setUploading(false);

    if (result.success && result.url) {
      onImageUploaded(result.url);
    } else {
      setError(result.error || 'Failed to upload image');
      setPreview(null);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove this image?')) {
      return;
    }

    setError(null);
    const result = await ImageService.deleteImage(cardCode);
    
    if (result.success) {
      setPreview(null);
      onImageUploaded(null);
    } else {
      setError(result.error || 'Failed to remove image');
    }
  };

  return (
    <div className="image-upload">
      {preview && (
        <div className="image-upload-preview">
          <img src={preview} alt="Card artwork" />
          <button
            className="btn btn-danger image-upload-remove"
            onClick={handleRemove}
            disabled={uploading}
          >
            Remove Image
          </button>
        </div>
      )}
      
      <div className="image-upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : preview ? 'Replace Image' : 'Upload Image'}
        </button>
        <p className="image-upload-hint">
          Supported formats: PNG, JPG, WebP (max 10MB)
        </p>
        {error && (
          <div className="image-upload-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;

