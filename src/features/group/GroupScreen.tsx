import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { CourtArt } from '@/components/CourtArt';
import { DuoHighlightCard, DuoStatCard, ProvisionalDuoRow } from '@/components/DuoStatCard';
import { EmptyState } from '@/components/EmptyState';
import { GroupHeader } from '@/components/GroupHeader';
import { HeadToHeadSummary } from '@/components/HeadToHeadSummary';
import { InviteSheet } from '@/components/InviteSheet';
import { RemoteInviteSheet } from '@/components/RemoteInviteSheet';
import { LoadingState } from '@/components/LoadingState';
import { MatchCard } from '@/components/MatchCard';
import { PlayerStatCard } from '@/components/PlayerStatCard';
import { ProvisionalRankingRow, RankingTable } from '@/components/RankingRow';
import { Icon, Txt, useTopInset } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { colors, palette, radius } from '@/theme';

import { goBack, openH2H } from '../navigation';
import { useCtx } from '../useCtx';
import { GROUP_TABS, groupVM, type GroupTab } from './vm';

const isTab = (t: unknown): t is GroupTab => GROUP_TABS.some(([k]) => k === t);

function SubTitle({ title, note }: { title: string; note: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingTop: 6,
      }}
    >
      <Txt accessibilityRole="header" d w={700} s={16}>
        {title}
      </Txt>
      <Txt s={13} c={colors.text.onLightSecondary}>
        {note}
      </Txt>
    </View>
  );
}

function LinkButton({
  label,
  onPress,
  expanded,
}: {
  label: string;
  onPress: () => void;
  expanded?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={{
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 2,
        alignSelf: 'flex-start',
      }}
    >
      <Txt w={600} s={14} style={{ textDecorationLine: 'underline' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** 02 · Grupo (Resumen, Ranking, Partidos, Duplas). Cambiar de grupo reinicia la pestaña. */
export function GroupScreen() {
  const { state } = usePunto();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = isTab(params.tab) ? params.tab : 'resumen';
  return <GroupBody key={(state.groupId ?? '') + ':' + initialTab} initialTab={initialTab} />;
}

function GroupBody({ initialTab }: { initialTab: GroupTab }) {
  const { state, actions, isRemote } = usePunto();
  const c = useCtx();
  const [tab, setTab] = useState<GroupTab>(initialTab);
  const [showAllDuos, setShowAllDuos] = useState(false);
  const [invite, setInvite] = useState(false);
  const top = useTopInset();

  const g = useMemo(() => groupVM(c, state.groupId, showAllDuos), [c, state.groupId, showAllDuos]);
  if (state.loading) return <LoadingState />;

  if (!g)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.navy,
          paddingTop: top,
          paddingHorizontal: 20,
          paddingBottom: 24,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          tone="dark"
          card={false}
          titleSize={28}
          title="Todavía no tenés grupos."
          text="Cuando crees uno o aceptes una invitación, acá vas a ver el ranking, los partidos y las duplas."
        />
      </View>
    );

  const sub = colors.text.onLightSecondary;
  const isAdmin = !!state.groups.find((x) => x.id === g.id)?.adminIds.includes(state.me);
  const pending = state.pendingRequests.filter((r) => r.groupId === g.id);
  const h2hTo = (id: string) => openH2H(id, g.id, 'group');

  return (
    <View style={{ flex: 1, backgroundColor: palette.cream }}>
      <GroupHeader
        g={g}
        tab={tab}
        onTab={setTab}
        onBack={goBack}
        onInvite={() => setInvite(true)}
      />
      <ScrollView
        accessibilityLabel={GROUP_TABS.find(([k]) => k === tab)![1]}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: tab === 'resumen' || tab === 'ranking' ? 12 : 10,
        }}
      >
        {tab === 'resumen' ? (
          <>
            {isRemote && isAdmin && pending.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${pending.length} ${pending.length === 1 ? 'pedido' : 'pedidos'} para unirse. Revisalos.`}
                onPress={() => setInvite(true)}
                style={{
                  backgroundColor: palette.cream2,
                  borderRadius: radius.card,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 56,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt d w={700} s={16}>
                    {pending.length} {pending.length === 1 ? 'pedido' : 'pedidos'} para unirse
                  </Txt>
                  <Txt s={13} c={sub}>
                    Revisalos para sumarlos al grupo.
                  </Txt>
                </View>
                <Icon name="chevron" size={18} color={palette.navy} />
              </Pressable>
            ) : null}
            {g.place ? <PlayerStatCard place={g.place} /> : null}
            {g.duo ? <DuoHighlightCard {...g.duo} onPress={() => setTab('duplas')} /> : null}
            {g.rivalry ? (
              <HeadToHeadSummary
                variant="group"
                title="La rivalidad del grupo."
                text={g.rivalry.text}
                score={g.rivalry.score}
                onPress={() => h2hTo(g.rivalry!.rivalId)}
              />
            ) : null}
            {g.last ? (
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 4,
                  }}
                >
                  <Txt accessibilityRole="header" d w={700} s={18}>
                    Último partido
                  </Txt>
                  <LinkButton label={g.seeAll} onPress={() => setTab('partidos')} />
                </View>
                <MatchCard m={g.last} onPress={() => actions.openMatch(g.last!.id)} />
              </View>
            ) : null}
            {g.isEmpty ? (
              <EmptyState
                tone="dark"
                title="La cancha está lista."
                text={g.emptyText}
                art={<CourtArt variant="group" />}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Txt w={600} s={14} c={palette.cream}>
                    Usá el botón Partido de abajo
                  </Txt>
                  <Icon name="arrowDown" size={18} color={palette.coral} stroke={2.25} />
                </View>
              </EmptyState>
            ) : null}
          </>
        ) : null}

        {tab === 'ranking' ? (
          <>
            <Txt s={13} lh={1.45} c={sub}>
              Por % de victorias en este grupo. Entran quienes tienen 5 partidos o más; si empatan,
              desempatan los ganados y después los sets.
            </Txt>
            {g.ranking.length ? (
              <RankingTable rows={g.ranking} onOpen={h2hTo} />
            ) : (
              <EmptyState
                tone="card"
                title="Todavía no hay ranking."
                text="Se arma cuando alguien llega a 5 partidos en el grupo. Mientras tanto, todos figuran como provisorios."
              />
            )}
            {g.showProvisional ? (
              <View style={{ gap: 8, paddingTop: 6 }}>
                <SubTitle title="Provisorios" note="Sin puesto hasta los 5 partidos" />
                {g.provisional.map((r) => (
                  <ProvisionalRankingRow key={r.id} r={r} onPress={() => h2hTo(r.id)} />
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {tab === 'partidos' ? (
          g.isEmpty ? (
            <EmptyState
              tone="card"
              title="Sin partidos todavía."
              text="Cada partido que carguen queda acá, con fecha, parejas y sets."
            />
          ) : (
            <>
              <Txt s={13} c={sub}>
                {g.matchesLabel}
              </Txt>
              {g.matches.map((m) => (
                <MatchCard key={m.id} m={m} onPress={() => actions.openMatch(m.id)} />
              ))}
            </>
          )
        ) : null}

        {tab === 'duplas' ? (
          g.isEmpty ? (
            <EmptyState
              tone="card"
              title="Las duplas vienen después."
              text="Aparecen cuando dos jugadores comparten lado en un partido."
            />
          ) : (
            <>
              <Txt s={13} lh={1.45} c={sub}>
                Cómo rinde cada pareja jugando del mismo lado. Desde 3 partidos juntos se puede
                destacar.
              </Txt>
              {g.duos.map((d) => (
                <DuoStatCard key={d.pairId} {...d} />
              ))}
              {!g.duos.length ? (
                <Txt s={14} c={sub}>
                  Ninguna pareja llegó todavía a 3 partidos juntos.
                </Txt>
              ) : null}
              {g.provDuosTotal > 0 ? (
                <View style={{ gap: 8 }}>
                  <SubTitle title="Provisorias" note="Menos de 3 juntos" />
                  {g.provDuos.map((d) => (
                    <ProvisionalDuoRow key={d.pairId} names={d.names} meta={d.meta} />
                  ))}
                  {g.provDuosTotal > 3 ? (
                    <LinkButton
                      label={g.provMoreLabel}
                      expanded={showAllDuos}
                      onPress={() => setShowAllDuos(!showAllDuos)}
                    />
                  ) : null}
                </View>
              ) : null}
            </>
          )
        ) : null}
      </ScrollView>
      {isRemote && invite ? (
        <RemoteInviteSheet
          visible={invite}
          groupId={g.id}
          groupName={g.name}
          isAdmin={isAdmin}
          requests={pending}
          onClose={() => setInvite(false)}
        />
      ) : isRemote ? null : (
        <InviteSheet
          visible={invite}
          groupId={g.id}
          groupName={g.name}
          onClose={() => setInvite(false)}
        />
      )}
    </View>
  );
}
