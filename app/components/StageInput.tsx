'use client';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
  hint?: string;
}

export default function StageInput({
  label,
  value,
  onChange,
  onGenerate,
  isGenerating = false,
  placeholder = '',
  multiline = false,
  readOnly = false,
  hint,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        {onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="shrink-0 px-3 py-1 text-xs font-medium rounded border border-neutral-600 text-neutral-300 hover:border-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        )}
      </div>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 resize-none read-only:opacity-70 read-only:cursor-default"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 read-only:opacity-70 read-only:cursor-default"
        />
      )}

      {hint && <p className="text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}
