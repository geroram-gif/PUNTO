import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { usePunto } from '@/lib/store';
import { toRemoteError } from '@/lib/supabase/errors';
import { colors, palette, protoColors } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Button, Icon, Txt } from './ui';

type Step = 'menu' | 'signOut' | 'delete';

const DEMO_ROWS = [
  { label: 'Editar perfil', note: 'Próxima iteración', strong: false },
  { label: 'Privacidad', note: 'Historial global: solo vos', strong: false },
  { label: 'Cerrar sesión', note: 'Próxima iteración', strong: false },
  { label: 'Eliminar cuenta', note: 'Con confirmación · próxima iteración', strong: true },
];

const card = {
  backgroundColor: palette.white,
  borderWidth: 1,
  borderColor: palette.creamLine,
  borderRadius: 16,
  paddingVertical: 4,
  paddingHorizontal: 16,
} as const;
const rowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  minHeight: 52,
  borderBottomWidth: 1,
  borderBottomColor: protoColors.creamRule,
} as const;

/** Ajustes del perfil. Con cuenta: editar perfil, privacidad, cerrar sesión y pedir la baja. */
export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, actions, isRemote } = usePunto();
  const [step, setStep] = useState<Step>('menu');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (f: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setError('');
    try {
      await f();
      after?.();
    } catch (e) {
      setError(toRemoteError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const title =
    step === 'signOut' ? '¿Cerrar sesión?' : step === 'delete' ? '¿Eliminar tu cuenta?' : 'Ajustes';

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {!isRemote ? (
        <>
          <View style={card}>
            {DEMO_ROWS.map((s) => (
              <View key={s.label} style={rowStyle}>
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
            Ajustes, privacidad y eliminar cuenta se diseñan en la próxima iteración. Borrar la
            cuenta va a pedir confirmación explícita.
          </Txt>
        </>
      ) : null}

      {isRemote && step === 'menu' ? (
        <>
          <View style={card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
              onPress={() => {
                onClose();
                router.push('/profile-edit' as Href);
              }}
              style={rowStyle}
            >
              <Txt w={500} s={15}>
                Editar perfil
              </Txt>
              <Icon name="chevron" size={18} color={palette.navy} />
            </Pressable>
            <View accessible style={rowStyle}>
              <Txt w={500} s={15}>
                Privacidad
              </Txt>
              <Txt w={600} s={12} c={palette.slate} align="right" style={{ flexShrink: 1 }}>
                Historial global: solo vos
              </Txt>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={() => setStep('signOut')}
              style={rowStyle}
            >
              <Txt w={500} s={15}>
                Cerrar sesión
              </Txt>
              <Icon name="chevron" size={18} color={palette.navy} />
            </Pressable>
            {state.deletionRequested ? (
              <View accessible style={rowStyle}>
                <Txt w={700} s={15}>
                  Eliminar cuenta
                </Txt>
                <Txt w={600} s={12} c={palette.slate} align="right" style={{ flexShrink: 1 }}>
                  Baja solicitada
                </Txt>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar cuenta"
                onPress={() => setStep('delete')}
                style={rowStyle}
              >
                <Txt w={700} s={15}>
                  Eliminar cuenta
                </Txt>
                <Icon name="chevron" size={18} color={palette.navy} />
              </Pressable>
            )}
          </View>
          <Txt s={13} lh={1.45} c={colors.text.onLightSecondary}>
            Sesión iniciada con {state.email || 'tu mail'}.
          </Txt>
        </>
      ) : null}

      {isRemote && step === 'signOut' ? (
        <>
          <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
            Para volver a entrar vas a necesitar un código nuevo que te mandamos por mail. Tus
            partidos y tus grupos quedan guardados.
          </Txt>
          {error ? (
            <Txt accessibilityRole="alert" w={600} s={14}>
              {error}
            </Txt>
          ) : null}
          <Button
            label="Sí, cerrar sesión"
            tone="dark"
            loading={busy}
            disabled={busy}
            onPress={() => void run(() => actions.signOut(), onClose)}
          />
          <Button
            label="Cancelar"
            tone="outline"
            height={50}
            disabled={busy}
            onPress={() => setStep('menu')}
          />
        </>
      ) : null}

      {isRemote && step === 'delete' ? (
        <>
          <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
            Pedimos la baja de tu cuenta y la procesamos nosotros. Tus partidos quedan en el
            historial de cada grupo, pero tu nombre se reemplaza por «Ex jugador» y no vas a poder
            recuperar tu perfil. No se puede deshacer.
          </Txt>
          {error ? (
            <Txt accessibilityRole="alert" w={600} s={14}>
              {error}
            </Txt>
          ) : null}
          <Button
            label="Sí, pedir la baja"
            tone="dark"
            loading={busy}
            disabled={busy}
            onPress={() =>
              void run(
                () => actions.requestAccountDeletion(),
                () => {
                  setStep('menu');
                  actions.showToast('Pedido enviado. Vamos a procesar la baja de tu cuenta.');
                },
              )
            }
          />
          <Button
            label="Cancelar"
            tone="outline"
            height={50}
            disabled={busy}
            onPress={() => setStep('menu')}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}
