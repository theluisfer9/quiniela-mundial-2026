export function getPrivacyRevealCopy({ isLocked }: { isLocked: boolean }) {
  return isLocked
    ? "Este partido ya empezo. Desde aqui ya no puedes editar tu pronostico y esta pantalla no muestra picks de otras personas."
    : "Tus picks en esta pantalla siguen privados hasta que empiece el partido; la revelacion general ocurre desde ese momento.";
}
