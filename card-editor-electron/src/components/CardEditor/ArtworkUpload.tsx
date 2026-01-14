import React, { useState, useRef, useEffect } from 'react';
import { ArtworkStorage } from '../../services/ArtworkStorage';
import './ArtworkUpload.css';

interface ArtworkUploadProps {
  cardCode: string;
  currentArtwork: string | null;
  onArtworkUploaded: (filePath: string) => void;
}

function ArtworkUpload({ cardCode, currentArtwork, onArtworkUploaded }: ArtworkUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPreview = async () => {
      if (currentArtwork) {
        if (currentArtwork.startsWith('http')) {
          // Supabase URL
          setPreview(currentArtwork);
        } else {
          // Local file
          const { success, dataUrl } = await ArtworkStorage.getArtworkAsDataUrl(cardCode);
          if (success && dataUrl) {
            setPreview(dataUrl);
          }
        }
      }
    };
    loadPreview();
  }, [currentArtwork, cardCode]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = ArtworkStorage.validateImageFile(file);
    if (!validation.valid) {
      window.alert(validation.error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Save file
    setUploading(true);
    const result = await ArtworkStorage.saveArtworkLocally(file, cardCode);
    setUploading(false);

    if (result.success && result.filePath) {
      onArtworkUploaded(result.filePath);
      window.alert('Artwork uploaded successfully!');
    } else {
      window.alert(`Failed to upload artwork: ${result.error?.message || 'Unknown error'}`);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove this artwork?')) {
      return;
    }

    const result = await ArtworkStorage.deleteArtwork(cardCode);
    if (result.success) {
      setPreview(null);
      onArtworkUploaded('');
    } else {
      window.alert(`Failed to remove artwork: ${result.error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="artwork-upload">
      {preview && (
        <div className="artwork-upload-preview">
          <img src={preview} alt="Card artwork" />
          <button
            className="btn btn-danger artwork-upload-remove"
            onClick={handleRemove}
          >
            Remove Artwork
          </button>
        </div>
      )}
      
      <div className="artwork-upload-controls">
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
          {uploading ? 'Uploading...' : preview ? 'Replace Artwork' : 'Upload Artwork'}
        </button>
        <p className="artwork-upload-hint">
          Supported formats: PNG, JPG, WebP (max 10MB)
        </p>
      </div>
    </div>
  );
}

export default ArtworkUpload;


