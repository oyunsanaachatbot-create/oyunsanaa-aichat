"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { useArtifact, initialArtifactData } from "@/hooks/use-artifact";

import { PlusIcon, TrashIcon } from "@/components/icons";
import { getChatHistoryPaginationKey, SidebarHistory } from "@/components/sidebar-history";
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
const toAbsHref = (href: string) => {
  if (!href) return "/";
  if (href.startsWith("/") || href.startsWith("http")) return href;
  return `/${href}`;
};
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

const ACCENT = "#1F6FB2";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();

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
    if (openMobile === false) setOpenMenuId(null);
  }, [openMobile]);

  // ✅ DESKTOP: sidebar-аас гадуур дарахад menu-г хаана (mobile дээр listener ажиллахгүй)
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

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

  const closeAll = () => {
    setOpenMobile(false);
    setOpenMenuId(null);
  };

  const isActiveHref = (href: string) => {
    const base = toAbsHref(href).split("?")[0];
    if (base === "/") return pathname === "/";
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  const openArtifactPanel = (it: any) => {
    const documentId = `static-${it.href.replace(/[^a-z0-9]/gi, "_")}`;
    setActiveArtifact(documentId, it.artifact.title, it.href);
    closeAll();
    setArtifact({
      ...initialArtifactData,
      documentId,
      kind: "text",
      title: it.artifact.title,
      content: it.artifact.content,
      status: "idle",
      isVisible: true,
    });
  };

  // Онолын зүйл: artifact бол panel нээнэ, эс бол route руу үсэрнэ
  const renderTheoryItem = (it: any) => {
    if (it.artifact) {
      return (
        <button
          key={it.href}
          type="button"
          className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => openArtifactPanel(it)}
        >
          {it.label}
        </button>
      );
    }
    return (
      <Link
        key={it.href}
        href={toAbsHref(it.href)}
        onClick={closeAll}
        className="block truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {it.label}
      </Link>
    );
  };

  // Апп зүйл: онцолсон primary товч/линк — дарвал апп руу үсэрнэ
  const renderAppItem = (it: any) => {
    const active = !it.artifact && isActiveHref(it.href);
    const cls =
      "group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors";
    const style = active
      ? { backgroundColor: ACCENT, borderColor: ACCENT, color: "#fff" }
      : { borderColor: `${ACCENT}40`, color: ACCENT };

    const inner = (
      <>
        <span className="truncate">{it.label}</span>
        <ChevronRight
          className="size-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
        />
      </>
    );

    if (it.artifact) {
      return (
        <button
          key={it.href}
          type="button"
          className={cls}
          style={style}
          onClick={() => openArtifactPanel(it)}
        >
          {inner}
        </button>
      );
    }
    return (
      <Link
        key={it.href}
        href={toAbsHref(it.href)}
        onClick={closeAll}
        className={cls}
        style={style}
      >
        {inner}
      </Link>
    );
  };

  return (
    <>
      {/* ✅ Sidebar бүхэлдээ ref дотор байна */}
      <div ref={sidebarRef} style={{ ["--sidebar-width" as any]: "320px" }}>
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
              <div className="space-y-1.5">
                {MENUS.map((m: any) => {
                  const isOpen = openMenuId === m.id;
                  const Icon = m.icon;

                  const items = m.items ?? [];
                  const theoryItems = items.filter((it: any) => it.group === "theory");
                  const practiceItems = items.filter(
                    (it: any) => it.group === "practice"
                  );

                  // Энэ ангилалын аль нэг хуудсан дээр байгаа эсэх
                  const categoryActive = items.some(
                    (it: any) => !it.artifact && isActiveHref(it.href)
                  );

                  // Зөвхөн нэг апптай, онолгүй ангилал → шууд апп руу үсрэх линк
                  const isDirectApp =
                    theoryItems.length === 0 && practiceItems.length === 1;

                  if (isDirectApp) {
                    const app = practiceItems[0];
                    const active = !app.artifact && isActiveHref(app.href);

                    const headerInner = (
                      <>
                        <span className="flex items-center gap-2.5">
                          <span
                            className="inline-flex size-7 items-center justify-center rounded-md"
                            style={{
                              color: active ? "#fff" : ACCENT,
                              backgroundColor: active
                                ? "rgba(255,255,255,0.18)"
                                : `${ACCENT}14`,
                            }}
                          >
                            <Icon size={17} />
                          </span>
                          <span className="truncate text-sm font-semibold">
                            {m.label}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
                      </>
                    );

                    const headerCls =
                      "group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors";
                    const headerStyle = active
                      ? { backgroundColor: ACCENT, borderColor: ACCENT, color: "#fff" }
                      : undefined;

                    if (app.artifact) {
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`${headerCls} border-muted/60 hover:bg-muted/60`}
                          onClick={() => openArtifactPanel(app)}
                        >
                          {headerInner}
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={m.id}
                        href={toAbsHref(app.href)}
                        onClick={closeAll}
                        className={`${headerCls} ${
                          active ? "" : "border-muted/60 hover:bg-muted/60"
                        }`}
                        style={headerStyle}
                      >
                        {headerInner}
                      </Link>
                    );
                  }

                  // Онолтой ангилал → нээгддэг dropdown
                  return (
                    <div
                      key={m.id}
                      className={`overflow-hidden rounded-lg border transition-colors ${
                        categoryActive
                          ? "border-transparent"
                          : isOpen
                            ? "border-muted bg-muted/30"
                            : "border-muted/60 bg-background"
                      }`}
                      style={
                        categoryActive
                          ? {
                              borderColor: `${ACCENT}55`,
                              backgroundColor: `${ACCENT}0D`,
                            }
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenMenuId(isOpen ? null : m.id)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className="inline-flex size-7 items-center justify-center rounded-md"
                            style={{
                              color: ACCENT,
                              backgroundColor: categoryActive
                                ? `${ACCENT}26`
                                : `${ACCENT}14`,
                            }}
                          >
                            <Icon size={17} />
                          </span>
                          <span
                            className="truncate text-sm font-semibold"
                            style={categoryActive ? { color: ACCENT } : undefined}
                          >
                            {m.label}
                          </span>
                        </span>

                        <ChevronRight
                          className={`size-4 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                          style={{
                            color: categoryActive ? ACCENT : undefined,
                          }}
                        />
                      </button>

                      {/* Smooth expand/collapse */}
                      <div
                        className={`grid transition-all duration-200 ease-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-3 px-2 pb-3 pt-1">
                            {/* (1) APP — онцолсон, дээр нь */}
                            {practiceItems.length > 0 && (
                              <div className="space-y-1.5">
                                {practiceItems.map((it: any) => renderAppItem(it))}
                              </div>
                            )}

                            {/* (2) THEORY */}
                            {theoryItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Онол
                                </div>
                                <div className="space-y-0.5">
                                  {theoryItems.map((it: any) => renderTheoryItem(it))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
            <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
