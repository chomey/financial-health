"use client";

import { createContext, useContext } from "react";

export type AppMode = "simple" | "advanced";

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({
  mode,
  setMode,
  children,
}: {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  children: React.ReactNode;
}) {
  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useModeContext(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useModeContext must be used within a ModeProvider");
  return ctx;
}
