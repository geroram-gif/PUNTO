import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Anuncia un mensaje a VoiceOver cuando cambia (errores y confirmaciones que no son foco). */
export function useAnnounce(message?: string | null) {
  useEffect(() => {
    if (message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}
