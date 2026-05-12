export function getPrivacyRevealCopy({ isLocked }: { isLocked: boolean }) {
  return isLocked
    ? "Este partido ya empezo. Tu pick queda cerrado y esta vista sigue mostrando solo tus pronosticos."
    : "En /pronosticos esta vista muestra solo tus picks. Se mantienen privados hasta que empiece cada partido.";
}
