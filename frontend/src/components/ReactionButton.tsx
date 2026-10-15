"use client";

import { useState } from "react";

interface ReactionButtonProps {
  initialActive: boolean;
  initialCount: number;
}

export function ReactionButton({ initialActive, initialCount }: ReactionButtonProps) {
  const [active, setActive] = useState(initialActive);
  const countWithoutMe = initialCount - (initialActive ? 1 : 0);
  const count = countWithoutMe + (active ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => setActive((previous) => !previous)}
      className={active ? "font-semibold text-accent-600" : "text-slate-600 hover:text-brand-600"}
    >
      Przydatne ({count})
    </button>
  );
}
