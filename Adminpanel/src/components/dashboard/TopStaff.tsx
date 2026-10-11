import React from "react";
import Link from "next/link";
import { Staff } from "@/types";
import { Star, Award, User, ChevronRight } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

interface TopStaffProps {
  staff?: Staff[];
  staffList?: Staff[];
}

export function TopStaff({ staff, staffList }: TopStaffProps) {
  const members = staffList || staff || [];
  return (
    <div className="bg-white dark:bg-[#11161e] p-6 rounded-2xl border border-stone-200/90 dark:border-white/[0.08] shadow-card dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white flex items-center gap-2">
            <span>Top Rated Staff</span>
            <Award className="w-4 h-4 text-gold-500" />
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">Highest rated service team members</p>
        </div>
        <Link
          href="/staff"
          className="text-xs font-semibold text-brand-700 dark:text-gold-400 hover:text-brand-900 dark:hover:text-gold-300 flex items-center gap-1 hover:underline"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
        {members.length === 0 ? (
          <p className="text-xs text-stone-400 dark:text-stone-400 py-6 text-center">No staff ratings recorded yet.</p>
        ) : (
          members.slice(0, 5).map((member) => (
            <div key={member.id} className="py-3 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-white/[0.05] overflow-hidden shrink-0 flex items-center justify-center border border-stone-200 dark:border-white/[0.08]">
                  {member.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(member.profile_image)}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <User className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-brand-850 dark:group-hover:text-gold-400 transition-colors">
                    {member.name}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{member.designation}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400 justify-end font-bold">
                  <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                  <span>{member.average_rating.toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-stone-500">{member.total_ratings} reviews</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
