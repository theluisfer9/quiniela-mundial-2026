import type { AppCopy } from "@/lib/i18n";

export function getPrivacyRevealCopy({ isLocked, t }: { isLocked: boolean; t?: AppCopy }) {
  if (t) {
    return isLocked ? t.privacy.locked : t.privacy.open;
  }

  return isLocked
    ? "Este partido ya empezo. Tu pick queda cerrado y esta vista sigue mostrando solo tus pronosticos."
    : "En /pronosticos esta vista muestra solo tus picks. Se mantienen privados hasta que empiece cada partido.";
}
