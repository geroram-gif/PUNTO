import { useMemo } from 'react';

import { usePunto } from '@/lib/store';

import { makeCtx } from './shared/ctx';

/** Contexto de presentación memoizado sobre el estado del store. */
export function useCtx() {
  const { state, config, me, today } = usePunto();
  return useMemo(
    () =>
      makeCtx(
        {
          players: state.players,
          groups: state.groups,
          matches: state.matches,
          resultId: state.resultId,
        },
        { me, today, longNames: config.longNames },
      ),
    [state.players, state.groups, state.matches, state.resultId, me, today, config.longNames],
  );
}
