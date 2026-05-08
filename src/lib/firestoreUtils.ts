/**
 * Firestore non accetta valori `undefined` nei documenti.
 * Questa funzione rimuove ricorsivamente i campi undefined.
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === "object" && item !== null ? cleanForFirestore(item) : item
    ) as any;
  }
  if (typeof obj !== "object") return obj;

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj as any)) {
    if (value === undefined) continue;
    if (value === null) {
      cleaned[key] = null;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === "object" && item !== null ? cleanForFirestore(item) : item
      );
    } else if (typeof value === "object") {
      cleaned[key] = cleanForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
