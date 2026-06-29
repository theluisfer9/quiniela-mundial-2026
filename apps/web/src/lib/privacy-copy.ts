import type { AppCopy } from "@/lib/i18n";

export function getPrivacyRevealCopy({ isLocked, t }: { isLocked: boolean; t?: AppCopy }) {
  if (t) {
    return isLocked ? t.privacy.locked : t.privacy.open;
  }

  return isLocked
    ? "Este partido ya empezó. Tu pronóstico queda cerrado y esta vista sigue mostrando solo tus pronósticos."
    : "Esta vista muestra solo tus pronósticos. Se mantienen privados hasta que empiece cada partido.";
}
