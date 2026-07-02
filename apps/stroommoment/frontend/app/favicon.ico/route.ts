const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#14251d"/><circle cx="32" cy="32" r="22" fill="#fffdf6"/><path d="M34 9v8M34 47v8M9 32h8M47 32h8" stroke="#1f7a4f" stroke-width="4" stroke-linecap="round"/><path d="M31 17 20 35h10l-4 13 16-21H32l4-10z" fill="#1f7a4f"/><path d="M32 32 44 24" stroke="#ffe08a" stroke-width="4" stroke-linecap="round"/></svg>`;

export const dynamic = "force-static";

export function GET() {
  return new Response(iconSvg, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
