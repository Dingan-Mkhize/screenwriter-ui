import axios, { AxiosError } from 'axios';
import type {
  Project,
  Stage,
  EntryMode,
  AdvanceResponse,
  SessionResponse,
  CurrentStageResponse,
  ApiError,
} from './types';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token from localStorage on every request
client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap Axios errors so callers get a plain ApiError shape
function unwrapError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data) {
    throw err.response.data as ApiError;
  }
  throw err;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<SessionResponse> {
  try {
    const { data } = await client.post<SessionResponse>('/api/v1/sessions', { email, password });
    return data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function logout(): Promise<void> {
  try {
    await client.delete('/api/v1/sessions');
  } catch {
    // Stateless auth — failure here is non-fatal; client discards token regardless
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  try {
    const { data } = await client.get<{ projects: Project[] }>('/api/v1/projects');
    return data.projects;
  } catch (err) {
    unwrapError(err);
  }
}

export async function createProject(title: string): Promise<Project> {
  try {
    const { data } = await client.post<{ project: Project }>('/api/v1/projects', { title });
    return data.project;
  } catch (err) {
    unwrapError(err);
  }
}

export async function getProject(id: number | string): Promise<Project> {
  try {
    const { data } = await client.get<{ project: Project }>(`/api/v1/projects/${id}`);
    return data.project;
  } catch (err) {
    unwrapError(err);
  }
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export async function advanceStage(
  projectId: number | string,
  stage: Stage,
  input: Record<string, unknown>,
  entryMode: EntryMode
): Promise<AdvanceResponse> {
  try {
    const { data } = await client.post<AdvanceResponse>(
      `/api/v1/pipeline/${projectId}/advance`,
      { stage, input, entry_mode: entryMode }
    );
    return data;
  } catch (err) {
    unwrapError(err);
  }
}

export async function getCurrentStage(projectId: number | string): Promise<CurrentStageResponse> {
  try {
    const { data } = await client.get<CurrentStageResponse>(
      `/api/v1/pipeline/${projectId}/current`
    );
    return data;
  } catch (err) {
    unwrapError(err);
  }
}

// ── Auth token helpers (localStorage) ────────────────────────────────────────

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}
