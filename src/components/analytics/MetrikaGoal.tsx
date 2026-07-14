"use client";

import { useEffect } from "react";
import { reachMetrikaGoal } from "@/lib/metrika-client";

export function MetrikaGoal({
  goal,
  once = true,
}: {
  goal: string;
  once?: boolean;
}) {
  useEffect(() => {
    if (once && sessionStorage.getItem(`metrika:${goal}`)) return;
    reachMetrikaGoal(goal);
    if (once) sessionStorage.setItem(`metrika:${goal}`, "1");
  }, [goal, once]);

  return null;
}
