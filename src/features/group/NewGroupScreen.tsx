import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { GroupBadge } from '@/components/GroupCard';
import { Button, Icon, Label, TextField, Txt, useTopInset } from '@/components/ui';
import { initialsOf } from '@/features/profile/initials';
import { usePunto } from '@/lib/store';
import { toRemoteError } from '@/lib/supabase/errors';
import { colors, palette, radius } from '@/theme';

const GROUP_COLORS = [
  { color: palette.lime, name: 'Lima' },
  { color: palette.lilac, name: 'Lila' },
  { color: palette.cream2, name: 'Crema' },
  { color: palette.coral, name: 'Coral' },
];

/** Crear un grupo privado. Quien lo crea queda como admin. */
export function NewGroupScreen() {
  const { actions } = usePunto();
  const top = useTopInset(54);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(palette.lime);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const create = async () => {
    const n = name.trim();
    if (!n) return setError('Ponele un nombre al grupo.');
    setBusy(true);
    setError('');
    try {
      await actions.createGroup(n, color);
      router.dismissAll();
      router.navigate('/groups' as Href);
      actions.showToast('Grupo creado. Invitá a los tuyos con el botón Invitar.');
    } catch (e) {
      setError(toRemoteError(e).message);
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
          <Txt accessibilityRole="header" w={600} s={16}>
            Nuevo grupo
          </Txt>
          <View style={{ width: 34 }} />
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <GroupBadge
            ini={initialsOf(name) || '?'}
            bg={color}
            size={84}
            fontSize={28}
            r={radius.groupBadge + 8}
          />
          <Txt s={13} c={colors.text.onLightSecondary}>
            Así se ve tu grupo
          </Txt>
        </View>
        <TextField
          label="Nombre del grupo"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError('');
          }}
          placeholder="Ej.: Los del Jueves"
          maxLength={40}
          autoCapitalize="words"
          returnKeyType="done"
          error={error}
          onSubmitEditing={() => void create()}
        />
        <View style={{ gap: 10 }}>
          <Label c={colors.text.onLightSecondary}>Color</Label>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Color del grupo"
            style={{ flexDirection: 'row', gap: 12 }}
          >
            {GROUP_COLORS.map((g) => {
              const on = g.color === color;
              return (
                <Pressable
                  key={g.color}
                  accessibilityRole="radio"
                  accessibilityLabel={g.name}
                  accessibilityState={{ checked: on }}
                  onPress={() => setColor(g.color)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
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
                      borderRadius: 10,
                      backgroundColor: g.color,
                      borderWidth: g.color === palette.cream2 ? 1 : 0,
                      borderColor: palette.creamLine,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
        <Txt s={13} lh={1.45} c={colors.text.onLightSecondary}>
          El grupo es privado: solo entran quienes tengan tu invitación y vos aprobés. Vos quedás
          como admin.
        </Txt>
        <Button
          label="Crear grupo"
          loading={busy}
          disabled={busy}
          height={56}
          size={17}
          onPress={() => void create()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
