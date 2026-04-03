export function getInitials(nameOrEmail) {
  const str = String(nameOrEmail || "").trim();
  if (!str) return "?";

  const parts = str.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    // if it's an email like aaryan@example.com
    const head = parts[0].split("@")[0];
    return head.slice(0, 2).toUpperCase();
  }

  const first = parts[0]?.[0] || "";
  const last = parts[parts.length - 1]?.[0] || "";
  return (first + last).toUpperCase();
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

