import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GroupBadge } from '@/components/GroupCard';
import { GuestPlayerForm } from '@/components/GuestPlayerForm';
import { MatchFormatSelector } from '@/components/MatchFormatSelector';
import { MatchSummary } from '@/components/MatchSummary';
import { PlayerSelector } from '@/components/PlayerSelector';
import { SetScoreInput } from '@/components/SetScoreInput';
import { TeamAssignment } from '@/components/TeamAssignment';
import { Button, Icon, Label, Txt, useTopInset } from '@/components/ui';
import { blankDraft, usePunto, type Draft } from '@/lib/store';
import { toRemoteError } from '@/lib/supabase/errors';
import { colors, palette, protoColors, radius } from '@/theme';

import { useCtx } from '../useCtx';
import {
  bumpScore,
  clearSlot,
  draftFromMatch,
  guestError,
  pickPlayer,
  registerVM,
  selectDate,
  selectGroup,
} from './vm';

const toLocalDate = (iso: string) => {
  const p = iso.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
};
const toISO = (d: Date) =>
  d.getFullYear() +
  '-' +
  String(d.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(d.getDate()).padStart(2, '0');

function Chip({
  label,
  selected,
  onPress,
  disabled,
  badge,
  flex,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  badge?: { ini: string; bg: string };
  flex?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: flex ? 1 : undefined,
        minHeight: 44,
        paddingLeft: badge ? 6 : 0,
        paddingRight: badge ? 14 : 0,
        borderRadius: radius.chip,
        borderWidth: 1.5,
        borderColor: selected ? palette.navy : protoColors.creamEdge,
        backgroundColor: selected ? palette.navy : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {badge ? <GroupBadge ini={badge.ini} bg={badge.bg} size={32} fontSize={11} r={10} /> : null}
      <Txt w={600} s={14} c={selected ? palette.cream : palette.navy}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** 03 · Registrar partido (o corregir uno, con `?edit=<id>`). */
export function RegisterScreen() {
  const { state, actions, today } = usePunto();
  const c = useCtx();
  const params = useLocalSearchParams<{ group?: string; edit?: string }>();
  const editingId = params.edit ?? null;
  const top = useTopInset(54);
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState<Draft | null>(() => {
    if (editingId) return draftFromMatch(c, editingId);
    const gid = params.group ?? state.groupId ?? c.myGroups[0]?.id ?? null;
    return gid ? blankDraft(gid, today) : null;
  });
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Mensaje si el último intento de guardar falló (lo cargado se conserva para reintentar). */
  const [saveError, setSaveError] = useState<{ message: string; network: boolean } | null>(null);

  const vm = useMemo(() => registerVM(c, draft, !!editingId), [c, draft, editingId]);

  if (!vm || !draft)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.navy,
          paddingTop: top + 5,
          paddingHorizontal: 20,
          paddingBottom: 24,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          tone="dark"
          card={false}
          titleSize={28}
          title="Primero, un grupo."
          text="Cada partido pertenece a un grupo. Cuando tengas uno, lo cargás desde acá en un toque."
        >
          <Button
            label="Volver"
            tone="outlineLight"
            height={52}
            weight={600}
            onPress={() => router.back()}
          />
        </EmptyState>
      </View>
    );

  const update = (f: (d: Draft) => Draft) => setDraft((d) => (d ? f(d) : d));

  const addGuest = async () => {
    const err = guestError(c, draft.groupId, draft.guestName);
    if (err) return update((d) => ({ ...d, guestErr: err }));
    const name = draft.guestName.trim();
    let id: string;
    try {
      id = await actions.addGuest(draft.groupId, name);
    } catch (e) {
      return update((d) => ({ ...d, guestErr: toRemoteError(e).message }));
    }
    update((d) => {
      const slots = d.slots.slice();
      const idx = slots.indexOf(null);
      if (idx >= 0) slots[idx] = id;
      return { ...d, slots, addingGuest: false, guestName: '', guestErr: '', notice: '' };
    });
    const g = c.gById(draft.groupId);
    actions.showToast(name + ' se sumó a ' + (g ? c.gname(g) : '') + ' como invitado.');
  };

  const confirmSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await actions.editMatch(editingId, draft);
        setReview(false);
        router.back();
        actions.showToast('Partido corregido. Ranking, rachas y duplas recalculados.');
      } else {
        const id = await actions.addMatch(draft);
        setReview(false);
        router.replace(`/result/${id}` as Href);
      }
    } catch (e) {
      const err = toRemoteError(e);
      setSaveError({ message: err.message, network: err.kind === 'network' });
    } finally {
      setSaving(false);
    }
  };

  const confirmLabel = saving
    ? 'Guardando…'
    : saveError
      ? 'Reintentar'
      : editingId
        ? 'Guardar corrección'
        : 'Confirmar y guardar';

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: top,
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 22,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 44,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              marginLeft: -10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" color={palette.navy} />
          </Pressable>
          <Txt accessibilityRole="header" w={600} s={16}>
            {vm.title}
          </Txt>
          <View style={{ width: 34 }} />
        </View>

        <View style={{ gap: 10 }}>
          <Label c={colors.text.onLightSecondary}>Grupo y fecha</Label>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Grupo"
            style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}
          >
            {vm.groups.map((g) => (
              <Chip
                key={g.id}
                label={g.name}
                selected={g.selected}
                disabled={g.locked}
                badge={{ ini: g.ini, bg: g.bg }}
                onPress={() => update((d) => selectGroup(d, g.id, vm.editing))}
              />
            ))}
          </View>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Fecha del partido"
            style={{ flexDirection: 'row', gap: 8 }}
          >
            {vm.dates.map((d) => (
              <Chip
                key={d.mode}
                flex
                label={d.label}
                selected={d.selected}
                onPress={() => update((x) => selectDate(x, d.mode, today))}
              />
            ))}
          </View>
          {vm.showDateInput ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                backgroundColor: palette.white,
                borderWidth: 1,
                borderColor: protoColors.creamEdge,
                borderRadius: radius.input,
                paddingVertical: 6,
                paddingRight: 6,
                paddingLeft: 14,
              }}
            >
              <Txt w={600} s={14}>
                Fecha del partido
              </Txt>
              <DateTimePicker
                accessibilityLabel="Fecha del partido"
                mode="date"
                display="compact"
                value={toLocalDate(draft.date)}
                maximumDate={toLocalDate(today)}
                locale="es-AR"
                onChange={(_, d) => {
                  if (!d) return;
                  const v = toISO(d);
                  if (v <= today) update((x) => ({ ...x, date: v }));
                }}
              />
            </View>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <Txt accessibilityRole="header" d w={700} s={20}>
              ¿Quiénes jugaron?
            </Txt>
            <Txt s={13} c={colors.text.onLightSecondary} num>
              {vm.countLabel}
            </Txt>
          </View>
          <TeamAssignment
            a={vm.slotsA}
            b={vm.slotsB}
            onClear={(i) => update((d) => clearSlot(d, i))}
          />
          <PlayerSelector
            picker={vm.picker}
            guestOpen={draft.addingGuest}
            onPick={(id) => update((d) => pickPlayer(c, d, id))}
            onToggleGuest={() =>
              update((d) => ({ ...d, addingGuest: !d.addingGuest, guestErr: '' }))
            }
          />
          {draft.addingGuest ? (
            <GuestPlayerForm
              name={draft.guestName}
              error={draft.guestErr}
              onChange={(v) => update((d) => ({ ...d, guestName: v, guestErr: '' }))}
              onSubmit={() => void addGuest()}
            />
          ) : null}
          {draft.notice ? (
            <View
              accessibilityLiveRegion="polite"
              style={{
                flexDirection: 'row',
                gap: 8,
                alignItems: 'flex-start',
                backgroundColor: palette.cream2,
                borderRadius: radius.input,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <Icon name="info" size={18} color={palette.navy} stroke={1.75} />
              <Txt s={14} lh={1.4} style={{ flex: 1 }}>
                {draft.notice}
              </Txt>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          <Txt accessibilityRole="header" d w={700} s={20}>
            Formato
          </Txt>
          <MatchFormatSelector
            formats={vm.formats}
            onPick={(f) => update((d) => ({ ...d, format: f }))}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Txt accessibilityRole="header" d w={700} s={20}>
            Resultado
          </Txt>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }}
          >
            <View style={{ width: 54 }} />
            <Txt w={600} s={12} c={palette.slate} align="center" ell style={{ flex: 1 }}>
              {vm.teamALabel}
            </Txt>
            <Txt w={600} s={12} c={palette.slate} align="center" ell style={{ flex: 1 }}>
              {vm.teamBLabel}
            </Txt>
          </View>
          {vm.setRows.map((r) => (
            <SetScoreInput
              key={r.index}
              r={r}
              onBump={(team, delta) => update((d) => bumpScore(d, r.index, team, delta))}
            />
          ))}
          {vm.thirdHint ? (
            <Txt s={13} c={palette.slate}>
              {vm.thirdHint}
            </Txt>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          backgroundColor: palette.cream,
          borderTopWidth: 1,
          borderTopColor: palette.creamLine,
          paddingTop: 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 12),
          gap: 10,
        }}
      >
        <Txt
          accessibilityLiveRegion="polite"
          s={13}
          c={colors.text.onLightSecondary}
          align="center"
          style={{ minHeight: 18 }}
        >
          {vm.helper}
        </Txt>
        <Button
          label="Revisar partido"
          tone={vm.ok ? 'primary' : 'disabled'}
          height={56}
          size={17}
          disabled={!vm.ok}
          onPress={() => {
            setSaveError(null);
            setReview(true);
          }}
        />
      </View>

      <BottomSheet
        visible={review && !!vm.review}
        title="¿Está todo bien?"
        locked={saving}
        onClose={() => {
          setReview(false);
          setSaveError(null);
        }}
      >
        {vm.review ? (
          <>
            <MatchSummary
              meta={vm.review.meta}
              winLabel="GANAN"
              rows={[
                { name: vm.review.a, win: vm.review.winA, sets: vm.review.setsA },
                { name: vm.review.b, win: vm.review.winB, sets: vm.review.setsB },
              ]}
            />
            {saveError ? (
              <ErrorState message={saveError.network ? undefined : saveError.message} />
            ) : null}
            <Button
              label={confirmLabel}
              height={56}
              size={17}
              loading={saving}
              disabled={saving}
              onPress={() => void confirmSave()}
            />
            <Button
              label="Editar"
              tone="outline"
              height={50}
              disabled={saving}
              onPress={() => {
                setReview(false);
                setSaveError(null);
              }}
            />
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}
