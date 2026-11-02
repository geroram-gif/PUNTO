import { Pressable, View } from 'react-native';

import type { GroupTab, GroupVM } from '@/features/group/vm';
import { GROUP_TABS } from '@/features/group/vm';
import { colors, palette, radius } from '@/theme';

import { GroupBadge } from './GroupCard';
import { MemberStack } from './MemberStack';
import { SectionTabs } from './SectionTabs';
import { Icon, Txt, useTopInset } from './ui';

/** Encabezado navy del grupo: volver, nombre, miembros, invitar y pestañas. */
export function GroupHeader({
  g,
  tab,
  onTab,
  onBack,
  onInvite,
}: {
  g: GroupVM;
  tab: GroupTab;
  onTab: (t: GroupTab) => void;
  onBack: () => void;
  onInvite: () => void;
}) {
  const top = useTopInset();
  return (
    <View
      style={{
        backgroundColor: palette.navy,
        paddingTop: top,
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={onBack}
          style={{
            width: 44,
            height: 44,
            marginLeft: -8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="back" color={palette.cream} />
        </Pressable>
        <GroupBadge ini={g.ini} bg={g.bg} size={44} fontSize={16} r={radius.groupBadge} />
        <View style={{ flex: 1, minWidth: 0, gap: 2, paddingLeft: 4 }}>
          <Txt
            accessibilityRole="header"
            d
            w={800}
            s={22}
            lh={1.15}
            tr={-0.02}
            c={palette.cream}
            ell
          >
            {g.name}
          </Txt>
          <Txt s={13} c={colors.text.onDarkSecondary} ell>
            {g.meta}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <MemberStack stack={g.stack} more={g.more} aria={g.membersAria} />
        <Txt s={13} c={colors.text.onDarkSecondary} ell style={{ flex: 1, paddingLeft: 8 }}>
          {g.guestsLabel}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Invitar"
          accessibilityHint="Abre la invitación del grupo"
          onPress={onInvite}
          style={{
            height: 44,
            paddingLeft: 12,
            paddingRight: 16,
            borderRadius: radius.chip,
            borderWidth: 1.5,
            borderColor: palette.cream,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="invite" size={18} color={palette.cream} />
          <Txt w={600} s={15} c={palette.cream}>
            Invitar
          </Txt>
        </Pressable>
      </View>
      <SectionTabs
        tabs={GROUP_TABS}
        value={tab}
        onChange={onTab}
        accessibilityLabel="Secciones del grupo"
      />
    </View>
  );
}
