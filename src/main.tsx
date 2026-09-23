import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Login from "@/features/auth/pages/LoginPage";
import Home from "@/features/auth/pages/Home";
import { adminLoader, ongLoader, protectedLoader, publicOnlyLoader } from "./routes/guards";
import { AppLayout, AuthLayout } from "./components/layout/LayoutWrapper";
import { RouteError } from "./components/layout/RouteError";
import { Placeholder } from "./components/layout/Placeholder";
import { createAppQueryClient } from "./lib/queryClient";
import App from "./App";

import "./index.css";

const queryClient = createAppQueryClient();

function lazyPage(
  importer: () => Promise<{ default: React.ComponentType }>,
): () => Promise<{ Component: React.ComponentType }> {
  return async () => ({ Component: (await importer()).default });
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { index: true, element: <Home />, loader: publicOnlyLoader },
          { path: "login", element: <Login />, loader: publicOnlyLoader },
          {
            path: "cadastrar",
            lazy: lazyPage(() => import("./features/auth/pages/SignUpPage")),
          },
          {
            path: "recuperar-senha",
            lazy: lazyPage(
              () => import("./features/auth/pages/ForgotPasswordPage"),
            ),
          },
          {
            path: "redefinir-senha",
            lazy: lazyPage(
              () => import("./features/auth/pages/ResetPasswordPage"),
            ),
          },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          {
            path: "necessidades",
            loader: protectedLoader,
            lazy: lazyPage(() => import("./features/needs/pages/SearchNeedsPage")),
          },
          {
            path: "necessidades/:id",
            loader: protectedLoader,
            lazy: lazyPage(() => import("./features/needs/pages/NeedDetailPage")),
          },
          {
            path: "painel",
            loader: ongLoader,
            lazy: lazyPage(() => import("./features/needs/pages/OngDashboardPage")),
          },
          {
            path: "painel/necessidades/nova",
            loader: ongLoader,
            lazy: lazyPage(() => import("./features/needs/pages/CreateNeedPage")),
          },
          {
            path: "painel/necessidades/:id/editar",
            loader: ongLoader,
            lazy: lazyPage(() => import("./features/needs/pages/EditNeedPage")),
          },
          {
            path: "painel/horarios",
            loader: ongLoader,
            lazy: lazyPage(() => import("./features/ongs/pages/OngHoursPage")),
          },
          {
            path: "ongs/:id",
            loader: protectedLoader,
            lazy: lazyPage(() => import("./features/ongs/pages/OngProfilePage")),
          },
          // as telas abaixo ainda são placeholders: o shell logado já navega,
          // as features entram nas próximas etapas
          {
            path: "minhas-doacoes",
            loader: protectedLoader,
            element: (
              <Placeholder
                title="Minhas doações"
                description="Histórico de interesses manifestados e instituições que você segue."
              />
            ),
          },
          {
            path: "notificacoes",
            loader: protectedLoader,
            element: (
              <Placeholder
                title="Notificações"
                description="Avisos das ONGs que você segue, via Supabase Realtime (RF09)."
              />
            ),
          },
          {
            path: "perfil",
            loader: protectedLoader,
            element: (
              <Placeholder
                title="Perfil"
                description="Seus dados, preferências e exclusão de conta (RNF03/LGPD)."
              />
            ),
          },
          {
            path: "admin",
            loader: adminLoader,
            element: (
              <Placeholder
                title="Painel do administrador"
                description="Aprovação e recusa de ONGs pendentes de verificação (RF08)."
              />
            ),
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
