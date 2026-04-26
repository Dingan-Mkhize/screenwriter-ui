// Pipeline stages — match Rails enum exactly
export type Stage =
  | 'idea'
  | 'genre_tone'
  | 'core_story'
  | 'character_system'
  | 'story_architecture'
  | 'logline'
  | 'story_map'
  | 'complete';

export const STAGE_LABELS: Record<Stage, string> = {
  idea:               'Idea',
  genre_tone:         'Genre & Tone',
  core_story:         'Core Story Engine',
  character_system:   'Character System',
  story_architecture: 'Story Architecture',
  logline:            'Logline',
  story_map:          'Story Map',
  complete:           'Complete',
};

export const STAGE_NUMBERS: Record<Stage, number> = {
  idea:               0,
  genre_tone:         1,
  core_story:         2,
  character_system:   3,
  story_architecture: 4,
  logline:            5,
  story_map:          6,
  complete:           7,
};

export const ORDERED_STAGES: Stage[] = [
  'idea',
  'genre_tone',
  'core_story',
  'character_system',
  'story_architecture',
  'logline',
  'story_map',
  'complete',
];

// Entry mode
export type FieldEntryMode = 'manual' | 'generated';
export type EntryMode = 'manual' | 'generated' | Record<string, FieldEntryMode>;

// Story Bible shapes — mirror Rails story_bible JSONB structure
export interface NarrativeEngine {
  psychological_impediment: string;
  psychological_impediment_source?: string;
  external_objective: string;
  external_objective_source?: string;
  internal_resolution: string;
  internal_resolution_source?: string;
  structural_paradox: string;
  structural_paradox_source?: string;
}

export interface StructuralPillars {
  ghost: string;
  desire: string;
  opponent: string;
  plan: string;
  battle: string;
  self_revelation: string;
  moral_decision: string;
  new_equilibrium: string;
}

export interface SupportingCharacter {
  role: string;
  type: number;
  label: string;
  core_fear: string;
  core_desire: string;
  dynamic: string;
}

export interface SupportingCharacterBible {
  role: string;
  type: number;
  type_label: string;
  core_fear: string;
  core_desire: string;
  dynamic_with_protagonist: string;
}

export interface ProtagonistData {
  type: number;
  label: string;
  core_fear: string;
  core_desire: string;
  under_stress: string;
  at_best: string;
}

export interface StoryBible {
  narrative_engine: NarrativeEngine;
  protagonist: string;
  ghost: string;
  opponent: string;
  self_revelation: string;
  moral_argument: string;
  genre: string[];
  tone: string;
  structural_pillars: StructuralPillars;
  characters: {
    protagonist_type: number;
    protagonist_type_label: string;
    protagonist_core_fear: string;
    protagonist_core_desire: string;
    supporting: SupportingCharacterBible[];
    relational_map: string;
  };
}

// Pipeline data — mirror Rails pipeline_data JSONB structure
export interface PipelineData {
  idea?: {
    raw_input: string;
    claude_response?: string;
  };
  genre_tone?: {
    genres: string[];
    tone: string;
    claude_response?: string;
  };
  core_story?: {
    psychological_impediment: string;
    external_objective: string;
    internal_resolution: string;
    structural_paradox: string;
    claude_response?: string;
  };
  character_system?: {
    protagonist: ProtagonistData;
    supporting: SupportingCharacter[];
    relational_map: string;
    claude_response?: string;
  };
  story_architecture?: {
    pillars: StructuralPillars;
    claude_response?: string;
  };
  logline?: {
    generated: string;
    confirmed: string;
  };
  story_map?: Partial<Record<StoryMapBeat, string>>;
}

// Story map — 17 beats in order
export const STORY_MAP_BEATS = [
  'status_quo',
  'thematic_statement',
  'contextual_exposition',
  'inciting_event',
  'deliberation',
  'threshold_crossing',
  'relationship_initiation',
  'rising_action',
  'first_pressure_point',
  'structural_reversal',
  'escalating_stakes',
  'second_pressure_point',
  'critical_failure',
  'internalization',
  'decision_to_resolve',
  'climactic_action',
  'new_equilibrium',
] as const;

export type StoryMapBeat = (typeof STORY_MAP_BEATS)[number];

export const STORY_MAP_BEAT_LABELS: Record<StoryMapBeat, string> = {
  status_quo:             'Status Quo',
  thematic_statement:     'Thematic Statement',
  contextual_exposition:  'Contextual Exposition',
  inciting_event:         'Inciting Event',
  deliberation:           'Deliberation Phase',
  threshold_crossing:     'Threshold Crossing',
  relationship_initiation:'Relationship Initiation',
  rising_action:          'Rising Action',
  first_pressure_point:   'First Pressure Point',
  structural_reversal:    'Structural Reversal',
  escalating_stakes:      'Escalating Stakes',
  second_pressure_point:  'Second Pressure Point',
  critical_failure:       'Critical Failure',
  internalization:        'Internalization',
  decision_to_resolve:    'Decision to Resolve',
  climactic_action:       'Climactic Action',
  new_equilibrium:        'New Equilibrium',
};

export const BEAT_ACTS: Record<StoryMapBeat, string> = {
  status_quo:             'Act I',
  thematic_statement:     'Act I',
  contextual_exposition:  'Act I',
  inciting_event:         'Act I',
  deliberation:           'Act I',
  threshold_crossing:     'Transition',
  relationship_initiation:'Act IIa',
  rising_action:          'Act IIa',
  first_pressure_point:   'Act IIa',
  structural_reversal:    'Midpoint',
  escalating_stakes:      'Act IIb',
  second_pressure_point:  'Act IIb',
  critical_failure:       'Act IIb',
  internalization:        'Act IIb',
  decision_to_resolve:    'Act IIb',
  climactic_action:       'Act III',
  new_equilibrium:        'Act III',
};

// Project
export interface Project {
  id: number;
  title: string;
  current_stage: Stage;
  current_stage_number: number;
  pipeline_data: PipelineData;
  story_bible: StoryBible;
  logline: string | null;
  story_map: Partial<Record<StoryMapBeat, string>> & { export_ready?: boolean };
  created_at: string;
  updated_at: string;
}

// API response shapes
export interface ConsistencyResult {
  valid: boolean;
  conflicts: string[];
  amber_flag: boolean;
}

export interface CraftValidationResult {
  valid: boolean;
  reason: string;
}

export interface AdvanceResponse {
  project: Project;
  advance: {
    previous_stage: Stage;
    current_stage: Stage;
    generation_skipped: boolean;
    consistency: ConsistencyResult | null;
    craft_validation: CraftValidationResult | null;
  };
}

export interface SessionResponse {
  token: string;
  user: { id: number; email: string };
}

export interface CurrentStageResponse {
  project_id: number;
  stage: Stage;
  stage_number: number;
  stage_data: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  craft_validation?: CraftValidationResult;
  errors?: string[];
}
