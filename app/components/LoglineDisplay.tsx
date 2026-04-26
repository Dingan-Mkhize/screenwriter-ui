'use client';

interface Props {
  logline: string | null;
}

export default function LoglineDisplay({ logline }: Props) {
  if (!logline) return null;

  return (
    <div className="p-5 rounded-lg border border-neutral-700 bg-neutral-900">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">
        Logline
      </p>
      <p className="text-base text-white leading-relaxed italic">{logline}</p>
    </div>
  );
}
