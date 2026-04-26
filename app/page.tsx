'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  login,
  logout,
  getProjects,
  createProject,
  saveToken,
  clearToken,
  getToken,
} from '@/lib/api';
import type { Project, ApiError } from '@/lib/types';
import { STAGE_LABELS } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();

  const [authed, setAuthed]               = useState(false);
  const [checking, setChecking]           = useState(true);
  const [projects, setProjects]           = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Login form
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // New project
  const [newTitle, setNewTitle]       = useState('');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (getToken()) {
      setAuthed(true);
      loadProjects();
    }
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      setProjects(await getProjects());
    } catch {
      handleSignOut();
    } finally {
      setLoadingProjects(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const session = await login(email, password);
      saveToken(session.token);
      setAuthed(true);
      await loadProjects();
    } catch (err) {
      setLoginError((err as ApiError)?.error ?? 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  function handleSignOut() {
    logout();
    clearToken();
    setAuthed(false);
    setProjects([]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const project = await createProject(newTitle.trim() || 'Untitled');
      router.push(`/project/${project.id}`);
    } catch (err) {
      setCreateError((err as ApiError)?.error ?? 'Could not create project');
    } finally {
      setCreating(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-neutral-600 text-sm">Loading…</span>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-white mb-8">Screenwriter</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-neutral-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-neutral-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded text-white focus:outline-none focus:border-neutral-500"
              />
            </div>
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button
              type="submit"
              disabled={loggingIn}
              className="mt-2 px-4 py-2 text-sm font-medium rounded bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-8 py-5 border-b border-neutral-900">
        <h1 className="text-lg font-semibold">Screenwriter</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-10 flex flex-col gap-10">
        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">
            New project
          </h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Project title (optional)"
              className="flex-1 px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium rounded bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {creating ? 'Creating…' : 'Start pipeline'}
            </button>
          </form>
          {createError && <p className="mt-2 text-sm text-red-400">{createError}</p>}
        </section>

        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">
            Projects
          </h2>
          {loadingProjects && <p className="text-sm text-neutral-600">Loading…</p>}
          {!loadingProjects && projects.length === 0 && (
            <p className="text-sm text-neutral-600">No projects yet.</p>
          )}
          {!loadingProjects && projects.length > 0 && (
            <ul className="flex flex-col gap-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded border border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-white">{project.title}</span>
                    <span className="text-xs text-neutral-500">
                      {STAGE_LABELS[project.current_stage]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
