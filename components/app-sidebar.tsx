"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { PlusIcon, TrashIcon } from "@/components/icons";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import { MENUS } from "@/config/menus";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);


  const handleDeleteAll = () => {
    const deletePromise = fetch("/api/history", {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting all chats...",
      success: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        setShowDeleteAllDialog(false);
        router.replace("/");
        router.refresh();
        return "All chats deleted successfully";
      },
      error: "Failed to delete all chats",
    });
  };

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-3"
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                  Chatbot
                </span>
              </Link>
              <div className="flex flex-row gap-1">
                {user && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-8 p-1 md:h-fit md:p-2"
                        onClick={() => setShowDeleteAllDialog(true)}
                        type="button"
                        variant="ghost"
                      >
                        <TrashIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      Delete All Chats
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/");
                        router.refresh();
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    New Chat
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex flex-col overflow-hidden">
  {/* ======= TOP: 6 ICON MENUS ======= */}
  <div className="flex-none px-2 py-2">
    <div className="space-y-2">
      {MENUS.map((m) => {
        const isOpen = openMenuId === m.id;
        const Icon = m.icon;

        const items = m.items ?? [];

        // group-тэй бол group-оор нь, байхгүй бол (fallback): 1=theory, 2=apps, үлдсэн=reports
        const theoryItems = items.filter((it: any, idx: number) =>
          it.group ? it.group === "theory" : idx === 0
        );
        const appItems = items.filter((it: any, idx: number) =>
          it.group ? it.group === "apps" : idx === 1
        );
        const reportItems = items.filter((it: any, idx: number) =>
          it.group ? it.group === "reports" : idx >= 2
        );

        return (
          <div key={m.id} className="rounded-lg border border-muted/60 bg-background">
            <button
              type="button"
              onClick={() => setOpenMenuId(isOpen ? null : m.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                  style={{ color: "#1F6FB2" }}
                >
                  <Icon size={18} />
                </span>
                <span className="text-sm font-semibold">{m.label}</span>
              </div>

              <span className="text-xs text-muted-foreground">
                {isOpen ? "—" : "+"}
              </span>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-1 space-y-3">
                {/* (1) THEORY */}
                {theoryItems.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Онол
                    </div>
                    <div className="space-y-1">
                      {theoryItems.map((it: any) => (
                        <Link
                          key={it.href}
                          href={it.href}
                          onClick={() => setOpenMobile(false)}
                          className="block rounded-md px-2 py-1 text-sm hover:bg-muted"
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* (2) APPS (brand өнгө) */}
                {appItems.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Апп
                    </div>
                    <div className="space-y-1">
                      {appItems.map((it: any) => (
                        <Link
                         key={it.href}


        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
