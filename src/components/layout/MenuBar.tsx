import {
  Bell,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useProfile, useLogout, type UserType } from "@/features/auth";
import icone from "@/assets/icone.png";

type MenuItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  link: string;
};

const BUSCAR: MenuItem = {
  id: "necessidades",
  icon: Search,
  label: "Buscar",
  link: "/necessidades",
};

const PERFIL: MenuItem = {
  id: "perfil",
  icon: User,
  label: "Perfil",
  link: "/perfil",
};

const MENU_BY_USER_TYPE: Record<UserType, MenuItem[]> = {
  donor: [
    BUSCAR,
    {
      id: "doacoes",
      icon: HandHeart,
      label: "Doações",
      link: "/minhas-doacoes",
    },
    {
      id: "notificacoes",
      icon: Bell,
      label: "Avisos",
      link: "/notificacoes",
    },
    PERFIL,
  ],
  ong: [
    {
      id: "painel",
      icon: LayoutDashboard,
      label: "Painel",
      link: "/painel",
    },
    BUSCAR,
    PERFIL,
  ],
  admin: [
    {
      id: "admin",
      icon: ShieldCheck,
      label: "Admin",
      link: "/admin",
    },
    BUSCAR,
    PERFIL,
  ],
};

export default function MenuBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  const { data: profile } = useProfile();
  const menuItems = MENU_BY_USER_TYPE[profile?.user_type ?? "donor"];
  const home = menuItems[0].link;

  const isActive = (link: string) =>
    location.pathname === link || location.pathname.startsWith(`${link}/`);

  return (
    <nav
      className={cn(
        "fixed z-50 border-border bg-surface",
        "bottom-0 left-0 right-0 border-t p-2",
        "md:top-0 md:bottom-auto md:border-b md:border-t-0 md:px-8 md:py-4",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          className="hidden cursor-pointer items-center gap-2 md:flex"
          onClick={() => navigate(home)}
        >
          <img src={icone} alt="Elovoz" className="h-10 w-auto" />
        </button>

        {/* Mobile */}
        <div className="flex w-full justify-around md:hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.link);

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => navigate(item.link)}
                className="flex h-auto flex-col gap-1 py-2"
              >
                <Icon
                  className={cn(
                    "size-6",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.link);

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => navigate(item.link)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}

          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="size-5" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
