import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export async function getWorkoutHistory(limit = 100) {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, workout_day, started_at, finished_at, duration_seconds, payload")
    .order("started_at", { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

export async function getWorkoutProgress(weekStart: string) {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from("workout_progress")
    .select("workout_day, completed, updated_at")
    .eq("week_start", weekStart);
  return { data: data ?? [], error };
}

export async function saveWorkoutProgress(progress: {
  week_start: string;
  workout_day: string;
  completed: Record<string, number>;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("Sign in before syncing progress.") };

  return supabase.from("workout_progress").upsert({
    user_id: user.id,
    week_start: progress.week_start,
    workout_day: progress.workout_day,
    completed: progress.completed,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,week_start,workout_day" }).select("workout_day").single();
}

export async function saveWorkoutSession(session: {
  workout_day: string;
  started_at: string;
  finished_at?: string | null;
  duration_seconds?: number | null;
  payload: unknown;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("Sign in before syncing a workout.") };

  return supabase.from("workout_sessions").insert({
    user_id: user.id,
    workout_day: session.workout_day,
    started_at: session.started_at,
    finished_at: session.finished_at ?? null,
    duration_seconds: session.duration_seconds ?? null,
    payload: session.payload,
  }).select("id").single();
}

export async function updateWorkoutSession(id: string, session: {
  finished_at?: string | null;
  duration_seconds?: number | null;
  payload: unknown;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.from("workout_sessions").update({
    finished_at: session.finished_at ?? null,
    duration_seconds: session.duration_seconds ?? null,
    payload: session.payload,
  }).eq("id", id).select("id").single();
}
