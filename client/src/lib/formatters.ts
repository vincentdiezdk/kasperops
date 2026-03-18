export function formatDKK(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "God morgen";
  if (hour < 18) return "God eftermiddag";
  return "God aften";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Kladde",
    sent: "Sendt",
    accepted: "Accepteret",
    rejected: "Afvist",
    expired: "Udløbet",
    planned: "Planlagt",
    in_progress: "I gang",
    completed: "Afsluttet",
    cancelled: "Annulleret",
    paid: "Betalt",
    overdue: "Forfalden",
    active: "Aktiv",
    paused: "Pauseret",
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  };
  return map[status] || "bg-muted text-muted-foreground";
}
