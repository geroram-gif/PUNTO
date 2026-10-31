import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { inviteLink } from '@/features/match/vm';
import { colors, palette, protoColors } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button, Txt } from './ui';

/** «Sumá a los tuyos.»: link de invitación de prueba, copiar o compartir. */
export function InviteSheet({
  visible,
  groupId,
  groupName,
  onClose,
}: {
  visible: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState('');
  const link = inviteLink(groupId);
  const close = () => {
    setMsg('');
    onClose();
  };
  const copy = async () => {
    try {
      await Clipboard.setStringAsync('https://' + link);
      setMsg('Link copiado. Pegalo en el chat del grupo.');
    } catch {
      setMsg('No se pudo copiar desde acá. Mantené apretado el link para copiarlo a mano.');
    }
  };
  const share = async () => {
    try {
      const r = await Share.share({
        message: 'Sumate a ' + groupName + ' en PUNTO: https://' + link,
      });
      setMsg(r.action === Share.sharedAction ? 'Listo, compartido.' : '');
    } catch {
      setMsg('');
    }
  };
  return (
    <BottomSheet visible={visible} title="Sumá a los tuyos." onClose={close}>
      <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
        Con este link pueden pedir unirse a{' '}
        <Txt w={700} s={15} lh={1.45}>
          {groupName}
        </Txt>
        . Un admin aprueba cada ingreso.
      </Txt>
      <View
        style={{
          backgroundColor: palette.white,
          borderWidth: 1,
          borderColor: protoColors.creamEdge,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          gap: 2,
        }}
      >
        <Txt s={12} c={palette.slate}>
          Link de prueba del prototipo
        </Txt>
        <Txt w={600} s={15} selectable>
          {link}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label="Copiar link"
          tone="dark"
          height={52}
          size={15}
          onPress={copy}
          style={{ flex: 1 }}
        />
        <Button
          label="Compartir…"
          tone="outline"
          height={52}
          size={15}
          onPress={share}
          style={{ flex: 1 }}
        />
      </View>
      {msg ? (
        <Txt accessibilityLiveRegion="polite" s={14} lh={1.4} align="center">
          {msg}
        </Txt>
      ) : null}
    </BottomSheet>
  );
}
