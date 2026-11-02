import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { usePunto } from '@/lib/store';
import type { PendingRequest } from '@/lib/supabase/snapshot';
import { toRemoteError } from '@/lib/supabase/errors';
import { avatarTextColor, colors, palette, radius } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { PlayerAvatar } from './PlayerAvatar';
import { Button, Txt, useAnnounce } from './ui';

/** 3FA912BC77D04E1A → 3FA9-12BC-77D0-4E1A */
export const formatCode = (c: string) => c.replace(/(.{4})(?=.)/g, '$1-');

/**
 * Invitación de un grupo con cuenta: código para compartir y, para los admins, los pedidos
 * de ingreso pendientes (aprobar o rechazar) y renovar el link.
 */
export function RemoteInviteSheet({
  visible,
  groupId,
  groupName,
  isAdmin,
  requests,
  onClose,
}: {
  visible: boolean;
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  requests: PendingRequest[];
  onClose: () => void;
}) {
  const { actions } = usePunto();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useAnnounce(msg);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    actions.getInvite(groupId).then(
      (c) => alive && setCode(c),
      (e) => alive && setMsg(toRemoteError(e).message),
    );
    return () => {
      alive = false;
    };
  }, [visible, groupId, actions, attempt]);

  const message = `Sumate a ${groupName} en PUNTO. Abrí la app, tocá «Tengo una invitación» y pegá este código: ${formatCode(code)}`;
  const run = async (f: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await f();
      if (ok) setMsg(ok);
    } catch (e) {
      setMsg(toRemoteError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} title="Sumá a los tuyos." onClose={onClose}>
      <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
        Con este código pueden pedir unirse a{' '}
        <Txt w={700} s={15} lh={1.45}>
          {groupName}
        </Txt>
        . Un admin aprueba cada ingreso.
      </Txt>
      <View
        style={{
          backgroundColor: palette.white,
          borderWidth: 1,
          borderColor: palette.creamLine,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          gap: 2,
        }}
      >
        <Txt s={12} c={palette.slate}>
          Código de invitación
        </Txt>
        <Txt
          accessibilityLabel={
            code
              ? `Código ${code.split('').join(' ')}`
              : msg
                ? 'No se pudo cargar el código'
                : 'Cargando el código'
          }
          w={700}
          s={18}
          tr={0.04}
          selectable
          num
        >
          {code ? formatCode(code) : '…'}
        </Txt>
      </View>
      {!code && msg ? (
        <Button
          label="Reintentar"
          tone="soft"
          height={48}
          size={14}
          onPress={() => setAttempt((n) => n + 1)}
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label="Copiar código"
          tone="dark"
          height={52}
          size={15}
          disabled={!code}
          style={{ flex: 1 }}
          onPress={() =>
            void run(
              () => Clipboard.setStringAsync(formatCode(code)),
              'Código copiado. Pegalo en el chat del grupo.',
            )
          }
        />
        <Button
          label="Compartir…"
          tone="outline"
          height={52}
          size={15}
          disabled={!code}
          style={{ flex: 1 }}
          onPress={() => void run(() => Share.share({ message }))}
        />
      </View>

      {isAdmin ? (
        <View style={{ gap: 10 }}>
          <Txt accessibilityRole="header" d w={700} s={16}>
            Pedidos para unirse
          </Txt>
          {requests.length ? (
            requests.map((r) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: palette.white,
                  borderWidth: 1,
                  borderColor: palette.creamLine,
                  borderRadius: radius.card,
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <PlayerAvatar
                    av={{
                      ini: r.initials,
                      bg: r.avatarColor,
                      fg: avatarTextColor(r.avatarColor),
                      dashed: null,
                    }}
                    size={36}
                  />
                  <Txt w={700} s={15} ell style={{ flex: 1 }}>
                    {r.name}
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button
                    label="Aprobar"
                    height={48}
                    size={15}
                    disabled={busy}
                    accessibilityLabel={`Aprobar a ${r.name}`}
                    style={{ flex: 1 }}
                    onPress={() =>
                      void run(
                        () => actions.decideJoin(r.id, true),
                        `${r.name} ya es parte del grupo.`,
                      )
                    }
                  />
                  <Button
                    label="Rechazar"
                    tone="outline"
                    height={48}
                    size={15}
                    disabled={busy}
                    accessibilityLabel={`Rechazar a ${r.name}`}
                    style={{ flex: 1 }}
                    onPress={() =>
                      void run(() => actions.decideJoin(r.id, false), 'Pedido rechazado.')
                    }
                  />
                </View>
              </View>
            ))
          ) : (
            <Txt s={14} c={colors.text.onLightSecondary}>
              No hay pedidos pendientes.
            </Txt>
          )}
          <Button
            label="Renovar código"
            tone="soft"
            height={48}
            size={14}
            disabled={busy || !code}
            accessibilityLabel="Renovar código. El anterior deja de funcionar."
            onPress={() =>
              void run(
                async () => setCode(await actions.rotateInvite(groupId)),
                'Código nuevo. El anterior ya no funciona.',
              )
            }
          />
        </View>
      ) : null}
      {msg ? (
        <Txt accessibilityLiveRegion="polite" s={14} lh={1.4} align="center">
          {msg}
        </Txt>
      ) : null}
    </BottomSheet>
  );
}
