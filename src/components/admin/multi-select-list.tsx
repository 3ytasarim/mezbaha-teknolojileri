"use client";

import { useState } from "react";

export function MultiSelectList({
  name,
  options,
  initialSelectedIds,
  emptyLabel,
}: {
  name: string;
  options: { id: string; label: string }[];
  initialSelectedIds: string[];
  emptyLabel: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-950 p-2">
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {options.length === 0 && <p className="p-2 text-xs text-neutral-500">{emptyLabel}</p>}
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
        >
          <input
            type="checkbox"
            checked={selected.has(option.id)}
            onChange={() => toggle(option.id)}
            className="h-4 w-4"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
