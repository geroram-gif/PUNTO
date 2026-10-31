import { router, type Href } from 'expo-router';

import type { PuntoActions } from '@/lib/store';

/**
 * Navegación del prototipo traducida a Expo Router:
 *   openGroup  → pestaña Grupos con ese grupo (el grupo actual vive en el store)
 *   openH2H    → cara a cara dentro de la pestaña Grupos
 *   openRegister → modal de registro (con grupo preseleccionado si viene de un grupo)
 */
export function openGroup(actions: PuntoActions, groupId: string, tab?: string) {
  actions.selectGroup(groupId);
  router.navigate((tab ? `/groups?tab=${tab}` : '/groups') as Href);
}

export function openH2H(
  rival: string,
  groupId: string,
  from: 'home' | 'group' | 'profile' | 'result',
) {
  router.push(`/groups/h2h?rival=${rival}&group=${groupId}&from=${from}` as Href);
}

export function openRegister(groupId?: string | null) {
  router.push((groupId ? `/match/new?group=${groupId}` : '/match/new') as Href);
}

export function openEdit(matchId: string) {
  router.push(`/match/new?edit=${matchId}` as Href);
}

/** «Volver»: a la pantalla anterior o, si no hay, a Inicio (como el prototipo). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.navigate('/');
}
