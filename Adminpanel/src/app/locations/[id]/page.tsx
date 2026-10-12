"use client";

import React, { useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  Download,
  ExternalLink,
  Sparkles,
  QrCode,
  AlertCircle,
  Wifi,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { locationService } from "@/services/locations";
import { resolveImageUrl } from "@/lib/utils";
import { CUSTOMER_MENU_URL } from "@/lib/constants";

export default function LocationQRPrintPage() {
  const params = useParams();
  const id = Number(params?.id);

  const { data: location, isLoading } = useQuery({
    queryKey: ["location", id],
    queryFn: () => locationService.getLocation(id),
    enabled: !isNaN(id) && id > 0,
  });

  const handlePrint = () => {
    window.print();
  };

  const baseUrl = (process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL || CUSTOMER_MENU_URL).replace(/\/$/, "");
  const customerMenuUrl = location
    ? `${baseUrl}/?token=${location.qr_token}`
    : "#";

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Controls Bar (hidden during printing via CSS) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-900 transition-colors uppercase tracking-wider mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Locations
            </Link>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950">
              QR Table Stand Preview
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Printable contactless table card for {location?.name || "dining location"}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={customerMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4 text-brand-700" />
              <span>Preview Menu</span>
            </a>

            {location?.qr_image_url && (
              <a
                href={resolveImageUrl(location.qr_image_url)}
                download={`qr-${location.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm shadow-sm transition-all"
              >
                <Download className="w-4 h-4 text-gold-600" />
                <span>Save PNG</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="w-4 h-4 text-gold-400" />
              <span>Print Table Card</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        {isLoading ? (
          <div className="h-96 bg-white rounded-3xl border border-stone-200 animate-pulse" />
        ) : !location ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="font-serif text-lg font-bold text-stone-900">Location Not Found</h3>
          </div>
        ) : (
          <div className="flex justify-center p-4">
            {/* The Physical Table Stand Card Component */}
            <div className="print-container bg-white w-full max-w-md rounded-3xl border-2 border-stone-300 shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-stone-50/50 via-white to-stone-50/30">
              {/* Luxury Gold Border Accent */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400" />

              {/* Hotel Crest */}
              <div className="mt-4 w-16 h-16 rounded-2xl bg-brand-900 border-2 border-gold-400/40 text-gold-400 font-serif font-bold text-2xl flex items-center justify-center shadow-lg shadow-brand-950/20 mb-3">
                H
              </div>

              <h2 className="font-serif text-2xl font-bold text-brand-950 tracking-wide">
                Grand Hotel & Dining
              </h2>
              <p className="text-[11px] uppercase tracking-widest text-gold-600 font-bold mt-1">
                Digital Culinary Collection
              </p>

              {/* Table / Location Badge */}
              <div className="mt-5 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 font-serif text-sm font-bold text-brand-950">
                {location.name}
              </div>

              {/* Scannable QR Code */}
              <div className="my-6 p-4 bg-white rounded-2xl border-2 border-stone-200 shadow-sm relative">
                {location.qr_image_url ? (
                  <div className="relative w-56 h-56">
                    <Image
                      src={resolveImageUrl(location.qr_image_url)}
                      alt={`QR code for ${location.name}`}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-stone-400">
                    <QrCode className="w-16 h-16" />
                    <span className="text-xs mt-2">QR generating...</span>
                  </div>
                )}
              </div>

              {/* Scan instructions */}
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-semibold text-stone-800 tracking-wide uppercase">
                  Scan to View Menu & Specials
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Open your smartphone camera and point at the QR code to explore dishes, chef recommendations, and wine pairings.
                </p>
              </div>

              {/* Wi-Fi & Courtesy hint */}
              <div className="mt-6 pt-4 border-t border-stone-100 w-full flex items-center justify-center gap-2 text-[10px] text-stone-400">
                <Wifi className="w-3 h-3 text-gold-600" />
                <span>Complimentary Guest Wi-Fi: <strong>GrandDining-Guest</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
