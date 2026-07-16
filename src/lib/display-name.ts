// Returns the public display name: "First Last" only.
// Falls back gracefully when parts are missing.
export function formatDisplayName(input: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!input) return "طالب";
  const first = (input.first_name ?? "").trim();
  const last = (input.last_name ?? "").trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  const full = (input.full_name ?? "").trim();
  if (full) {
    // Take first + last token, drop father/middle names.
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
    return parts[0] ?? "طالب";
  }
  const email = (input.email ?? "").trim();
  if (email) return email.split("@")[0];
  return "طالب";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0));
}
