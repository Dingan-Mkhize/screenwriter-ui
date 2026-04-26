'use client';

import { ORDERED_STAGES, STAGE_LABELS, STAGE_NUMBERS, type Stage } from '@/lib/types';

interface Props {
  currentStage: Stage;
}

const PIPELINE_STAGES = ORDERED_STAGES.filter((s) => s !== 'complete');

export default function ProgressBar({ currentStage }: Props) {
  const currentNumber = STAGE_NUMBERS[currentStage];

  return (
    <nav aria-label="Pipeline progress" className="w-full py-4">
      <ol className="flex items-center gap-0">
        {PIPELINE_STAGES.map((stage, idx) => {
          const num = STAGE_NUMBERS[stage];
          const isDone    = currentNumber > num;
          const isCurrent = currentNumber === num;

          return (
            <li key={stage} className="flex items-center flex-1 min-w-0">
              {/* Step dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                    isDone    ? 'bg-white border-white text-black'          : '',
                    isCurrent ? 'bg-transparent border-white text-white'   : '',
                    !isDone && !isCurrent ? 'bg-transparent border-neutral-600 text-neutral-600' : '',
                  ].join(' ')}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span
                  className={[
                    'mt-1 text-[10px] text-center leading-tight max-w-[64px] hidden sm:block',
                    isCurrent ? 'text-white font-medium' : isDone ? 'text-neutral-400' : 'text-neutral-600',
                  ].join(' ')}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </div>

              {/* Connector line — not after last item */}
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={[
                    'flex-1 h-px mx-1 transition-colors',
                    currentNumber > num ? 'bg-white' : 'bg-neutral-700',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
