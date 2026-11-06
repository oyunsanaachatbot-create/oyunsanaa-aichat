"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { setPrivateCacheOwner } from "@/lib/mind/private-cache";
export function PrivateCacheBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, status } = useSession();
  const userId = status === "loading" ? null : (data?.user?.id ?? "guest");
  const [readyFor, setReadyFor] = useState<string | null>(null);
  useEffect(() => {
    setPrivateCacheOwner(userId);
    setReadyFor(userId);
    return () => setPrivateCacheOwner(null);
  }, [userId]);
  if (!userId || readyFor !== userId) return <output>Уншиж байна…</output>;
  return (
    <div className="contents" key={userId}>
      {children}
    </div>
  );
}
