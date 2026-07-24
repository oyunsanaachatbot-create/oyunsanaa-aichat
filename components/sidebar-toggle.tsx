import type { ComponentProps } from "react";
import { Menu } from "lucide-react";

import { type SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { SidebarLeftIcon } from "./icons";
import { Button } from "./ui/button";

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();
  const t = useT();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn("h-8 px-2 md:h-fit md:px-2", className)}
          aria-label={t.common.toggleSidebar}
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="outline"
        >
          <span className="md:hidden" aria-hidden="true">
            <Menu size={20} strokeWidth={2.25} />
          </span>
          <span className="hidden md:inline-flex" aria-hidden="true">
            <SidebarLeftIcon size={16} />
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start" className="hidden md:block">
        {t.common.toggleSidebar}
      </TooltipContent>
    </Tooltip>
  );
}
