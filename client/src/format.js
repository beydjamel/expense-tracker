export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function today() {
  const d = new Date();
  return `${currentMonth()}-${String(d.getDate()).padStart(2, "0")}`;
}

export function money(value) {
  const n = Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n} DA`;
}
