import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Button, TextField, Txt, useTopInset, Wordmark } from '@/components/ui';
import { usePunto } from '@/lib/store';
import { isEmail, normalizeCode } from '@/lib/supabase/auth';
import { toRemoteError } from '@/lib/supabase/errors';
import { colors, palette } from '@/theme';

const RESEND_SECONDS = 30;

/** Ingreso con email: se pide el mail y después el código de 6 dígitos que llega por correo. */
export function SignInScreen() {
  const { actions } = usePunto();
  const top = useTopInset();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const send = async () => {
    if (!isEmail(email)) return setError('Escribí un mail válido, por ejemplo vos@mail.com.');
    setBusy(true);
    setError('');
    try {
      await actions.sendCode(email);
      setStep('code');
      setCode('');
      setResendIn(RESEND_SECONDS);
      setTimeout(() => codeRef.current?.focus(), 100);
    } catch (e) {
      setError(toRemoteError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (normalizeCode(value).length < 6) return setError('El código tiene 6 dígitos.');
    setBusy(true);
    setError('');
    try {
      await actions.verifyCode(email, value);
      // Al entrar la sesión cambia y la app sigue sola (perfil o inicio).
    } catch (e) {
      setError(toRemoteError(e).message);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.navy }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: top + 12,
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 20,
        }}
      >
        <Wordmark size={28} />
        <View style={{ gap: 10, paddingTop: 24 }}>
          <Txt accessibilityRole="header" d w={800} s={34} lh={1.05} tr={-0.02} c={palette.cream}>
            Cada partido cuenta.
          </Txt>
          <Txt s={15} lh={1.45} c={colors.text.onDarkSecondary}>
            {step === 'email'
              ? 'Entrá con tu mail y te mandamos un código. Sin contraseñas.'
              : `Te mandamos un código de 6 dígitos a ${email.trim().toLowerCase()}. Puede tardar un minuto.`}
          </Txt>
        </View>

        {step === 'email' ? (
          <View style={{ gap: 14 }}>
            <TextField
              tone="dark"
              label="Tu mail"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              error={error}
              placeholder="vos@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void send()}
            />
            <Button
              label="Mandame el código"
              loading={busy}
              disabled={busy}
              onPress={() => void send()}
            />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <TextField
              ref={codeRef}
              tone="dark"
              label="Código"
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setError('');
                // El teclado numérico de iOS no tiene tecla de «Listo»: al completar los 6 dígitos se entra.
                if (normalizeCode(v).length === 6 && !busy) void verify(v);
              }}
              error={error}
              placeholder="123456"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={() => void verify()}
            />
            <Button label="Entrar" loading={busy} disabled={busy} onPress={() => void verify()} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cambiar el mail"
                onPress={() => {
                  setStep('email');
                  setError('');
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Txt w={600} s={14} c={palette.cream} style={{ textDecorationLine: 'underline' }}>
                  Cambiar el mail
                </Txt>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  resendIn > 0
                    ? `Reenviar código, disponible en ${resendIn} segundos`
                    : 'Reenviar código'
                }
                accessibilityState={{ disabled: resendIn > 0 || busy }}
                disabled={resendIn > 0 || busy}
                onPress={() => void send()}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Txt
                  w={600}
                  s={14}
                  c={resendIn > 0 ? colors.text.onDarkSecondary : palette.cream}
                  style={{ textDecorationLine: 'underline' }}
                >
                  {resendIn > 0 ? `Reenviar en ${resendIn} s` : 'Reenviar código'}
                </Txt>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
