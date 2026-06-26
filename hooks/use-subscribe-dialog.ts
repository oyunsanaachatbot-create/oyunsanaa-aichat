"use client";

import useSWR from "swr";

export function useSubscribeDialog() {
  const { data: isOpen, mutate } = useSWR<boolean>("subscribe-dialog-open", null, {
    fallbackData: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    isOpen: isOpen ?? false,
    openSubscribeDialog: () => mutate(true, { revalidate: false }),
    closeSubscribeDialog: () => mutate(false, { revalidate: false }),
  };
}
