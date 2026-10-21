"use client";

import { useLayoutEffect, useRef } from "react";

export function SegmentedControl<T extends string>({
  value, items, onChange, label,
}: {
  value: T;
  items: { id: T; label: string; count?: number }[];
  onChange: (value: T) => void;
  label: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const selected = root.querySelector<HTMLButtonElement>("[aria-pressed=true]");
      if (!selected) return;
      root.style.setProperty("--segment-x", `${selected.offsetLeft}px`);
      root.style.setProperty("--segment-width", `${selected.offsetWidth}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll("button").forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="segmented-control" ref={rootRef} role="group" aria-label={label}>
      <span className="segmented-control-pill" aria-hidden="true" />
      {items.map((item) => (
        <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => onChange(item.id)}>
          {item.label}
          {item.count !== undefined && <span className="segment-count">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
