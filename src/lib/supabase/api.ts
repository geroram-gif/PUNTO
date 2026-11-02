import type { GroupId, MatchId, PlayerId } from '@/lib/stats';
import { matchFromDraft, type Draft } from '@/lib/store/draft';

import { toRemoteError } from './errors';
import { parseSnapshot, type Snapshot } from './snapshot';

/** Lo único que se le pide al cliente de Supabase (supabase-js lo cumple tal cual). */
export interface RpcClient {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
}

export interface JoinPreview {
  groupName: string;
  initials: string;
  color: string;
  members: number;
  alreadyMember: boolean;
  pending: boolean;
}

export interface ProfileInput {
  displayName: string;
  fullName: string;
  avatarColor: string;
}

/** Todo lo que la app hace contra el servidor. Cada método es una RPC: el servidor decide. */
export interface RemoteApi {
  load(): Promise<Snapshot>;
  saveProfile(p: ProfileInput): Promise<void>;
  requestAccountDeletion(): Promise<void>;
  createGroup(name: string, color: string): Promise<GroupId>;
  getInvite(groupId: GroupId): Promise<string>;
  rotateInvite(groupId: GroupId): Promise<string>;
  previewInvite(code: string): Promise<JoinPreview>;
  requestJoin(code: string): Promise<{ status: 'pending' | 'member'; groupId: GroupId }>;
  decideJoin(requestId: string, approve: boolean): Promise<void>;
  addGuest(groupId: GroupId, name: string): Promise<PlayerId>;
  recordMatch(draft: Draft): Promise<MatchId>;
  updateMatch(id: MatchId, draft: Draft): Promise<void>;
  deleteMatch(id: MatchId): Promise<void>;
}

export function createRemoteApi(client: RpcClient): RemoteApi {
  async function call<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    let res: Awaited<ReturnType<RpcClient['rpc']>>;
    try {
      res = await client.rpc(fn, args);
    } catch (e) {
      throw toRemoteError(e);
    }
    if (res.error) throw toRemoteError(res.error);
    return res.data as T;
  }

  const matchArgs = (draft: Draft) => {
    const m = matchFromDraft(draft);
    if (!m) throw toRemoteError({ message: 'El resultado no es válido', code: '22023' });
    return {
      p_played_on: m.date,
      p_format: m.format,
      p_team_a: m.teamA,
      p_team_b: m.teamB,
      p_sets: m.sets,
    };
  };

  return {
    load: async () => parseSnapshot(await call('app_snapshot')),
    saveProfile: async (p) => {
      await call('update_profile', {
        p_display_name: p.displayName,
        p_full_name: p.fullName,
        p_avatar_color: p.avatarColor,
      });
    },
    requestAccountDeletion: async () => {
      await call('request_account_deletion');
    },
    createGroup: (name, color) => call<string>('create_group', { p_name: name, p_color: color }),
    getInvite: (groupId) => call<string>('get_group_invite', { p_group_id: groupId }),
    rotateInvite: (groupId) => call<string>('rotate_group_invite', { p_group_id: groupId }),
    previewInvite: (code) => call<JoinPreview>('preview_invite', { p_code: code }),
    requestJoin: (code) => call('request_join', { p_code: code }),
    decideJoin: async (requestId, approve) => {
      await call('decide_join_request', { p_request_id: requestId, p_approve: approve });
    },
    addGuest: (groupId, name) => call<string>('add_guest', { p_group_id: groupId, p_name: name }),
    recordMatch: async (draft) => {
      const r = await call<{ id: string }>('record_match', {
        p_group_id: draft.groupId,
        ...matchArgs(draft),
      });
      return r.id;
    },
    updateMatch: async (id, draft) => {
      await call('update_match', { p_match_id: id, ...matchArgs(draft) });
    },
    deleteMatch: async (id) => {
      await call('delete_match', { p_match_id: id });
    },
  };
}
