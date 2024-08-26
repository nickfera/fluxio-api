export function formatResponseTime(responseTime: number | string): string {
  let num = Number(responseTime);
  let unit = "ms";

  if (num >= 1000) {
    num /= 1000;
    unit = "s";
  }

  return `${new Intl.NumberFormat(undefined, { style: "decimal" }).format(
    Number(num.toFixed(2)),
  )} ${unit}`;
}
