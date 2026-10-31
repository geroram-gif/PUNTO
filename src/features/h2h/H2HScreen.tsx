import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { CourtArt } from '@/components/CourtArt';
import { EmptyState } from '@/components/EmptyState';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { ShareCardSheet, shareCardTheme } from '@/components/ShareCard';
import { GuestTag, Icon, Txt, useTopInset } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { colors, palette, protoColors, radius } from '@/theme';

import { goBack } from '../navigation';
import { useCtx } from '../useCtx';
import { defaultH2HGroup, h2hVM } from './vm';

function Radio({
  label,
  selected,
  onPress,
  dashed,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  dashed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingLeft: children ? 6 : 16,
        paddingRight: children ? 14 : 16,
        borderRadius: radius.chip,
        borderWidth: 1.5,
        borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: selected ? palette.cream : protoColors.steel,
        backgroundColor: selected ? palette.cream : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
      <Txt w={600} s={14} c={selected ? palette.navy : palette.cream}>
        {label}
      </Txt>
    </Pressable>
  );
}

function PctBox({
  value,
  label,
  bg,
  fg,
  sub,
}: {
  value: string;
  label: string;
  bg: string;
  fg: string;
  sub?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: radius.card,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Txt d w={800} s={28} c={fg} num>
        {value}
      </Txt>
      <Txt w={sub ? 400 : 600} s={12} c={sub ?? fg} ell>
        {label}
      </Txt>
    </View>
  );
}

/** 06 · Cara a cara, dentro de la pestaña Grupos. */
export function H2HScreen() {
  const params = useLocalSearchParams<{ rival?: string; group?: string; from?: string }>();
  const { actions } = usePunto();
  const c = useCtx();
  const [rival, setRival] = useState<string | null>(params.rival ?? null);
  const [groupId, setGroupId] = useState<string | null>(
    () =>
      params.group ?? (params.rival ? defaultH2HGroup(c, params.rival) : (c.groups[0]?.id ?? null)),
  );
  const [share, setShare] = useState(false);
  const vm = useMemo(() => h2hVM(c, groupId, rival), [c, groupId, rival]);
  const top = useTopInset(54);

  const back = () => {
    if (params.from === 'home') router.navigate('/');
    else if (params.from === 'profile') router.navigate('/profile');
    else goBack();
  };
  const canShare = !!vm && vm.total > 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.navy }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: top,
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 16,
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
            accessibilityLabel="Volver"
            onPress={back}
            style={{
              width: 44,
              height: 44,
              marginLeft: -10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="back" color={palette.cream} />
          </Pressable>
          <Txt accessibilityRole="header" w={600} s={16} c={palette.cream}>
            Cara a cara
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartir cara a cara"
            accessibilityState={{ disabled: !canShare }}
            disabled={!canShare}
            onPress={() => setShare(true)}
            style={{
              width: 44,
              height: 44,
              marginRight: -10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="share" size={22} color={canShare ? palette.cream : protoColors.steel} />
          </Pressable>
        </View>

        {!vm ? (
          <EmptyState
            tone="dark"
            card={false}
            title="Sin rivales todavía."
            text="Los cara a cara aparecen cuando juegues partidos en un grupo."
            style={{ paddingTop: 40, gap: 12 }}
          />
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <Txt s={13} c={colors.text.onDarkSecondary}>
                En el grupo
              </Txt>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="Grupo de la comparación"
                style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}
              >
                {vm.groups.map((g) => (
                  <Radio
                    key={g.id}
                    label={g.name}
                    selected={g.selected}
                    onPress={() => setGroupId(g.id)}
                  />
                ))}
              </View>
              <Txt s={13} c={colors.text.onDarkSecondary} style={{ paddingTop: 4 }}>
                {vm.meName} contra
              </Txt>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                accessibilityRole="radiogroup"
                accessibilityLabel="Elegí rival"
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 2 }}
              >
                {vm.rivals.map((r) => (
                  <Radio
                    key={r.id}
                    label={r.name}
                    selected={r.selected}
                    dashed={r.guest}
                    onPress={() => setRival(r.id)}
                  >
                    <PlayerAvatar av={r.av} size={30} fontSize={10} />
                  </Radio>
                ))}
              </ScrollView>
            </View>

            <View accessibilityLabel={vm.aria} style={{ gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <PlayerAvatar av={c.av(c.me, true)} size={84} fontSize={28} display />
                  <Txt d w={700} s={18} c={palette.cream}>
                    {vm.meName}
                  </Txt>
                </View>
                <Txt d w={800} s={22} c={palette.coral}>
                  VS
                </Txt>
                <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 8 }}>
                  <PlayerAvatar av={vm.rv} size={84} fontSize={28} display />
                  <Txt d w={700} s={18} c={palette.cream} ell style={{ maxWidth: '100%' }}>
                    {vm.rvName}
                  </Txt>
                  {vm.rvGuest ? <GuestTag onDark /> : null}
                </View>
              </View>

              {vm.hasHistory ? (
                <View style={{ gap: 16 }}>
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Txt d w={800} s={116} lh={0.9} tr={-0.05} c={palette.cream} num>
                      {vm.score}
                    </Txt>
                    <Txt d w={800} s={30} tr={-0.02} c={palette.cream} align="center">
                      {vm.title}
                    </Txt>
                    <Txt s={15} c={protoColors.sand} align="center">
                      {vm.sub}
                    </Txt>
                  </View>
                  {vm.small ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        alignItems: 'flex-start',
                        borderWidth: 1.5,
                        borderStyle: 'dashed',
                        borderColor: palette.mist,
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Icon name="info" size={18} color={palette.cream} stroke={1.75} />
                      <Txt s={14} lh={1.4} c={palette.cream} style={{ flex: 1 }}>
                        Con menos de 5 cruces no sacamos conclusiones. Los números están, el
                        veredicto todavía no.
                      </Txt>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <PctBox
                      value={vm.aPct + '%'}
                      label={vm.meName}
                      bg={palette.lime}
                      fg={palette.navy}
                    />
                    <PctBox
                      value={String(vm.total)}
                      label="cruces"
                      bg={palette.navy2}
                      fg={palette.cream}
                      sub={colors.text.onDarkSecondary}
                    />
                    <PctBox
                      value={vm.bPct + '%'}
                      label={vm.rvName}
                      bg={palette.lilac}
                      fg={palette.navy}
                    />
                  </View>
                  <View
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={vm.barAria}
                    style={{ height: 12, flexDirection: 'row', gap: 3 }}
                  >
                    {vm.aPct > 0 ? (
                      <View
                        style={{
                          width: `${vm.aPct}%`,
                          backgroundColor: palette.lime,
                          borderRadius: radius.chip,
                        }}
                      />
                    ) : null}
                    <View
                      style={{ flex: 1, backgroundColor: palette.lilac, borderRadius: radius.chip }}
                    />
                  </View>
                  <View style={{ gap: 10 }}>
                    <Txt accessibilityRole="header" d w={700} s={18} c={palette.cream}>
                      Últimos cruces
                    </Txt>
                    <View
                      style={{
                        backgroundColor: palette.navy2,
                        borderRadius: radius.card,
                        paddingVertical: 2,
                        paddingHorizontal: 16,
                      }}
                    >
                      {vm.recent.map((m) => (
                        <Pressable
                          key={m.matchId}
                          accessibilityRole="button"
                          accessibilityLabel={m.aria}
                          onPress={() => actions.openMatch(m.matchId)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            minHeight: 60,
                            borderBottomWidth: 1,
                            borderBottomColor: palette.navyLine,
                          }}
                        >
                          <View
                            style={{
                              width: 60,
                              paddingVertical: 4,
                              borderRadius: 8,
                              backgroundColor: m.meWon ? palette.lime : palette.lilac,
                            }}
                          >
                            <Txt w={700} s={12} c={palette.navy} align="center" ell>
                              {m.who}
                            </Txt>
                          </View>
                          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                            <Txt w={600} s={14} c={palette.cream} ell>
                              {m.pairs}
                            </Txt>
                            <Txt s={12} c={colors.text.onDarkSecondary}>
                              {m.date}
                            </Txt>
                          </View>
                          <Txt d w={700} s={13} c={palette.cream} num>
                            {m.score}
                          </Txt>
                        </Pressable>
                      ))}
                    </View>
                    <Txt s={13} c={colors.text.onDarkSecondary}>
                      Marcador desde el lado de {vm.meName}. {vm.together}
                    </Txt>
                  </View>
                </View>
              ) : (
                <EmptyState
                  tone="dark"
                  card={false}
                  titleSize={28}
                  title="Todavía no se cruzaron."
                  text={vm.emptyText}
                  art={<CourtArt variant="h2h" />}
                  center
                  style={{ alignItems: 'center', paddingVertical: 12 }}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
      {vm ? (
        <ShareCardSheet
          visible={share && canShare}
          title="Compartir cara a cara"
          onClose={() => setShare(false)}
          card={{
            ...shareCardTheme.h2h,
            kicker: vm.share.kicker,
            big: [vm.share.big],
            size: 88,
            line: vm.share.line,
            text: vm.share.text,
          }}
        />
      ) : null}
    </View>
  );
}
