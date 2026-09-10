import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
      <Toaster />
    </>
  );
}
