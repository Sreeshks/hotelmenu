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

function GoogleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true">
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
  );
}

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
    <div className="space-y-4 w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header bar with Count & Badges */}
      <div className="space-y-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-brand-950 dark:text-stone-100 uppercase tracking-wide truncate">
            Product Images ({currentImages.length}/{maxImages})
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ImgBB Cloud Storage
          </span>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          Add up to {maxImages} images. Slot 1 is the primary cover photo for the menu.
        </p>

        {/* Quick Google Search Button */}
        <button
          type="button"
          onClick={() => handleOpenGoogleSearch()}
          disabled={currentImages.length >= maxImages}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-stone-850 border border-stone-200/90 dark:border-stone-700 hover:border-brand-600 dark:hover:border-emerald-500 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 shadow-2xs transition-all disabled:opacity-40 group"
        >
          <GoogleIcon className="w-4 h-4" />
          <span className="group-hover:text-brand-900 dark:group-hover:text-emerald-400 transition-colors">
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
                  ? "bg-white dark:bg-stone-900/90 border-stone-200/90 dark:border-stone-800 shadow-sm"
                  : "bg-stone-50/60 dark:bg-stone-900/40 border-dashed border-stone-250 dark:border-stone-800"
              }`}
            >
              {isSlotUploading ? (
                <div className="p-4 flex items-center justify-center gap-3 bg-brand-50/60 dark:bg-emerald-950/30 min-h-[72px]">
                  <Loader2 className="w-5 h-5 text-brand-700 dark:text-emerald-400 animate-spin" />
                  <span className="text-xs font-semibold text-brand-900 dark:text-emerald-300">
                    Uploading image to ImgBB Cloud...
                  </span>
                </div>
              ) : imageUrl ? (
                /* Filled Slot */
                <div className="flex items-center gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {isCover ? "Slot 1 (Cover)" : `Slot ${slotIndex + 1} (Gallery)`}
                      </span>
                      {imageUrl.includes("ibb.co") && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                          ImgBB
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate max-w-full font-mono bg-stone-50 dark:bg-stone-850 px-2 py-0.5 rounded border border-stone-100 dark:border-stone-800">
                      {imageUrl}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(slotIndex)}
                        title="Set as primary cover photo"
                        className="p-1.5 rounded-lg text-stone-500 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-950/50 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Change / Replace with Google */}
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleSearch(slotIndex)}
                      title="Replace with Google Image Search"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-brand-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <GoogleIcon className="w-4 h-4" />
                    </button>

                    {/* View full in new tab */}
                    <a
                      href={resolveImageUrl(imageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open full image in new tab"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(slotIndex)}
                      title="Remove image"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : isPasting ? (
                /* Inline Direct Link Input */
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      Paste Image Link for Slot {slotIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPastingSlot(null);
                        setPasteUrlInput("");
                      }}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs"
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
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700 dark:focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteSubmit(slotIndex)}
                      disabled={!pasteUrlInput.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-900 dark:bg-emerald-600 text-white rounded-lg hover:bg-brand-950 dark:hover:bg-emerald-500 disabled:opacity-40"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Slot Placeholder (Clean responsive stack) */
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 flex items-center justify-center text-stone-400 shrink-0">
                      <ImageIcon className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                          {isCover ? "Slot 1 (Cover Photo)" : `Slot ${slotIndex + 1} (Gallery Photo)`}
                        </p>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                            isCover
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              : "bg-stone-150 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                          }`}
                        >
                          {isCover ? "Required" : "Optional"}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                        Google search, direct link, or upload file
                      </p>
                    </div>
                  </div>

                  {/* 3 Action Buttons in Balanced 3-Column Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleSearch(slotIndex)}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-semibold rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-brand-500 dark:hover:border-emerald-500 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 shadow-2xs transition-all text-center"
                      title="Search Google"
                    >
                      <GoogleIcon className="w-3.5 h-3.5" />
                      <span className="truncate">Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPastingSlot(slotIndex);
                        setPasteUrlInput("");
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-semibold rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-brand-500 dark:hover:border-emerald-500 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 shadow-2xs transition-all text-center"
                      title="Paste Direct Link"
                    >
                      <Link2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <span className="truncate">Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerFileUpload(slotIndex)}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-semibold rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-brand-500 dark:hover:border-emerald-500 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 shadow-2xs transition-all text-center"
                      title="Upload from device"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <span className="truncate">Upload</span>
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
