import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Bar } from '@/components/Bar';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { GroupCard } from '@/components/GroupCard';
import { LoadingState } from '@/components/LoadingState';
import { MatchHistoryRow } from '@/components/MatchHistoryRow';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { ScopeBadge } from '@/components/ScopeBadge';
import { StreakCard } from '@/components/StreakCard';
import { Icon, Label, Txt, useTopInset } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { colors, palette, protoColors, radius } from '@/theme';

import { openGroup, openH2H } from '../navigation';
import { useCtx } from '../useCtx';
import { profileVM } from './vm';

const SETTINGS = [
  { label: 'Editar perfil', note: 'Próxima iteración', strong: false },
  { label: 'Privacidad', note: 'Historial global: solo vos', strong: false },
  { label: 'Cerrar sesión', note: 'Próxima iteración', strong: false },
  { label: 'Eliminar cuenta', note: 'Con confirmación · próxima iteración', strong: true },
];

function H2({ children }: { children: string }) {
  return (
    <Txt accessibilityRole="header" d w={700} s={20} style={{ marginTop: 10 }}>
      {children}
    </Txt>
  );
}

function Stat({
  value,
  label,
  color = palette.cream,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt d w={700} s={24} c={color} num>
        {value}
      </Txt>
      <Txt s={12} c={colors.text.onDarkSecondary}>
        {label}
      </Txt>
    </View>
  );
}

/** 05 · Perfil global (todos los grupos, cada partido una sola vez). */
export function ProfileScreen() {
  const { state, actions } = usePunto();
  const c = useCtx();
  const vm = useMemo(() => profileVM(c), [c]);
  const [settings, setSettings] = useState(false);
  const top = useTopInset();
  if (state.loading) return <LoadingState />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.cream }}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View
        style={{
          backgroundColor: palette.navy,
          paddingTop: top,
          paddingHorizontal: 20,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          gap: 18,
          overflow: 'hidden',
        }}
      >
        <View
          style={{ position: 'absolute', right: -60, top: 30, opacity: 0.12 }}
          pointerEvents="none"
        >
          <Svg width={260} height={200} viewBox="0 0 260 200" aria-hidden>
            <Rect
              x={10}
              y={10}
              width={240}
              height={180}
              rx={3}
              stroke={palette.cream}
              strokeWidth={1.5}
              fill="none"
            />
            <Path
              d="M130 10v180M10 100h240M70 10v180M190 10v180"
              stroke={palette.cream}
              strokeWidth={1.5}
            />
          </Svg>
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <ScopeBadge label={vm.scope} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            onPress={() => setSettings(true)}
            style={{
              width: 44,
              height: 44,
              marginRight: -10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="settings" color={palette.cream} stroke={1.75} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <PlayerAvatar av={c.av(c.me, true)} size={72} fontSize={24} display />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Txt accessibilityRole="header" d w={800} s={26} tr={-0.02} c={palette.cream} ell>
              {vm.fullName}
            </Txt>
            <Txt s={14} c={colors.text.onDarkSecondary}>
              {vm.since}
            </Txt>
          </View>
        </View>
        {vm.hasData ? (
          <View
            accessible
            accessibilityLabel={
              '% de victorias global: ' +
              vm.pct +
              ' por ciento. ' +
              vm.pj +
              ' jugados, ' +
              vm.g +
              ' ganados, ' +
              vm.p +
              ' perdidos.'
            }
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ gap: 4 }}>
              <Txt s={14} c={colors.text.onDarkSecondary}>
                % de victorias global
              </Txt>
              <Txt d w={800} s={92} lh={0.85} tr={-0.05} c={palette.cream} num>
                {vm.pct}%
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 18, paddingBottom: 2 }}>
              <Stat value={vm.pj} label="PJ" />
              <Stat value={vm.g} label="G" color={palette.lime} />
              <Stat value={vm.p} label="P" />
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 20, gap: 12 }}>
        {vm.hasData && vm.streak ? (
          <>
            <StreakCard s={vm.streak} size="profile" />
            <View
              accessible
              accessibilityLabel={
                'Sets: ' +
                vm.setsW +
                ' ganados, ' +
                vm.setsL +
                ' perdidos, ' +
                vm.setsPct +
                ' por ciento'
              }
              style={{
                backgroundColor: palette.white,
                borderWidth: 1,
                borderColor: palette.creamLine,
                borderRadius: radius.card,
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Txt w={600} s={15}>
                  Sets
                </Txt>
                <Txt s={13} c={colors.text.onLightSecondary} num>
                  {vm.setsW} ganados · {vm.setsL} perdidos
                </Txt>
              </View>
              <Bar
                ratio={vm.setsRatio}
                width={110}
                height={10}
                track={palette.creamLine}
                fill={palette.navy}
              />
              <Txt d w={700} s={18} num>
                {vm.setsPct}%
              </Txt>
            </View>

            <H2>Por grupo</H2>
            {vm.groups.map((g) => (
              <GroupCard
                key={g.id}
                variant="compact"
                {...g}
                onPress={() => openGroup(actions, g.id)}
              />
            ))}
            <Txt s={13} lh={1.45} c={palette.slate}>
              {vm.sumNote}
            </Txt>

            <H2>Con quién y contra quién</H2>
            <View
              style={{
                backgroundColor: palette.lilac,
                borderRadius: radius.card,
                padding: 16,
                gap: 6,
              }}
            >
              <Label>Compañeros frecuentes</Label>
              {vm.partners.map((p) => (
                <View
                  key={p.id}
                  accessible
                  accessibilityLabel={p.name + ', ' + p.group + ', ' + p.meta}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
                >
                  <PlayerAvatar av={p.av} size={34} ring={palette.cream} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt w={600} s={15} ell>
                      {p.name}
                    </Txt>
                    <Txt s={12} ell>
                      {p.group}
                    </Txt>
                  </View>
                  <Txt s={13} num>
                    {p.meta}
                  </Txt>
                </View>
              ))}
            </View>
            <View
              style={{
                backgroundColor: palette.navy,
                borderRadius: radius.card,
                padding: 16,
                gap: 6,
              }}
            >
              <Label c={colors.text.onDarkSecondary}>Rivales frecuentes</Label>
              {vm.rivals.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={r.aria}
                  onPress={() => openH2H(r.id, r.groupId, 'profile')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
                >
                  <PlayerAvatar av={r.av} size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt w={600} s={15} c={palette.cream} ell>
                      {r.name}
                    </Txt>
                    <Txt s={12} c={colors.text.onDarkSecondary} ell>
                      {r.meta}
                    </Txt>
                  </View>
                  <Txt d w={800} s={20} c={palette.cream} num>
                    {r.score}
                  </Txt>
                  <Icon name="chevron" size={18} color={palette.cream} />
                </Pressable>
              ))}
            </View>

            <H2>Últimos partidos</H2>
            <View
              style={{
                backgroundColor: palette.white,
                borderWidth: 1,
                borderColor: palette.creamLine,
                borderRadius: radius.card,
                paddingVertical: 2,
                paddingHorizontal: 16,
              }}
            >
              {vm.recent.map((m) => (
                <MatchHistoryRow
                  key={m.matchId}
                  {...m}
                  onPress={() => actions.openMatch(m.matchId)}
                />
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            tone="card"
            title="Tu perfil arranca con tu primer partido."
            text="Acá se suman todos los partidos que juegues, en todos tus grupos, una sola vez cada uno."
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            paddingVertical: 6,
            paddingHorizontal: 4,
          }}
        >
          <Icon name="lock" size={18} color={palette.graphite} stroke={1.75} />
          <Txt s={13} lh={1.45} c={colors.text.onLightSecondary} style={{ flex: 1 }}>
            Tu historial global es privado. En cada grupo ven solo lo que jugaste ahí.
          </Txt>
        </View>
      </View>

      <BottomSheet visible={settings} title="Ajustes" onClose={() => setSettings(false)}>
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
          {SETTINGS.map((s) => (
            <View
              key={s.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                minHeight: 52,
                borderBottomWidth: 1,
                borderBottomColor: protoColors.creamRule,
              }}
            >
              <Txt w={s.strong ? 700 : 500} s={15}>
                {s.label}
              </Txt>
              <Txt w={600} s={12} c={palette.slate} align="right" style={{ flexShrink: 1 }}>
                {s.note}
              </Txt>
            </View>
          ))}
        </View>
        <Txt s={13} lh={1.45} c={colors.text.onLightSecondary}>
          Ajustes, privacidad y eliminar cuenta se diseñan en la próxima iteración. Borrar la cuenta
          va a pedir confirmación explícita.
        </Txt>
      </BottomSheet>
    </ScrollView>
  );
}
