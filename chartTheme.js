// Reads CSS color tokens for use in Recharts, which needs concrete color strings
// (SVG attributes don't resolve CSS variables). Call inside a component body.
export function getChartColors() {
  const root = getComputedStyle(document.documentElement);
  const v = (name, fallback) => {
    const val = root.getPropertyValue(name).trim();
    return val || fallback;
  };
  return {
    gold: `hsl(${v('--luxury-gold', '220 88% 55%')})`,
    green: `hsl(${v('--luxury-teal', '141 53% 53%')})`,
    blue: `hsl(${v('--luxury-blue', '39 54% 65%')})`,
    grid: `hsl(${v('--border', '206 14% 18%')})`,
    tooltipBg: `hsl(${v('--popover', '206 26% 8%')})`,
    tooltipBorder: `hsl(${v('--border', '206 14% 18%')})`,
    text: `hsl(${v('--muted-foreground', '206 8% 67%')})`,
  };
}