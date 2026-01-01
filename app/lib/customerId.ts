export function getOrCreateCustomerId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("customerId");

  if (!id) {
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    id = generateUUID();
    localStorage.setItem("customerId", id);
  }

  return id;
}
