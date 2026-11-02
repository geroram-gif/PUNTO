import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { PlayerAvatar } from '@/components/PlayerAvatar';
import { Button, Icon, Label, TextField, Txt, useTopInset } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { toRemoteError } from '@/lib/supabase/errors';
import { avatarTextColor, colors, palette } from '@/theme';

import { initialsOf } from './initials';

/** Colores de avatar que acepta el servidor. */
export const AVATAR_COLORS = [
  palette.coral,
  palette.lime,
  palette.lilac,
  palette.cream2,
  palette.graphite,
];

const GENERIC_NAME = 'Jugador';

/** Perfil: nombre corto, nombre completo y color. Primera vez al entrar, o desde Ajustes (`editing`). */
export function ProfileSetupScreen({ editing = false }: { editing?: boolean }) {
  const { state, actions } = usePunto();
  const mine = state.players[state.me];
  const top = useTopInset(54);

  const [display, setDisplay] = useState(mine && mine.name !== GENERIC_NAME ? mine.name : '');
  const [full, setFull] = useState(mine && mine.fullName !== GENERIC_NAME ? mine.fullName : '');
  const [color, setColor] = useState(
    mine?.avatarColor && mine.avatarColor !== 'transparent'
      ? mine.avatarColor.toUpperCase()
      : palette.coral,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const shown = initialsOf(full || display) || '?';

  const save = async () => {
    const d = display.trim();
    const f = full.trim();
    if (!d) return setError('Escribí cómo te dicen.');
    if (d.length > 24) return setError('El nombre corto puede tener hasta 24 letras.');
    if (!f) return setError('Escribí tu nombre completo.');
    setBusy(true);
    setError('');
    try {
      await actions.saveProfile({ displayName: d, fullName: f, avatarColor: color });
      if (editing) {
        router.back();
        actions.showToast('Perfil actualizado.');
      }
      // Primera vez: al quedar el perfil completo la sesión pasa a «lista» y se muestra Inicio.
    } catch (e) {
      setError(toRemoteError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.cream }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: top,
          paddingHorizontal: 20,
          paddingBottom: 32,
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
          {editing ? (
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
          ) : (
            <View style={{ width: 34 }} />
          )}
          <Txt accessibilityRole="header" w={600} s={16}>
            {editing ? 'Editar perfil' : 'Tu perfil'}
          </Txt>
          <View style={{ width: 34 }} />
        </View>

        {!editing ? (
          <View style={{ gap: 6 }}>
            <Txt d w={800} s={30} lh={1.05} tr={-0.02}>
              Armá tu perfil.
            </Txt>
            <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
              Así te ven los de tus grupos. Lo podés cambiar cuando quieras.
            </Txt>
          </View>
        ) : null}

        <View style={{ alignItems: 'center', gap: 8 }}>
          <PlayerAvatar
            av={{ ini: shown, bg: color, fg: avatarTextColor(color), dashed: null }}
            size={84}
            fontSize={28}
            display
          />
          <Txt s={13} c={colors.text.onLightSecondary}>
            Así se ve tu avatar
          </Txt>
        </View>

        <TextField
          label="¿Cómo te dicen?"
          hint="El nombre corto que aparece en rankings y partidos."
          value={display}
          onChangeText={(v) => {
            setDisplay(v);
            setError('');
          }}
          placeholder="Ej.: Tomi"
          maxLength={24}
          autoCapitalize="words"
          autoComplete="nickname"
          returnKeyType="next"
        />
        <TextField
          label="Nombre completo"
          value={full}
          onChangeText={(v) => {
            setFull(v);
            setError('');
          }}
          placeholder="Ej.: Tomás González"
          maxLength={60}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          error={error}
        />

        <View style={{ gap: 10 }}>
          <Label c={colors.text.onLightSecondary}>Color del avatar</Label>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Color del avatar"
            style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}
          >
            {AVATAR_COLORS.map((c) => {
              const on = c.toUpperCase() === color.toUpperCase();
              return (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityLabel={COLOR_NAMES[c] ?? c}
                  accessibilityState={{ checked: on }}
                  onPress={() => setColor(c)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2.5,
                    borderColor: on ? palette.navy : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: c,
                      borderWidth: c === palette.cream2 ? 1 : 0,
                      borderColor: palette.creamLine,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          label={editing ? 'Guardar cambios' : 'Guardar y seguir'}
          loading={busy}
          disabled={busy}
          height={56}
          size={17}
          onPress={() => void save()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLOR_NAMES: Record<string, string> = {
  [palette.coral]: 'Coral',
  [palette.lime]: 'Lima',
  [palette.lilac]: 'Lila',
  [palette.cream2]: 'Crema',
  [palette.graphite]: 'Grafito',
};
