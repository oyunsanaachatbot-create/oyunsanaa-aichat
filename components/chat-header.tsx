"use client";
import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const t = useT();
  return (
    <header className="shrink-0 border-border border-b bg-card px-3 py-2 md:px-6">
      <div className="flex min-h-11 items-center gap-2">
        <SidebarToggle />
        <span className="flex flex-1 items-center justify-center gap-2 font-semibold text-lg md:justify-start">
          <span
            aria-hidden="true"
            className="size-5 rounded-full border-2 border-primary"
          />
          {t.nav.appName}
        </span>
        <LanguageSwitcher className="size-11 p-2 sm:w-auto" />
        <Button
          aria-label={t.common.newChat}
          className="size-11 p-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="ghost"
        >
          <SquarePen className="size-5" />
        </Button>
      </div>
      {!isReadonly && (
        <div className="flex justify-center pt-1 md:justify-start md:pl-12">
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        </div>
      )}
    </header>
  );
}
export const ChatHeader = memo(PureChatHeader);
