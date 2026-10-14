export function Mark({
  tone = "lime",
  className = "",
}: {
  tone?: "lime" | "ink";
  className?: string;
}) {
  const ink = tone === "ink";
  return (
    <img
      src={ink ? "/brand/mark-ink.png" : "/brand/mark-lime.png"}
      alt=""
      width={ink ? 638 : 344}
      height={ink ? 323 : 179}
      draggable={false}
      className={`block h-7 w-auto ${className}`}
    />
  );
}

export function Logo({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const dark = variant === "dark";
  return (
    <img
      src={dark ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
      alt="markestra"
      width={888}
      height={dark ? 184 : 183}
      draggable={false}
      className={`block h-auto w-auto max-w-full ${className}`}
    />
  );
}
