
"use client";

import { useEffect, useState } from "react";
import CafeLoading from "@/components/CafeLoading";

export default function InitialLoading() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (ready) return null;

  return (
    <div className="fixed inset-0 z-[99999]">
      <CafeLoading fullScreen />
    </div>
  );
}
