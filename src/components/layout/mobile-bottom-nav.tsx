"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, MessagesSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTotalUnread } from "@/hooks/use-total-unread";
import { useTotalChatUnread } from "@/hooks/use-total-chat-unread";

const ITEMS = [
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/chat", label: "Equipe", icon: MessagesSquare },
  { href: "/settings?tab=profile", label: "Perfil", icon: User, match: "/settings" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const inboxUnread = useTotalUnread();
  const chatUnread = useTotalChatUnread();

  return (
    <nav
      aria-label="Navegação mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-2">
        {ITEMS.map((item) => {
          const matchPath = "match" in item && item.match ? item.match : item.href;
          const active =
            pathname === matchPath || pathname.startsWith(`${matchPath}/`);
          const Icon = item.icon;
          const badge =
            item.href === "/inbox"
              ? inboxUnread
              : item.href === "/chat"
                ? chatUnread
                : 0;

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
