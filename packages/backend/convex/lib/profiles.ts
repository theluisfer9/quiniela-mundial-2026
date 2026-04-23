export function getDefaultDisplayName(authUser: { name?: string | null }) {
  const name = authUser.name?.trim();
  if (name) {
    return name;
  }

  return "Participante";
}
