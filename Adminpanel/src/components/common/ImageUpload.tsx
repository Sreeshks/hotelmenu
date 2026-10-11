"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { cn, resolveImageUrl } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  label?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Upload Image",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayImage = previewUrl || (value ? resolveImageUrl(value) : null);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum size of ${maxSizeMB}MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const sizeStr = (file.size / 1024).toFixed(0) + " KB";
    setFileDetails({ name: file.name, size: sizeStr });
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setFileDetails(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange(null);
    if (onRemove) onRemove();
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase">{label}</label>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            ImgBB Cloud
          </span>
        </div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all p-4 flex flex-col items-center justify-center text-center min-h-[160px] overflow-hidden bg-stone-50/60 hover:bg-stone-50",
          isDragging ? "border-gold-500 bg-gold-50/40" : "border-stone-300 hover:border-brand-600",
          displayImage ? "p-2 border-solid border-stone-200" : ""
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {displayImage ? (
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-xs text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg">Change Image</span>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {fileDetails && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm">
                {fileDetails.name} ({fileDetails.size})
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center text-brand-700 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">
                <span className="text-brand-700 underline font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-stone-400 mt-0.5">JPG, PNG, or WEBP (max {maxSizeMB}MB)</p>
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ImgBB Cloud Storage
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && <p className="text-xs text-red-600 font-medium">{errorMessage}</p>}
    </div>
  );
}
