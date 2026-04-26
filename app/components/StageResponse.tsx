'use client';

import type { ConsistencyResult, CraftValidationResult } from '@/lib/types';

interface Props {
  isLoading: boolean;
  consistency: ConsistencyResult | null;
  craftValidation: CraftValidationResult | null;
  error: string | null;
}

export default function StageResponse({ isLoading, consistency, craftValidation, error }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-neutral-500">
        <span className="inline-block w-3 h-3 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        Generating…
      </div>
    );
  }

  if (!error && !consistency && !craftValidation) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Hard error (API down, craft validation failure) */}
      {error && (
        <div className="px-3 py-2 rounded bg-red-950 border border-red-800 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Craft validation result (only shown on failure — success is silent) */}
      {craftValidation && !craftValidation.valid && (
        <div className="px-3 py-2 rounded bg-red-950 border border-red-800 text-sm text-red-300">
          <span className="font-medium">Craft check failed: </span>
          {craftValidation.reason}
        </div>
      )}

      {/* Consistency amber flag */}
      {consistency?.amber_flag && (
        <div className="px-3 py-2 rounded bg-amber-950 border border-amber-700 text-sm text-amber-300">
          <p className="font-medium mb-1">Consistency warning — review before confirming</p>
          <ul className="list-disc list-inside space-y-0.5">
            {consistency.conflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
