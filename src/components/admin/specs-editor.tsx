"use client";

import { useState } from "react";
import { inputClass } from "./form-field";

export type SpecItem = { label: string; value: string };

export function SpecsEditor({
  name,
  initialItems,
}: {
  name: string;
  initialItems: SpecItem[];
}) {
  const [items, setItems] = useState<SpecItem[]>(initialItems);

  function update(index: number, patch: Partial<SpecItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={item.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="Örn. Kapasite"
            className={`${inputClass} w-1/3`}
          />
          <input
            value={item.value}
            onChange={(e) => update(index, { value: e.target.value })}
            placeholder="Örn. 50 büyükbaş/gün"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => move(index, -1)}
            className="h-8 w-8 shrink-0 rounded-md border border-neutral-700 text-xs text-neutral-300"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(index, 1)}
            className="h-8 w-8 shrink-0 rounded-md border border-neutral-700 text-xs text-neutral-300"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => remove(index)}
            className="h-8 w-8 shrink-0 rounded-md border border-neutral-700 text-xs text-red-400"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { label: "", value: "" }])}
        className="h-10 self-start rounded-md border border-neutral-700 px-4 text-sm text-neutral-200"
      >
        + Özellik Ekle
      </button>
    </div>
  );
}
