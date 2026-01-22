"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { useArtifact, initialArtifactData } from "@/hooks/use-artifact";

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

async function setActiveArtifact(id: string, title: string, slug: string) {
  try {
    await fetch("/api/user/active-artifact", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, slug }),
    });
  } catch {
    // UI эвдэхгүй
  }
}

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();

  // NOTE: useSidebar-ийн type нь openMobile-г гаргадаггүй байж магадгүй тул any cast хийж байна.
  const sidebarApi = useSidebar() as any;
  const setOpenMobile: (open: boolean) => void = sidebarApi.setOpenMobile;
  const openMobile: boolean | undefined = sidebarApi.openMobile;

  const { mutate } = useSWRConfig();

  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ✅ outside click хаалт (sidebar бүхэлдээ ref)
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // ✅ artifact opener
  const { setArtifact } = useArtifact();

  // ✅ MOBILE drawer хаагдах үед menu нээлттэй үлдэх bug-ийг засна
  useEffect(() => {
    if (openMobile === false) {
      setOpenMenuId(null);
    }
  }, [openMobile]);

  // ✅ DESKTOP: sidebar-аас гадуур дарахад menu-г хаана (mobile дээр listener ажиллахгүй)
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) return;
    if (!openMenuId) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = sidebarRef.current;
      if (!el) return;

      if (el.contains(e.target as Node)) return; // дотор бол хаахгүй
      setOpenMenuId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenuId]);

  const handleDeleteAll = () => {
    const deletePromise = fetch("/api/history", { method: "DELETE" });

    toast.promise(deletePromise, {
      loading: "Deleting all chats...",
      success: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        setShowDeleteAllDialog(false);
        setOpenMenuId(null);
        setOpenMobile(false);
        router.replace("/");
        router.refresh();
        return "All chats deleted successfully";
      },
      error: "Failed to delete all chats",
    });
  };

  return (
    <>
      {/* ✅ Sidebar бүхэлдээ ref дотор байна */}
      <div
  ref={sidebarRef}
  style={{ ["--sidebar-width" as any]: "320px" }} // 👈 энд px-ээ өөрчилнө
>
  <Sidebar className="group-data-[side=left]:border-r-0">

          <SidebarHeader>
            <SidebarMenu>
              <div className="flex flex-row items-center justify-between">
                <Link
                  className="flex flex-row items-center gap-3"
                  href="/"
                  onClick={() => {
                    setOpenMobile(false);
                    setOpenMenuId(null);
                  }}
                >
                  <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                    Chatbot
                  </span>
                </Link>

                <div className="flex flex-row gap-1">
                  {user && (
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => setShowDeleteAllDialog(true)}
                      type="button"
                      variant="ghost"
                      aria-label="Delete All Chats"
                      title="Delete All Chats"
                    >
                      <TrashIcon />
                    </Button>
                  )}

                  <Button
                    className="h-8 p-1 md:h-fit md:p-2"
                    onClick={() => {
                      setOpenMobile(false);
                      setOpenMenuId(null);
                      router.push("/");
                      router.refresh();
                    }}
                    type="button"
                    variant="ghost"
                    aria-label="New Chat"
                    title="New Chat"
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </div>
            </SidebarMenu>
          </SidebarHeader>

          {/* ✅ Menu дээр, History доор (history дотроо scroll) */}
          <SidebarContent className="flex flex-col overflow-hidden">
            {/* TOP: menus */}
            <div className="flex-none px-2 py-2">
              <div className="space-y-2">
                {MENUS.map((m: any) => {
                  const isOpen = openMenuId === m.id;
                  const Icon = m.icon;

                  const items = m.items ?? [];
                  const theoryItems = items.filter((it: any) => it.group === "theory");
                  const practiceItems = items.filter((it: any) => it.group === "practice");

                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-muted/60 bg-background"
                    >
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
                        <div className="space-y-3 px-3 pb-3 pt-1">
                          {/* (1) THEORY */}
                          {theoryItems.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-[11px] font-medium text-muted-foreground">
                                Онол
                              </div>

                              <div className="space-y-1">
                                {theoryItems.map((it: any) => {
                                  if (it.artifact) {
                                    return (
                                      <button
                                        key={it.href}
                                        type="button"
                                        className="block w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                                        onClick={() => {
                                          const documentId = `static-${it.href.replace(
                                            /[^a-z0-9]+/gi,
                                            "-",
                                          )}`;

                                          // 1) DB хадгал (slug = it.href)
                                          setActiveArtifact(
                                            documentId,
                                            it.artifact.title,
                                            it.href,
                                          );

                                          // 2) UI дээр нээ + menu хаах
                                          setOpenMobile(false);
                                          setOpenMenuId(null);

                                          setArtifact({
                                            ...initialArtifactData,
                                            documentId,
                                            kind: "text",
                                            title: it.artifact.title,
                                            content: it.artifact.content,
                                            status: "idle",
                                            isVisible: true,
                                          });
                                        }}
                                      >
                                        {it.label}
                                      </button>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={it.href}
                                      href={it.href}
                                      onClick={() => {
                                        setOpenMobile(false);
                                        setOpenMenuId(null);
                                      }}
                                      className="block truncate rounded-md px-2 py-1 text-sm hover:bg-muted"
                                    >
                                      {it.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* (2) APPS / PRACTICE */}
                          {practiceItems.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-[11px] font-medium text-muted-foreground">
                                Апп
                              </div>

                              <div className="space-y-1">
                                {practiceItems.map((it: any) => (
                                  <Link
                                    key={it.href}
                                    href={it.href}
                                    onClick={() => {
                                      setOpenMobile(false);
                                      setOpenMenuId(null);
                                    }}
                                    className="block truncate rounded-md px-2 py-1 text-sm hover:bg-muted"
                                    style={{ color: "#1F6FB2" }}
                                  >
                                    {it.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM: history зөвхөн энд scroll */}
            <div className="min-h-0 flex-1 overflow-y-auto px-1">
              <SidebarHistory user={user} />
            </div>
          </SidebarContent>

          <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
        </Sidebar>
      </div>

      {/* Delete all dialog */}
      <AlertDialog onOpenChange={setShowDeleteAllDialog} open={showDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your chats
              and remove them from our servers.
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
