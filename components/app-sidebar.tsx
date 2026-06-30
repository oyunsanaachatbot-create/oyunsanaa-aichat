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
import { useT } from "@/lib/i18n/provider";

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
  const t = useT();

  // Menu labels live in config/menus.ts (Mongolian); translate via the
  // group id / item key, falling back to the embedded label.
  const groupLabel = (m: any): string =>
    (t.menu.groups as Record<string, string>)[m.id] ?? m.label;
  const itemLabel = (it: any): string =>
    (it.key && (t.menu.items as Record<string, string>)[it.key]) || it.label;

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
      loading: t.sidebar.deletingAll,
      success: () => {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        setShowDeleteAllDialog(false);
        setOpenMenuId(null);
        setOpenMobile(false);
        router.replace("/");
        router.refresh();
        return t.sidebar.deletedAll;
      },
      error: t.sidebar.deleteAllFailed,
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
    if (it.comingSoon) {
      return (
        <div
          key={it.href}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted-foreground/60"
        >
          <span className="size-1 shrink-0 rounded-full bg-muted-foreground/30" />
          <span className="truncate">{itemLabel(it)}</span>
          <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
            {t.sidebar.comingSoon}
          </span>
        </div>
      );
    }

    const cls =
      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
    const inner = (
      <>
        <span
          className="size-1 shrink-0 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-[color:var(--mind-accent)]"
          style={{ ["--mind-accent" as any]: ACCENT }}
        />
        <span className="truncate">{itemLabel(it)}</span>
      </>
    );

    if (it.artifact) {
      return (
        <button
          key={it.href}
          type="button"
          className={cls}
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
      >
        {inner}
      </Link>
    );
  };

  // Апп зүйл: цэвэрхэн жагсаалтын мөр — идэвхтэй нь брэнд өнгөөр дүүрнэ
  const renderAppItem = (it: any) => {
    if (it.comingSoon) {
      return (
        <div
          key={it.href}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground/40"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
          <span className="truncate">{itemLabel(it)}</span>
          <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground/70">
            {t.sidebar.comingSoon}
          </span>
        </div>
      );
    }

    const active = !it.artifact && isActiveHref(it.href);
    const base =
      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-all";
    const cls = active
      ? `${base} text-white`
      : `${base} text-foreground/80 hover:bg-muted hover:text-foreground`;
    const style = active ? { backgroundColor: ACCENT } : undefined;

    const inner = (
      <>
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: active ? "#fff" : ACCENT }}
        />
        <span className="truncate">{itemLabel(it)}</span>
        <ChevronRight
          className={`ml-auto size-3.5 shrink-0 transition-all group-hover:translate-x-0.5 ${
            active ? "opacity-90" : "opacity-0 group-hover:opacity-50"
          }`}
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
                    {t.nav.appName}
                  </span>
                </Link>

                <div className="flex flex-row gap-1">
                  {user && (
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => setShowDeleteAllDialog(true)}
                      type="button"
                      variant="ghost"
                      aria-label={t.nav.deleteAllChats}
                      title={t.nav.deleteAllChats}
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
                    aria-label={t.nav.newChat}
                    title={t.nav.newChat}
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
                            {groupLabel(m)}
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
                            {groupLabel(m)}
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
                                  {t.sidebar.theory}
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
            <AlertDialogTitle>{t.sidebar.deleteAllTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.sidebar.deleteAllDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              {t.sidebar.deleteAllConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
