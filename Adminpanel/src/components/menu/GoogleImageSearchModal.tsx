"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, X, Check, ExternalLink, Link2, AlertCircle, Sparkles } from "lucide-react";
import { ImageSearchResult } from "@/types";
import { menuService } from "@/services/menu";

interface GoogleImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery: string;
  onSelectImages: (imageUrls: string[]) => void;
  maxSelectable?: number;
}

export function GoogleImageSearchModal({
  isOpen,
  onClose,
  defaultQuery,
  onSelectImages,
  maxSelectable = 3,
}: GoogleImageSearchModalProps) {
  const [query, setQuery] = useState(defaultQuery || "");
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [directUrl, setDirectUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "direct">("search");

  // Keep query in sync when modal opens with new item name
  useEffect(() => {
    if (isOpen) {
      const q = defaultQuery?.trim() || "";
      setQuery(q);
      setSelectedUrls([]);
      setError(null);
      if (q) {
        handleSearch(q);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }
  }, [isOpen, defaultQuery]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setError("Please enter a search term.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setHasSearched(true);
    try {
      const imgs = await menuService.searchImages(q, 28);
      setResults(imgs);
      if (imgs.length === 0) {
        setError(`No images found for "${q}". Try a different keyword like "${q} food" or "authentic ${q}".`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to search images. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectUrl = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls(selectedUrls.filter((u) => u !== url));
    } else {
      if (selectedUrls.length >= maxSelectable) {
        // If max reached, replace the last one or alert
        if (maxSelectable === 1) {
          setSelectedUrls([url]);
        } else {
          setSelectedUrls([...selectedUrls.slice(0, maxSelectable - 1), url]);
        }
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedUrls.length > 0) {
      onSelectImages(selectedUrls);
      onClose();
    }
  };

  const handleAddDirectUrl = () => {
    const trimmed = directUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    onSelectImages([trimmed]);
    setDirectUrl("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            {/* Google G Logo Icon */}
            <div className="w-9 h-9 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center p-1.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
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
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                Google Image Search
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Direct Web Links
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Search high-resolution culinary dish photos and keep links (up to {maxSelectable} images)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch & Search Bar */}
        <div className="p-5 border-b border-stone-100 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                activeTab === "search"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Search Web Images
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "direct"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Paste Direct Link
            </button>
          </div>

          {activeTab === "search" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Royal Truffle Risotto, Paneer Tikka, Margherita Pizza..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900 placeholder-stone-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-900 hover:bg-brand-950 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-gold-400" />
                    Search
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://example.com/images/delicious-dish.jpg"
                className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900 placeholder-stone-400"
              />
              <button
                type="button"
                onClick={handleAddDirectUrl}
                disabled={!directUrl.trim()}
                className="px-5 py-2.5 bg-brand-900 hover:bg-brand-950 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                Use Link
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-2xl bg-stone-100 animate-pulse border border-stone-200"
                />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
                <span>
                  Showing {results.length} results. Click images to select (up to {maxSelectable}).
                </span>
                {selectedUrls.length > 0 && (
                  <span className="text-brand-900 font-semibold bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
                    {selectedUrls.length} / {maxSelectable} selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {results.map((item, idx) => {
                  const isSelected = selectedUrls.includes(item.url);
                  const selectedIndex = selectedUrls.indexOf(item.url);

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectUrl(item.url)}
                      className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all bg-stone-100 ${
                        isSelected
                          ? "border-emerald-600 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]"
                          : "border-transparent hover:border-stone-300 hover:shadow-sm"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumb_url || item.url}
                        alt={item.title || "Dish photo"}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Selection Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-lg ring-2 ring-white">
                            {selectedIndex + 1}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm border border-white/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">
                            +
                          </div>
                        )}
                      </div>

                      {/* External preview link */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open image in new tab"
                        className="absolute bottom-2 right-2 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Title overlay */}
                      {item.title && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[11px] text-white truncate font-medium">
                            {item.title}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">No images found</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Try searching with simpler terms or paste a direct image URL above.
              </p>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">Ready to search images</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Enter dish or ingredient keywords above to search web images with Google.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            {selectedUrls.length > 0 ? (
              <span className="font-semibold text-emerald-700">
                {selectedUrls.length} image{selectedUrls.length > 1 ? "s" : ""} selected (stored as web links)
              </span>
            ) : (
              <span>Select up to {maxSelectable} images to attach</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-brand-900 hover:bg-brand-950 rounded-xl shadow-md transition-all disabled:opacity-40"
            >
              <Check className="w-4 h-4 text-gold-400" />
              Add Selected ({selectedUrls.length}) to Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
