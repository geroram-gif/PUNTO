import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { GroupBadge } from '@/components/GroupCard';
import { Button, Icon, TextField, Txt, useTopInset } from '@/components/ui';
import { usePunto } from '@/lib/store';
import type { JoinPreview } from '@/lib/supabase/api';
import { toRemoteError } from '@/lib/supabase/errors';
import { colors, palette, radius } from '@/theme';

type Step =
  { kind: 'code' } | { kind: 'preview'; preview: JoinPreview; code: string } | { kind: 'sent' };

/** Unirse a un grupo con el código de invitación. Un admin aprueba cada ingreso. */
export function JoinScreen() {
  const { actions } = usePunto();
  const params = useLocalSearchParams<{ code?: string }>();
  const top = useTopInset(54);
  const [code, setCode] = useState(params.code ?? '');
  const [step, setStep] = useState<Step>({ kind: 'code' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const look = async (value = code) => {
    if (!value.trim()) return setError('Pegá el código que te pasaron.');
    setBusy(true);
    setError('');
    try {
      setStep({ kind: 'preview', preview: await actions.previewInvite(value), code: value });
    } catch (e) {
      setError(toRemoteError(e).message);
    } finally {
      setBusy(false);
    }
  };

  // Si llegó por un link (punto://join?code=…), buscar el grupo directamente.
  const auto = useRef(false);
  useEffect(() => {
    if (params.code && !auto.current) {
      auto.current = true;
      void look(params.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const request = async (value: string) => {
    setBusy(true);
    setError('');
    try {
      const r = await actions.requestJoin(value);
      if (r.status === 'member') {
        await actions.refresh();
        actions.selectGroup(r.groupId);
        router.dismissAll();
        router.navigate('/groups' as Href);
      } else setStep({ kind: 'sent' });
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
            Tengo una invitación
          </Txt>
          <View style={{ width: 34 }} />
        </View>

        {step.kind === 'code' ? (
          <>
            <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
              Pegá el código que te pasó alguien del grupo. Un admin tiene que aprobar tu ingreso.
            </Txt>
            <TextField
              label="Código del grupo"
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setError('');
              }}
              placeholder="Ej.: 3FA9-12BC-77D0-4E1A"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              error={error}
              onSubmitEditing={() => void look()}
            />
            <Button
              label="Buscar grupo"
              loading={busy}
              disabled={busy}
              height={56}
              size={17}
              onPress={() => void look()}
            />
          </>
        ) : null}

        {step.kind === 'preview' ? (
          <>
            <View
              style={{
                backgroundColor: palette.white,
                borderWidth: 1,
                borderColor: palette.creamLine,
                borderRadius: radius.card,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <GroupBadge
                ini={step.preview.initials}
                bg={step.preview.color}
                size={52}
                fontSize={18}
                r={16}
              />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Txt accessibilityRole="header" w={700} s={17} ell>
                  {step.preview.groupName}
                </Txt>
                <Txt s={13} c={colors.text.onLightSecondary}>
                  {step.preview.members} {step.preview.members === 1 ? 'integrante' : 'integrantes'}
                </Txt>
              </View>
            </View>
            {step.preview.alreadyMember ? (
              <Txt s={15} lh={1.45}>
                Ya sos parte de este grupo.
              </Txt>
            ) : step.preview.pending ? (
              <Txt s={15} lh={1.45}>
                Ya pediste entrar. Cuando un admin te apruebe, el grupo aparece en Inicio.
              </Txt>
            ) : null}
            {error ? (
              <Txt accessibilityRole="alert" w={600} s={14}>
                {error}
              </Txt>
            ) : null}
            {!step.preview.pending ? (
              <Button
                label={step.preview.alreadyMember ? 'Ver el grupo' : 'Pedir unirme'}
                loading={busy}
                disabled={busy}
                height={56}
                size={17}
                onPress={() => void request(step.code)}
              />
            ) : null}
            <Button
              label="Buscar otro"
              tone="outline"
              height={50}
              onPress={() => setStep({ kind: 'code' })}
            />
          </>
        ) : null}

        {step.kind === 'sent' ? (
          <View style={{ gap: 14 }}>
            <Txt accessibilityRole="header" d w={800} s={28} lh={1.05} tr={-0.02}>
              Pedido enviado.
            </Txt>
            <Txt s={15} lh={1.45} c={colors.text.onLightSecondary}>
              Un admin del grupo tiene que aprobarte. Cuando lo haga, el grupo aparece en Inicio.
            </Txt>
            <Button label="Listo" height={56} size={17} onPress={() => router.back()} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
