import type { ReactNode } from "react";
import { BackButton } from "@/components/shared/BackButton";

export function NeedPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-xl font-medium">{title}</h1>
      </div>

      {children}
    </div>
  );
}
