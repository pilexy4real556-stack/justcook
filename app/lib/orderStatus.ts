export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "DISPATCHED"
  | "COMPLETED";

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PENDING_PAYMENT: "PAID",
  PAID: "PREPARING",
  PREPARING: "DISPATCHED",
  DISPATCHED: "COMPLETED",
  COMPLETED: null,
};