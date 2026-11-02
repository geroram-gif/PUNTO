import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { CourtArt } from '@/components/CourtArt';
import { EmptyState } from '@/components/EmptyState';
import { GroupCard } from '@/components/GroupCard';
import { HeadToHeadSummary } from '@/components/HeadToHeadSummary';
import { LoadingState } from '@/components/LoadingState';
import { MatchCard } from '@/components/MatchCard';
import { StreakCard } from '@/components/StreakCard';
import { Button, Txt, useTopInset, Wordmark } from '@/components/ui';
import { WinRateCard } from '@/components/WinRateCard';
import { usePunto } from '@/lib/store';
import { colors, palette, radius } from '@/theme';

import { openGroup, openH2H } from '../navigation';
import { useCtx } from '../useCtx';
import { homeVM } from './vm';

const SOON = 'Primeros pasos (crear o unirte a un grupo) se diseña en la próxima iteración.';

/** 01 · Inicio */
export function HomeScreen() {
  const { state, actions, isRemote } = usePunto();
  const c = useCtx();
  const vm = useMemo(() => homeVM(c), [c]);
  const top = useTopInset();
  if (state.loading) return <LoadingState />;
  const goProfile = () => router.navigate('/profile');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.navy }}
      contentContainerStyle={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
        }}
      >
        <Wordmark />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a tu perfil"
          onPress={goProfile}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: palette.coral,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt w={700} s={15} c={palette.navy}>
            {vm.meInitials}
          </Txt>
        </Pressable>
      </View>
      <View style={{ gap: 4, paddingTop: 4, paddingBottom: 2 }}>
        <Txt s={15} c={colors.text.onDarkSecondary}>
          {vm.dateLabel}
        </Txt>
        <Txt accessibilityRole="header" d w={700} s={32} tr={-0.02} c={palette.cream}>
          Hola, {vm.meName}.
        </Txt>
      </View>

      {vm.hasData && vm.win && vm.streak ? (
        <View style={{ gap: 14 }}>
          <WinRateCard win={vm.win} onPress={goProfile} />
          <StreakCard s={vm.streak} />
          {vm.rival ? (
            <HeadToHeadSummary
              variant="home"
              kicker={'Cara a cara · ' + vm.rival.group}
              title={vm.rival.title}
              text={vm.rival.text}
              score={vm.rival.score}
              onPress={() => openH2H(vm.rival!.rivalId, vm.rival!.groupId, 'home')}
            />
          ) : null}
          {vm.last ? (
            <View style={{ gap: 8 }}>
              <Txt
                accessibilityRole="header"
                d
                w={700}
                s={18}
                c={palette.cream}
                style={{ marginTop: 4 }}
              >
                Tu último partido
              </Txt>
              <MatchCard
                m={vm.last}
                variant="dark"
                onPress={() => actions.openMatch(vm.last!.id)}
              />
            </View>
          ) : null}
          <View style={{ gap: 8 }}>
            <Txt
              accessibilityRole="header"
              d
              w={700}
              s={18}
              c={palette.cream}
              style={{ marginTop: 6 }}
            >
              Movimiento en tus grupos
            </Txt>
            <View
              style={{
                backgroundColor: palette.navy2,
                borderRadius: radius.card,
                paddingVertical: 2,
                paddingHorizontal: 16,
              }}
            >
              {vm.activity.map((a) => (
                <Pressable
                  key={a.matchId}
                  accessibilityRole="button"
                  accessibilityLabel={a.aria}
                  onPress={() => actions.openMatch(a.matchId)}
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
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: a.gbg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt d w={800} s={11} c={palette.navy}>
                      {a.gini}
                    </Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Txt w={600} s={14} c={palette.cream} ell>
                      {a.title}
                    </Txt>
                    <Txt s={12} c={colors.text.onDarkSecondary} ell>
                      {a.meta}
                    </Txt>
                  </View>
                  <Txt d w={700} s={13} c={palette.cream} num>
                    {a.score}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <EmptyState
          tone="dark"
          card={false}
          title="Tu historia arranca con el primer partido."
          titleSize={30}
          text="Armá un grupo con los tuyos o sumate con una invitación. Las estadísticas aparecen solas cuando carguen resultados."
          art={<CourtArt variant="home" />}
          style={{ gap: 18, paddingTop: 10 }}
        >
          <Button
            label="Crear un grupo"
            onPress={() => (isRemote ? router.push('/group/new') : actions.showToast(SOON))}
          />
          <Button
            label="Tengo una invitación"
            tone="outlineLight"
            onPress={() => (isRemote ? router.push('/join') : actions.showToast(SOON))}
          />
          <Txt s={13} c={colors.text.onDarkSecondary} align="center">
            ¿Alguno no tiene la app? Lo sumás como invitado.
          </Txt>
        </EmptyState>
      )}

      {vm.groups.length ? (
        <View style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: 8,
            }}
          >
            <Txt accessibilityRole="header" d w={700} s={18} c={palette.cream}>
              Tus grupos
            </Txt>
            <Txt s={13} c={colors.text.onDarkSecondary}>
              {vm.groupsCount}
            </Txt>
          </View>
          {vm.groups.map((g) => (
            <GroupCard key={g.id} {...g} onPress={() => openGroup(actions, g.id)} />
          ))}
          {isRemote ? (
            <View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
              <Button
                label="Crear un grupo"
                tone="outlineLight"
                height={50}
                size={15}
                style={{ flex: 1 }}
                onPress={() => router.push('/group/new')}
              />
              <Button
                label="Tengo una invitación"
                tone="outlineLight"
                height={50}
                size={15}
                style={{ flex: 1 }}
                onPress={() => router.push('/join')}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
