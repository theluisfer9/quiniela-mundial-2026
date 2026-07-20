export const mobileNav = [
  { label: "Historia", href: "#historia" },
  { label: "Campeones", href: "#campeones" },
  { label: "Momentos", href: "#momentos" },
  { label: "Tabla final", href: "#tabla-final" },
] as const;

export function nextTabIndex(index: number, key: string, count: number) {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowRight") return (index + 1) % count;
  if (key === "ArrowLeft") return (index - 1 + count) % count;
  return index;
}

export function getMobileStandingsRows<T>(rows: readonly T[], expanded: boolean) {
  return expanded ? rows : rows.slice(0, 6);
}

export function standingsDisclosureLabel(expanded: boolean, count: number) {
  return expanded ? "Mostrar solo los primeros 6" : `Ver los ${count} participantes`;
}
