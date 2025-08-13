import { useState, useRef } from "react";
import { Upload, X, Image, Link } from "lucide-react";

interface ImageUploadProps {
  imageFile?: File;
  imageUrl?: string;
  onImageChange: (file: File | undefined) => void;
  onImageUrlChange: (url: string | undefined) => void;
}

export const ImageUpload = ({
  imageFile,
  imageUrl,
  onImageChange,
  onImageUrlChange,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Clear any previous errors
      setImageError(null);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setImageError("Please select an image file");
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Image must be smaller than 5MB");
        return;
      }

      // Clear URL when file is selected
      onImageUrlChange(undefined);
      onImageChange(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;

    // Clear error when user starts typing
    setImageError(null);

    // Clear file when URL is entered
    if (url.trim()) {
      onImageChange(undefined);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    onImageUrlChange(url.trim() || undefined);
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
    onImageUrlChange(undefined);
    setPreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  const hasImage = (imageFile && preview) || imageUrl;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Recipe Image (optional)
      </label>

      {/* Method selector */}
      <div className="flex space-x-4 mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="file"
            checked={uploadMethod === "file"}
            onChange={(e) => {
              setUploadMethod(e.target.value as "file");
              // Clear URL-related data when switching to file upload
              if (imageUrl) {
                onImageUrlChange(undefined);
                setImageError(null);
              }
            }}
            className="mr-2"
          />
          <Upload className="h-4 w-4 mr-1" />
          Upload File
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="url"
            checked={uploadMethod === "url"}
            onChange={(e) => {
              setUploadMethod(e.target.value as "url");
              // Clear file-related data when switching to URL
              if (imageFile || preview) {
                onImageChange(undefined);
                setPreview(null);
                setImageError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
            }}
            className="mr-2"
          />
          <Link className="h-4 w-4 mr-1" />
          Image URL
        </label>
      </div>

      {uploadMethod === "file" ? (
        <>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload area */}
          {(!hasImage || (uploadMethod === "file" && !preview)) && (
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
          )}
        </>
      ) : (
        /* URL Input */
        <div>
          <input
            type="url"
            value={imageUrl || ""}
            onChange={handleUrlChange}
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Preview area */}
      {((uploadMethod === "file" && preview) ||
        (uploadMethod === "url" && imageUrl)) && (
        <div className="relative flex justify-center">
          <div className="aspect-[3/2] relative rounded-lg overflow-hidden border border-gray-300">
            {preview || imageUrl ? (
              <img
                src={preview || imageUrl}
                alt="Recipe preview"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  setImageError("Failed to load image. Please check the URL.");
                }}
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

          {/* File info - centered below image */}
          {imageFile && preview && (
            <p className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 whitespace-nowrap">
              {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}

          {/* Change image button - centered below file info */}
          {imageFile && preview && uploadMethod === "file" && (
            <button
              type="button"
              onClick={handleUploadClick}
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-sm text-blue-600 hover:text-blue-700"
            >
              Change image
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {imageError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {imageError}
        </div>
      )}
    </div>
  );
};
