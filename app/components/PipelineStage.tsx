'use client';

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  canSubmit?: boolean;
}

export default function PipelineStage({
  title,
  description,
  children,
  onSubmit,
  isSubmitting,
  submitLabel = 'Confirm & Continue',
  canSubmit = true,
}: Props) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
        )}
      </header>

      <div className="flex flex-col gap-5">{children}</div>

      <div className="flex items-center justify-end pt-2 border-t border-neutral-800">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          className="px-5 py-2 text-sm font-medium rounded bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </section>
  );
}
