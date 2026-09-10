import { Outlet } from "react-router-dom";
import MenuBar from "./MenuBar";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-10 sm:px-6 lg:max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-28 sm:px-6 md:pt-28 lg:max-w-7xl lg:pb-10">
        <Outlet />
      </main>

      <MenuBar />
    </div>
  );
}
