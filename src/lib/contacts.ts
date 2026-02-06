export type TrustedContact = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
};

const KEY = "signalsafe-contacts";

export function getContacts(): TrustedContact[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveContact(contact: TrustedContact) {
  const existing = getContacts();
  existing.push(contact);
  localStorage.setItem(KEY, JSON.stringify(existing));
}

export function deleteContact(id: string) {
  const updated = getContacts().filter(c => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
