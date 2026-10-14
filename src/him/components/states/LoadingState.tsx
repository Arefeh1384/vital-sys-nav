import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'در حال اعتبارسنجی دامنه، واکشی شواهد و محاسبه برخط شاخص‌ها...' 
}) => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Progress pill & notice */}
      <div className="flex items-center justify-between p-4 bg-teal-50/60 border border-teal-200/60 rounded-xl text-teal-900">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        <div className="text-xs text-teal-700/80 font-mono tabular-nums">
          LATENCY: ~140ms
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="w-6 h-6 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="h-8 bg-slate-300 rounded w-20"></div>
            <div className="h-3 bg-slate-100 rounded w-36"></div>
          </div>
        ))}
      </div>

      {/* Table & Chart Skeleton */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 bg-slate-300 rounded w-44"></div>
            <div className="h-3 bg-slate-100 rounded w-64"></div>
          </div>
          <div className="h-8 bg-slate-100 rounded w-28"></div>
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-300 rounded w-36"></div>
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
              <div className="h-6 bg-slate-100 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
