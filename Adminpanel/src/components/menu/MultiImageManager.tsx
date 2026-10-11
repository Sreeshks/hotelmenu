"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Plus,
  Star,
  ExternalLink,
  Link2,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { GoogleImageSearchModal } from "./GoogleImageSearchModal";
import { uploadService } from "@/services/upload";

interface MultiImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  productName: string;
  onFileUpload?: (file: File, slotIndex: number) => void;
  maxImages?: number;
}

export function MultiImageManager({
  images = [],
  onChange,
  productName,
  onFileUpload,
  maxImages = 3,
}: MultiImageManagerProps) {
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [activeSlotForModal, setActiveSlotForModal] = useState<number | null>(null);
  const [pastingSlot, setPastingSlot] = useState<number | null>(null);
  const [pasteUrlInput, setPasteUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetSlotForFile, setTargetSlotForFile] = useState<number>(0);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // Normalize images array to ensure up to maxImages
  const currentImages = Array.isArray(images) ? images.filter(Boolean).slice(0, maxImages) : [];

  const handleOpenGoogleSearch = (slotIndex?: number) => {
    setActiveSlotForModal(slotIndex !== undefined ? slotIndex : null);
    setIsGoogleModalOpen(true);
  };

  const handleSelectFromGoogle = (newUrls: string[]) => {
    if (activeSlotForModal !== null) {
      // Replace specific slot
      const updated = [...currentImages];
      if (newUrls[0]) {
        updated[activeSlotForModal] = newUrls[0];
      }
      onChange(updated.filter(Boolean).slice(0, maxImages));
    } else {
      // Append or fill remaining slots
      const combined = [...currentImages];
      for (const u of newUrls) {
        if (!combined.includes(u) && combined.length < maxImages) {
          combined.push(u);
        }
      }
      onChange(combined.slice(0, maxImages));
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = currentImages.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0 || index >= currentImages.length) return;
    const selected = currentImages[index];
    const rest = currentImages.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  const handlePasteSubmit = (slotIndex: number) => {
    const trimmed = pasteUrlInput.trim();
    if (trimmed) {
      const updated = [...currentImages];
      updated[slotIndex] = trimmed;
      onChange(updated.filter(Boolean).slice(0, maxImages));
      setPasteUrlInput("");
      setPastingSlot(null);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const slot = targetSlotForFile;
      if (onFileUpload) {
        onFileUpload(file, slot);
      }
      // Create local object URL preview immediately
      const localUrl = URL.createObjectURL(file);
      const updated = [...currentImages];
      updated[slot] = localUrl;
      onChange(updated.filter(Boolean).slice(0, maxImages));

      // Upload to ImgBB cloud storage
      setUploadingSlot(slot);
      try {
        const imgbbUrl = await uploadService.uploadImage(file, "menu_items");
        if (imgbbUrl) {
          const fresh = [...currentImages];
          fresh[slot] = imgbbUrl;
          onChange(fresh.filter(Boolean).slice(0, maxImages));
        }
      } catch (err) {
        console.error("Failed to upload to ImgBB:", err);
      } finally {
        setUploadingSlot(null);
      }
    }
  };

  const triggerFileUpload = (slotIndex: number) => {
    setTargetSlotForFile(slotIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header bar with Google Search button & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-brand-950 uppercase tracking-wide">
              Product Images ({currentImages.length}/{maxImages})
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ImgBB Cloud Storage
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Add up to {maxImages} images. Slot 1 is the primary cover photo for the menu.
          </p>
        </div>

        {/* Quick Google Search Button */}
        <button
          type="button"
          onClick={() => handleOpenGoogleSearch()}
          disabled={currentImages.length >= maxImages}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-stone-200 hover:border-brand-600 hover:bg-stone-50 text-stone-800 shadow-sm transition-all disabled:opacity-40 group shrink-0"
        >
          {/* Google G Logo SVG */}
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-semibold text-stone-800 group-hover:text-brand-900">
            Google Image Search
          </span>
        </button>
      </div>

      {/* 3 Image Slots Grid */}
      <div className="space-y-3">
        {Array.from({ length: maxImages }).map((_, slotIndex) => {
          const imageUrl = currentImages[slotIndex];
          const isCover = slotIndex === 0;
          const isPasting = pastingSlot === slotIndex;
          const isSlotUploading = uploadingSlot === slotIndex;

          return (
            <div
              key={slotIndex}
              className={`rounded-2xl border transition-all overflow-hidden ${
                imageUrl
                  ? "bg-white border-stone-200/90 shadow-sm"
                  : "bg-stone-50/50 border-dashed border-stone-200"
              }`}
            >
              {isSlotUploading ? (
                <div className="p-4 flex items-center justify-center gap-3 bg-brand-50/60 min-h-[72px]">
                  <Loader2 className="w-5 h-5 text-brand-700 animate-spin" />
                  <span className="text-xs font-semibold text-brand-900">
                    Uploading image to ImgBB Cloud...
                  </span>
                </div>
              ) : imageUrl ? (
                /* Filled Slot */
                <div className="flex items-center gap-3.5 p-3">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImageUrl(imageUrl)}
                      alt={`Photo ${slotIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isCover && (
                      <div className="absolute top-1 left-1 bg-gold-500 text-brand-950 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                        Cover
                      </div>
                    )}
                  </div>

                  {/* Info & URL */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-stone-900">
                        {isCover ? "Slot 1 (Cover Photo)" : `Slot ${slotIndex + 1} (Gallery Photo)`}
                      </span>
                      {imageUrl.includes("ibb.co") && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          ImgBB Cloud
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 truncate max-w-full font-mono bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                      {imageUrl}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(slotIndex)}
                        title="Set as primary cover photo"
                        className="p-1.5 rounded-lg text-stone-500 hover:text-gold-600 hover:bg-gold-50 transition-colors border border-transparent hover:border-gold-200"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Change / Replace with Google */}
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleSearch(slotIndex)}
                      title="Replace with Google Image Search"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-brand-900 hover:bg-stone-100 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    </button>

                    {/* View full in new tab */}
                    <a
                      href={resolveImageUrl(imageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open full image in new tab"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(slotIndex)}
                      title="Remove image"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : isPasting ? (
                /* Inline Direct Link Input */
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800">
                      Paste Image Link for Slot {slotIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPastingSlot(null);
                        setPasteUrlInput("");
                      }}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={pasteUrlInput}
                      onChange={(e) => setPasteUrlInput(e.target.value)}
                      placeholder="https://example.com/dish.jpg"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700 text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteSubmit(slotIndex)}
                      disabled={!pasteUrlInput.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-900 text-white rounded-lg hover:bg-brand-950 disabled:opacity-40"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Slot Placeholder */
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-stone-400 shrink-0">
                      <ImageIcon className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-700">
                        {isCover ? "Slot 1 (Cover Photo - Required)" : `Slot ${slotIndex + 1} (Optional)`}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Search with Google, enter direct URL, or upload file
                      </p>
                    </div>
                  </div>

                  {/* 3 Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Google Search Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleSearch(slotIndex)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-200 hover:border-brand-500 hover:bg-stone-50 text-stone-700 shadow-2xs transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      Google Search
                    </button>

                    {/* Direct Link Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPastingSlot(slotIndex);
                        setPasteUrlInput("");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5 text-stone-500" />
                      Paste Link
                    </button>

                    {/* Upload File Button */}
                    <button
                      type="button"
                      onClick={() => triggerFileUpload(slotIndex)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-stone-500" />
                      Upload
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal instance */}
      <GoogleImageSearchModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultQuery={productName}
        onSelectImages={handleSelectFromGoogle}
        maxSelectable={
          activeSlotForModal !== null
            ? 1
            : Math.max(1, maxImages - currentImages.length)
        }
      />
    </div>
  );
}
