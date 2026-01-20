export async function getOrCreateCustomerId(): Promise<string> {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("customerId");
  if (id) return id;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/customer`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error("Failed to create customer");
  }

  const data = await res.json();
  localStorage.setItem("customerId", data.customerId);
  return data.customerId;
}
