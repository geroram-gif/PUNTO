import { usePathname } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { MatchSummary } from '@/components/MatchSummary';
import { Toast } from '@/components/Toast';
import { Button, Txt } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { toRemoteError } from '@/lib/supabase/errors';
import { colors, palette, protoColors } from '@/theme';

import { openEdit } from '../navigation';
import { useCtx } from '../useCtx';
import { matchSheetVM } from './vm';

/**
 * Detalle de partido (MatchDetail) y confirmación de borrado (ConfirmationModal).
 * Es global: se abre desde Inicio, Grupo, Perfil, Cara a cara y Resultado.
 */
export function MatchSheetHost() {
  const { state, actions } = usePunto();
  const c = useCtx();
  const sheet = state.sheet;
  const vm = useMemo(() => matchSheetVM(c, sheet?.matchId ?? null), [c, sheet?.matchId]);
  const visible = !!sheet && !!vm;
  const isDelete = sheet?.mode === 'delete';

  const onClose = () =>
    isDelete && sheet ? actions.openMatch(sheet.matchId) : actions.closeSheet();

  const del = async () => {
    if (!sheet) return;
    try {
      await actions.deleteMatch(sheet.matchId);
    } catch (e) {
      actions.closeSheet();
      actions.showToast('No se pudo borrar. ' + toRemoteError(e).message);
      return;
    }
    actions.showToast('Partido borrado. Las estadísticas se recalcularon.');
  };

  return (
    <BottomSheet
      visible={visible}
      title={isDelete ? '¿Borrar este partido?' : 'Detalle del partido'}
      onClose={onClose}
    >
      {vm && !isDelete ? (
        <View style={{ gap: 14 }}>
          <MatchSummary
            meta={vm.meta}
            winLabel="GANARON"
            rows={[
              { name: vm.card.top, win: true, sets: vm.card.topSets },
              { name: vm.card.bot, win: false, sets: vm.card.botSets },
            ]}
          />
          <View
            style={{
              backgroundColor: palette.white,
              borderWidth: 1,
              borderColor: palette.creamLine,
              borderRadius: 16,
              paddingVertical: 4,
              paddingHorizontal: 16,
            }}
          >
            {vm.rows.map((d) => (
              <View
                key={d.k}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: protoColors.creamRule,
                }}
              >
                <Txt s={14} c={colors.text.onLightSecondary}>
                  {d.k}
                </Txt>
                <Txt w={600} s={14} num align="right" style={{ flexShrink: 1 }}>
                  {d.v}
                </Txt>
              </View>
            ))}
          </View>
          {vm.canEdit ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label="Corregir"
                tone="dark"
                height={50}
                size={15}
                style={{ flex: 1 }}
                onPress={() => {
                  const id = sheet!.matchId;
                  actions.closeSheet();
                  openEdit(id);
                }}
              />
              <Button
                label="Borrar"
                tone="outline"
                height={50}
                size={15}
                style={{ flex: 1 }}
                onPress={() => actions.openDelete(sheet!.matchId)}
              />
            </View>
          ) : null}
          <Txt s={13} lh={1.45} c={colors.text.onLightSecondary}>
            {vm.permNote}
          </Txt>
        </View>
      ) : null}
      {vm && isDelete ? (
        <View style={{ gap: 14 }}>
          <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
            {vm.del.text}
          </Txt>
          {vm.del.impact ? (
            <View
              style={{
                backgroundColor: palette.cream2,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
              }}
            >
              <Txt s={14} lh={1.45} num>
                {vm.del.impact}
              </Txt>
            </View>
          ) : null}
          <Button label="Sí, borrar partido" tone="dark" onPress={() => void del()} />
          <Button label="Cancelar" tone="outline" height={50} onPress={onClose} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

/** Toast global: arriba de la barra inferior cuando se ve, más abajo si no. */
export function ToastHost() {
  const { state } = usePunto();
  const pathname = usePathname();
  const tabsVisible = !pathname.startsWith('/match') && !pathname.startsWith('/result');
  return <Toast message={state.toast} bottom={tabsVisible ? 100 : 40} />;
}
