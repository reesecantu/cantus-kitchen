import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";

interface ImageUploadProps {
  imageFile?: File;
  onImageChange: (file: File | undefined) => void;
}

export const ImageUpload = ({ imageFile, onImageChange }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }

      onImageChange(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Recipe Image (optional)
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload area */}
      {!imageFile && !preview ? (
        <div
          onClick={handleUploadClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer transition-colors"
        >
          <Upload className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Click to upload a recipe image
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
        </div>
      ) : (
        /* Preview area */
        <div className="relative inline-block">
          <div className="relative rounded-lg overflow-hidden border border-gray-300">
            {preview ? (
              <img
                src={preview}
                alt="Recipe preview"
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <Image className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* File info */}
          {imageFile && (
            <p className="mt-2 text-sm text-gray-600">
              {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}

          {/* Change image button */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Change image
          </button>
        </div>
      )}
    </div>
  );
};
