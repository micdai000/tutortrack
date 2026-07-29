/** Companionship title as shown across TutorTrack (derived from member names). */
export function formatCompanionshipLabel(displayNames: string[]): string {
  const names = displayNames.map((name) => name.trim()).filter(Boolean);

  if (names.length === 0) {
    return "Companionship";
  }

  return names.join(" · ");
}

/** Google Form / UI option: "<Display Name> — <Companionship Name>". */
export function formatWhoAreYouOptionLabel(
  displayName: string,
  companionshipLabel: string
): string {
  return `${displayName.trim()} — ${companionshipLabel.trim()}`;
}
