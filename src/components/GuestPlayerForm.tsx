import { Pressable, TextInput, View } from 'react-native';

import { palette, protoColors } from '@/theme';

import { fontFor, Txt, useAnnounce } from './ui';

/** Alta de invitado: juega en el grupo sin cuenta. */
export function GuestPlayerForm({
  name,
  error,
  onChange,
  onSubmit,
}: {
  name: string;
  error: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  useAnnounce(error);
  return (
    <View
      style={{
        backgroundColor: palette.white,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: palette.slate,
        borderRadius: 16,
        padding: 12,
        gap: 8,
      }}
    >
      <Txt w={600} s={13} nativeID="guest-label">
        Nombre del invitado
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          accessibilityLabel="Nombre del invitado"
          accessibilityLabelledBy="guest-label"
          value={name}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          maxLength={20}
          autoComplete="off"
          autoCorrect={false}
          returnKeyType="done"
          placeholder="Ej.: Lucho"
          placeholderTextColor={palette.slate}
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            borderWidth: 1,
            borderColor: protoColors.creamEdge,
            borderRadius: 12,
            paddingHorizontal: 12,
            backgroundColor: palette.cream,
            color: palette.navy,
            fontSize: 16,
            fontFamily: fontFor(false, 400),
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sumar invitado"
          onPress={onSubmit}
          style={{
            height: 44,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: palette.navy,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt w={700} s={15} c={palette.cream}>
            Sumar
          </Txt>
        </Pressable>
      </View>
      <Txt s={12} lh={1.4} c={palette.slate}>
        Juega en este grupo sin cuenta. Si después se registra, un admin puede vincularlo; nada se
        une solo por el nombre.
      </Txt>
      {error ? (
        <Txt accessibilityRole="alert" w={600} s={13}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}
