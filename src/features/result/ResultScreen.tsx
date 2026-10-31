import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { PlayerAvatar } from '@/components/PlayerAvatar';
import { ShareCardSheet, shareCardTheme } from '@/components/ShareCard';
import { StatHighlight } from '@/components/StatHighlight';
import { Button, Icon, Txt, useTopInset } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { palette } from '@/theme';

import { useCtx } from '../useCtx';
import { resultVM } from './vm';

/** 04 · Resultado. Se llega solo después de guardar un partido nuevo. */
export function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actions } = usePunto();
  const c = useCtx();
  const vm = useMemo(() => resultVM(c, id ?? null), [c, id]);
  const [share, setShare] = useState(false);
  const top = useTopInset(54);

  const toGroup = () => {
    if (vm) actions.selectGroup(vm.groupId);
    router.dismissAll();
    router.navigate('/groups' as Href);
    actions.showToast('Ranking, duplas y cara a cara actualizados.');
  };

  if (!vm) {
    // El partido se borró desde el detalle: volver al grupo.
    return (
      <View
        style={{ flex: 1, backgroundColor: palette.coral, justifyContent: 'center', padding: 20 }}
      >
        <Button label="Ver el grupo" tone="dark" onPress={toGroup} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.coral }}
      contentContainerStyle={{ paddingTop: top, flexGrow: 1 }}
    >
      <StatusBar style="dark" />
      <View
        style={{
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
        }}
      >
        <Txt w={600} s={14} ell style={{ flex: 1 }}>
          {vm.meta}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Listo"
          onPress={toGroup}
          style={{ height: 44, justifyContent: 'center', paddingLeft: 12 }}
        >
          <Txt w={700} s={16}>
            Listo
          </Txt>
        </Pressable>
      </View>

      <View
        accessibilityLiveRegion="polite"
        style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 26, gap: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: palette.navy,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check" size={18} color={palette.coral} stroke={2.5} />
          </View>
          <Txt w={700} s={13} tr={0.08} upper>
            Partido cargado.
          </Txt>
        </View>
        <View style={{ gap: 10 }}>
          <View
            style={{ flexDirection: 'row' }}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {vm.winners.map((a, i) => (
              <PlayerAvatar
                key={i}
                av={a}
                size={56}
                fontSize={17}
                ring={palette.coral}
                ringWidth={3}
                style={{ marginRight: -12 - 6 }}
              />
            ))}
          </View>
          <Txt w={600} s={15}>
            Ganaron
          </Txt>
          <Txt accessibilityRole="header" d w={800} s={38} lh={1.05} tr={-0.03}>
            {vm.winnerNames}
          </Txt>
        </View>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={vm.scoreAria}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 18,
            rowGap: 6,
            alignItems: 'baseline',
          }}
        >
          {vm.sets.map((s, i) => (
            <Txt key={i} d w={800} s={vm.scoreSize} lh={0.95} tr={-0.04} num>
              {s}
            </Txt>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Txt s={15}>a</Txt>
          <View
            style={{ flexDirection: 'row' }}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {vm.losers.map((a, i) => (
              <PlayerAvatar
                key={i}
                av={a}
                size={32}
                fontSize={11}
                ring={palette.coral}
                style={{ marginRight: -8 - 4 }}
              />
            ))}
          </View>
          <Txt w={600} s={16} ell style={{ marginLeft: 8, flex: 1 }}>
            {vm.loserNames}
          </Txt>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: palette.cream,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 22,
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <StatHighlight
          big={vm.hasBig ? vm.big : null}
          title={vm.title}
          text={vm.text}
          lines={vm.lines}
        />
        <Button
          label="Compartir resultado"
          tone="dark"
          icon={<Icon name="share" size={20} color={palette.cream} />}
          onPress={() => setShare(true)}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label="Ver el grupo"
            tone="outline"
            height={50}
            size={15}
            onPress={toGroup}
            style={{ flex: 1 }}
          />
          <Button
            label="Ver detalle"
            tone="soft"
            height={50}
            size={15}
            onPress={() => actions.openMatch(vm.matchId)}
            style={{ flex: 1 }}
          />
        </View>
        {vm.h2h ? (
          <Button
            label={vm.h2h.label}
            tone="lilac"
            height={50}
            size={15}
            onPress={() => {
              const h = vm.h2h!;
              actions.selectGroup(vm.groupId);
              router.dismissAll();
              router.navigate('/groups' as Href);
              router.push(`/groups/h2h?rival=${h.rivalId}&group=${vm.groupId}&from=group` as Href);
            }}
          />
        ) : null}
      </View>

      <ShareCardSheet
        visible={share}
        title="Compartir resultado"
        onClose={() => setShare(false)}
        card={{
          ...shareCardTheme.result,
          kicker: vm.share.kicker,
          big: vm.share.big,
          size: vm.share.size,
          line: vm.share.line,
          text: vm.share.text,
        }}
      />
    </ScrollView>
  );
}
