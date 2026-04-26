'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, advanceStage, getToken } from '@/lib/api';
import type {
  Project,
  Stage,
  EntryMode,
  FieldEntryMode,
  ApiError,
  ConsistencyResult,
  CraftValidationResult,
  StoryMapBeat,
} from '@/lib/types';
import {
  STAGE_LABELS,
  STORY_MAP_BEATS,
  STORY_MAP_BEAT_LABELS,
  BEAT_ACTS,
} from '@/lib/types';
import ProgressBar from '@/app/components/ProgressBar';
import PipelineStage from '@/app/components/PipelineStage';
import StageInput from '@/app/components/StageInput';
import StageResponse from '@/app/components/StageResponse';
import LoglineDisplay from '@/app/components/LoglineDisplay';

// Per-field state for stages with individual Generate buttons
type FieldMap = Record<string, string>;
type EntryModeMap = Record<string, FieldEntryMode>;

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject]     = useState<Project | null>(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  // Field values and entry modes — reset when stage changes
  const [fields, setFields]           = useState<FieldMap>({});
  const [entryModes, setEntryModes]   = useState<EntryModeMap>({});

  // Response state
  const [consistency, setConsistency]       = useState<ConsistencyResult | null>(null);
  const [craftValidation, setCraftValidation] = useState<CraftValidationResult | null>(null);
  const [submitError, setSubmitError]       = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push('/'); return; }
    loadProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProject(projectId);
      setProject(p);
      resetFields(p.current_stage);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  function resetFields(stage: Stage) {
    setFields({});
    setEntryModes({});
    setConsistency(null);
    setCraftValidation(null);
    setSubmitError(null);
  }

  function setField(key: string, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function markGenerated(key: string) {
    setEntryModes((m) => ({ ...m, [key]: 'generated' }));
  }

  function markManual(key: string) {
    setEntryModes((m) => ({ ...m, [key]: 'manual' }));
  }

  // Single-field generate: calls advance with only that field as generated,
  // then merges the result back into local field state without committing to DB.
  // For MVP, generation happens at submit time — this updates the entryMode
  // so the advance call knows which fields Claude should generate.
  function requestGenerate(key: string) {
    setGeneratingField(key);
    markGenerated(key);
    setGeneratingField(null);
  }

  async function handleSubmit() {
    if (!project) return;
    setSubmitting(true);
    setSubmitError(null);
    setConsistency(null);
    setCraftValidation(null);

    const stage = project.current_stage;
    const input = buildInput(stage, fields);
    const entryMode: EntryMode = Object.keys(entryModes).length > 0 ? entryModes : 'manual';

    try {
      const result = await advanceStage(projectId, stage, input, entryMode);
      setConsistency(result.advance.consistency);
      setCraftValidation(result.advance.craft_validation);
      setProject(result.project);
      resetFields(result.project.current_stage);
    } catch (err) {
      const apiErr = err as ApiError & { craft_validation?: CraftValidationResult };
      setSubmitError(apiErr?.error ?? 'Something went wrong');
      if (apiErr?.craft_validation) setCraftValidation(apiErr.craft_validation);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-neutral-600 text-sm">Loading…</span>
      </div>
    );
  }

  if (!project) return null;

  const stage = project.current_stage;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="px-8 py-5 border-b border-neutral-900">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Projects
          </button>
          <span className="text-sm text-neutral-500">{project.title}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-6">
        <ProgressBar currentStage={stage} />
      </div>

      <main className="max-w-2xl mx-auto px-8 pb-16">
        {stage === 'complete' ? (
          <CompletedView project={project} />
        ) : (
          <>
            <StageForm
              stage={stage}
              project={project}
              fields={fields}
              entryModes={entryModes}
              generatingField={generatingField}
              submitting={submitting}
              onFieldChange={setField}
              onGenerate={requestGenerate}
              onSubmit={handleSubmit}
            />
            <StageResponse
              isLoading={submitting}
              consistency={consistency}
              craftValidation={craftValidation}
              error={submitError}
            />
          </>
        )}
      </main>
    </div>
  );
}

// ── Stage-specific form renderer ─────────────────────────────────────────────

function StageForm({
  stage,
  project,
  fields,
  entryModes,
  generatingField,
  submitting,
  onFieldChange,
  onGenerate,
  onSubmit,
}: {
  stage: Stage;
  project: Project;
  fields: FieldMap;
  entryModes: EntryModeMap;
  generatingField: string | null;
  submitting: boolean;
  onFieldChange: (key: string, value: string) => void;
  onGenerate: (key: string) => void;
  onSubmit: () => void;
}) {
  const isGenerating = (key: string) =>
    generatingField === key || (submitting && entryModes[key] === 'generated');

  switch (stage) {
    case 'idea':
      return (
        <PipelineStage
          title="The Idea"
          description="Write your raw story idea. Don't edit — put down what you have."
          onSubmit={onSubmit}
          isSubmitting={submitting}
        >
          <StageInput
            label="Your idea"
            value={fields.raw_input ?? ''}
            onChange={(v) => onFieldChange('raw_input', v)}
            multiline
            placeholder="A retired detective who…"
            hint="Claude will reflect back your premise, protagonist, and conflict for confirmation."
          />
          <StageInput
            label="Protagonist (name / brief description)"
            value={fields.protagonist ?? ''}
            onChange={(v) => onFieldChange('protagonist', v)}
            placeholder="Harold, 70s, estranged from family"
          />
        </PipelineStage>
      );

    case 'genre_tone':
      return (
        <PipelineStage
          title="Genre & Tone"
          description="Select the genre and tone that govern this story."
          onSubmit={onSubmit}
          isSubmitting={submitting}
        >
          <StageInput
            label="Genre (comma-separated)"
            value={fields.genres ?? ''}
            onChange={(v) => onFieldChange('genres', v)}
            placeholder="Drama, Thriller"
          />
          <StageInput
            label="Tone"
            value={fields.tone ?? ''}
            onChange={(v) => onFieldChange('tone', v)}
            placeholder="Grounded realism"
          />
        </PipelineStage>
      );

    case 'core_story':
      return (
        <PipelineStage
          title="Core Story Engine"
          description="The four dialectical forces that drive the story. Each field can be typed manually or generated."
          onSubmit={onSubmit}
          isSubmitting={submitting}
        >
          {(
            [
              ['psychological_impediment', 'Psychological Impediment', 'The flaw that blocks the protagonist at a character level'],
              ['external_objective',       'External Objective',       'What the protagonist is actively trying to achieve'],
              ['internal_resolution',      'Internal Resolution',      'The inner change required — the only logical outcome of the paradox'],
              ['structural_paradox',       'Structural Paradox',       'The loop: the impediment destroys what it protects'],
            ] as [string, string, string][]
          ).map(([key, label, hint]) => (
            <StageInput
              key={key}
              label={label}
              value={fields[key] ?? ''}
              onChange={(v) => onFieldChange(key, v)}
              onGenerate={() => onGenerate(key)}
              isGenerating={isGenerating(key)}
              multiline
              placeholder=""
              hint={hint}
            />
          ))}
        </PipelineStage>
      );

    case 'character_system':
      return (
        <PipelineStage
          title="Character System"
          description="Enneagram typing for the protagonist and supporting characters. Use Generate All or type manually."
          onSubmit={onSubmit}
          isSubmitting={submitting}
          submitLabel="Generate All & Continue"
        >
          <StageInput
            label="Protagonist type (1–9) or leave blank to generate"
            value={fields.protagonist_type ?? ''}
            onChange={(v) => onFieldChange('protagonist_type', v)}
            onGenerate={() => onGenerate('protagonist_type')}
            isGenerating={isGenerating('protagonist_type')}
            placeholder="e.g. 6"
            hint="Generates core fear, core desire, under stress, at best — plus 3–4 supporting characters and a relational map."
          />
        </PipelineStage>
      );

    case 'story_architecture':
      return (
        <PipelineStage
          title="Story Architecture"
          description="The eight structural pillars. Each can be typed manually or generated."
          onSubmit={onSubmit}
          isSubmitting={submitting}
        >
          {(
            [
              ['ghost',           'Ghost',           'The formative wound that created the impediment'],
              ['desire',          'Desire',           'The conscious want driving the protagonist forward'],
              ['opponent',        'Opponent',         'The force that most directly blocks the desire'],
              ['plan',            'Plan',             'The protagonist\'s initial strategy'],
              ['battle',          'Battle',           'The climactic confrontation between desire and opponent'],
              ['self_revelation', 'Self-Revelation',  'The realisation at the moment of greatest pressure'],
              ['moral_decision',  'Moral Decision',   'The choice that demonstrates the internal change'],
              ['new_equilibrium', 'New Equilibrium',  'The world after the transformation'],
            ] as [string, string, string][]
          ).map(([key, label, hint]) => (
            <StageInput
              key={key}
              label={label}
              value={fields[key] ?? ''}
              onChange={(v) => onFieldChange(key, v)}
              onGenerate={() => onGenerate(key)}
              isGenerating={isGenerating(key)}
              multiline
              hint={hint}
            />
          ))}
        </PipelineStage>
      );

    case 'logline':
      return (
        <PipelineStage
          title="Logline"
          description="One sentence. Protagonist, impediment, objective, paradox."
          onSubmit={onSubmit}
          isSubmitting={submitting}
        >
          <StageInput
            label="Logline"
            value={fields.logline ?? ''}
            onChange={(v) => onFieldChange('logline', v)}
            onGenerate={() => onGenerate('logline')}
            isGenerating={isGenerating('logline')}
            multiline
            placeholder="Type your logline or click Generate."
          />
          {project.story_bible && (
            <div className="text-xs text-neutral-600 space-y-0.5 pt-1">
              {project.story_bible.genre?.length > 0 && (
                <p>Genre: {project.story_bible.genre.join(', ')}</p>
              )}
              {project.story_bible.protagonist && (
                <p>Protagonist: {project.story_bible.protagonist}</p>
              )}
            </div>
          )}
        </PipelineStage>
      );

    case 'story_map':
      return (
        <PipelineStage
          title="Story Map"
          description="17 beats across three acts. Click Generate All, then edit any beat manually before confirming."
          onSubmit={onSubmit}
          isSubmitting={submitting}
          submitLabel="Generate All & Confirm"
        >
          {STORY_MAP_BEATS.map((beat) => (
            <StageInput
              key={beat}
              label={`${BEAT_ACTS[beat as StoryMapBeat]} — ${STORY_MAP_BEAT_LABELS[beat as StoryMapBeat]}`}
              value={fields[beat] ?? ''}
              onChange={(v) => onFieldChange(beat, v)}
              multiline
              placeholder="Leave blank to generate"
            />
          ))}
        </PipelineStage>
      );

    default:
      return null;
  }
}

// ── Completed pipeline view ──────────────────────────────────────────────────

function CompletedView({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-8 py-4">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Pipeline complete</h2>
        <p className="text-sm text-neutral-500">
          {project.title} — story map ready
        </p>
      </div>

      <LoglineDisplay logline={project.logline} />

      {project.story_map && Object.keys(project.story_map).length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">
            Story Map
          </h3>
          <div className="flex flex-col gap-4">
            {STORY_MAP_BEATS.map((beat) => {
              const value = (project.story_map as Record<string, string>)[beat];
              if (!value) return null;
              return (
                <div key={beat} className="flex flex-col gap-1">
                  <p className="text-xs text-neutral-500">
                    {BEAT_ACTS[beat as StoryMapBeat]} &middot; {STORY_MAP_BEAT_LABELS[beat as StoryMapBeat]}
                  </p>
                  <p className="text-sm text-white leading-relaxed">{value}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex gap-3 pt-4 border-t border-neutral-800">
        <button
          disabled
          className="px-4 py-2 text-sm font-medium rounded border border-neutral-700 text-neutral-500 cursor-not-allowed"
        >
          Download PDF (Phase 3)
        </button>
        <button
          disabled
          className="px-4 py-2 text-sm font-medium rounded border border-neutral-700 text-neutral-500 cursor-not-allowed"
        >
          Export to Final Draft (Phase 3)
        </button>
      </div>
    </div>
  );
}

// ── Input builder — shapes field state into the advance payload ──────────────

function buildInput(stage: Stage, fields: FieldMap): Record<string, unknown> {
  switch (stage) {
    case 'idea':
      return {
        raw_input:   fields.raw_input ?? '',
        protagonist: fields.protagonist ?? '',
      };

    case 'genre_tone':
      return {
        genres: (fields.genres ?? '').split(',').map((s) => s.trim()).filter(Boolean),
        tone:   fields.tone ?? '',
      };

    case 'core_story':
      return {
        psychological_impediment: fields.psychological_impediment ?? '',
        external_objective:       fields.external_objective       ?? '',
        internal_resolution:      fields.internal_resolution      ?? '',
        structural_paradox:       fields.structural_paradox       ?? '',
      };

    case 'character_system':
      return {
        protagonist_type: fields.protagonist_type ? parseInt(fields.protagonist_type, 10) : undefined,
      };

    case 'story_architecture':
      return {
        ghost:           fields.ghost           ?? '',
        desire:          fields.desire          ?? '',
        opponent:        fields.opponent        ?? '',
        plan:            fields.plan            ?? '',
        battle:          fields.battle          ?? '',
        self_revelation: fields.self_revelation ?? '',
        moral_decision:  fields.moral_decision  ?? '',
        new_equilibrium: fields.new_equilibrium ?? '',
      };

    case 'logline':
      return { logline: fields.logline ?? '' };

    case 'story_map': {
      const beats: Record<string, string> = {};
      STORY_MAP_BEATS.forEach((beat) => {
        if (fields[beat]) beats[beat] = fields[beat];
      });
      return beats;
    }

    default:
      return fields;
  }
}
