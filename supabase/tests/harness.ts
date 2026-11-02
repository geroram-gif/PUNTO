/**
 * Harness de los tests de base de datos: levanta un Postgres embebido (PGlite) en un proceso
 * aparte, simula el entorno de Supabase (roles anon/authenticated/service_role, schema `auth`,
 * `auth.uid()`) y aplica las migraciones reales de supabase/migrations en orden.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = path.resolve(__dirname, '../..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');

/** Lo mínimo del entorno de Supabase que las migraciones dan por existente. */
const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  create schema auth;
  create schema extensions;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
  grant usage on schema auth, extensions to anon, authenticated, service_role;
  grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export class DbError extends Error {
  code?: string;
  constructor(e: { message: string; code?: string }) {
    super(e.message);
    this.code = e.code;
  }
}

export class Db {
  private proc: ChildProcessWithoutNullStreams;
  private pending = new Map<
    number,
    { resolve: (v: unknown[]) => void; reject: (e: Error) => void }
  >();
  private seq = 1;
  private ready: Promise<void>;

  constructor() {
    this.proc = spawn('node', [path.join(__dirname, 'db-worker.mjs')], { cwd: ROOT });
    const rl = readline.createInterface({ input: this.proc.stdout });
    this.ready = new Promise((resolve, reject) => {
      this.proc.once('error', reject);
      rl.on('line', (line) => {
        const m = JSON.parse(line);
        if (m.ready) return resolve();
        const p = this.pending.get(m.id);
        if (!p) return;
        this.pending.delete(m.id);
        if (m.error) p.reject(new DbError(m.error));
        else p.resolve(m.rows);
      });
    });
    this.proc.stderr.on('data', (d) => process.stderr.write(d));
  }

  private async call(op: 'exec' | 'query', sql: string, params?: unknown[]) {
    await this.ready;
    const id = this.seq++;
    return new Promise<unknown[]>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify({ id, op, sql, params }) + '\n');
    });
  }

  exec(sql: string) {
    return this.call('exec', sql);
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.call('query', sql, params)) as T[];
  }

  /** Actúa como un usuario autenticado de Supabase (rol `authenticated` + `auth.uid()`). */
  async as(userId: string | null) {
    await this.exec(
      userId
        ? `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false), set_config('request.jwt.claim.role', 'authenticated', false);`
        : `set role anon; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claim.role', 'anon', false);`,
    );
  }

  /** Vuelve al superusuario (para sembrar datos salteando RLS). */
  async admin() {
    await this.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }

  /** Aislamiento por test: todo lo que pase entre begin() y rollback() se descarta. */
  begin() {
    return this.exec('begin');
  }
  async rollback() {
    await this.exec('rollback');
    await this.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }

  /**
   * Llama a una función pública como lo hace PostgREST: argumentos por nombre, casteados
   * al tipo declarado. Devuelve el valor de la función.
   */
  async rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const names = Object.keys(args);
    const sig = await this.query<{ args: string[]; types: string[] }>(
      `select p.proargnames as args, array(select format_type(t, null) from unnest(p.proargtypes::oid[]) t) as types
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1`,
      [fn],
    );
    if (!sig.length) throw new Error(`rpc: la función public.${fn} no existe`);
    const typeOf = (n: string) => {
      const i = sig[0].args.indexOf(n);
      if (i < 0) throw new Error(`rpc: ${fn} no tiene el parámetro ${n}`);
      return sig[0].types[i];
    };
    const call = names.map((n, i) => `${n} := $${i + 1}::${typeOf(n)}`).join(', ');
    const params = names.map((n) => {
      const v = args[n];
      return typeof v === 'object' && v !== null && !Array.isArray(v)
        ? JSON.stringify(v)
        : Array.isArray(v) && typeOf(n) === 'jsonb'
          ? JSON.stringify(v)
          : v;
    });
    const rows = await this.query<Record<string, T>>(`select public.${fn}(${call}) as r`, params);
    return rows[0].r;
  }

  /** Crea el entorno de Supabase y aplica todas las migraciones. */
  async migrate() {
    await this.exec(SUPABASE_STUB);
    const files = fs
      .readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const f of files) {
      try {
        await this.exec(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'));
      } catch (e) {
        throw new Error(`Migración ${f}: ${(e as Error).message}`);
      }
    }
  }

  async close() {
    this.proc.stdin.end();
  }
}

/** Uuid de prueba legible: u(1) → 00000000-0000-0000-0000-000000000001 */
export const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

/**
 * Un "cliente de Supabase" para la app que habla con esta base: cada llamada se ejecuta como el
 * usuario actual (rol `authenticated` + `auth.uid()`), igual que PostgREST. Los errores vuelven
 * con el mismo formato ({ message, code }) que los de supabase-js. Requiere estar dentro de una
 * transacción (los tests hacen begin/rollback).
 */
export function rpcClient(db: Db, currentUser: () => string | null) {
  return {
    /** Cada llamada es su propia "transacción" (savepoint): un error no arrastra a las siguientes. */
    async rpc(fn: string, args: Record<string, unknown> = {}) {
      await db.exec('savepoint rpc_call');
      try {
        await db.as(currentUser());
        const data = await db.rpc(fn, args);
        await db.exec('release savepoint rpc_call');
        return { data, error: null };
      } catch (e) {
        const err = e as DbError;
        await db.exec('rollback to savepoint rpc_call');
        return { data: null, error: { message: err.message, code: err.code } };
      }
    },
  };
}
