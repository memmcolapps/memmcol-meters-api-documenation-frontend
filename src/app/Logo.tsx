/**
 * Platform logo. The image lives at `public/logo.png` and is served from `/logo.png`.
 * Use the `className` to size it per context (see `.brand-logo` variants in index.css).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Momas Memmcol — metering the nation"
      className={`brand-logo${className ? ` ${className}` : ''}`}
    />
  )
}
