"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";

interface ToastOptions {
  description?: string;
}

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONES: Record<
  ToastTone,
  { icon: typeof CheckCircle2; iconWrap: string; bar: string }
> = {
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-moss/10 text-moss",
    bar: "bg-moss",
  },
  error: {
    icon: AlertCircle,
    iconWrap: "bg-[#b42318]/10 text-[#b42318]",
    bar: "bg-[#b42318]",
  },
  info: {
    icon: Info,
    iconWrap: "bg-[#1f7a4d]/10 text-[#16603b]",
    bar: "bg-[#1f7a4d]",
  },
};

/**
 * Lightweight, non-blocking feedback for background actions. Actions close
 * their overlay instantly and report success or failure through a toast.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, options?: ToastOptions) => {
      nextId.current += 1;
      const id = nextId.current;
      setItems((current) => [
        ...current.slice(-3),
        { id, tone, title, description: options?.description },
      ]);
      window.setTimeout(() => dismiss(id), 6_000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, options) => push("success", title, options),
      error: (title, options) => push("error", title, options),
      info: (title, options) => push("info", title, options),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {items.map((item) => {
          const tone = TONES[item.tone];
          const Icon = tone.icon;
          return (
            <div
              key={item.id}
              role={item.tone === "error" ? "alert" : "status"}
              className="toast-in pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-ink/[0.08] bg-white py-3 pl-3.5 pr-2.5 shadow-[0_18px_44px_-20px_rgba(6,32,20,0.45)]"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-[3px] ${tone.bar}`}
              />
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone.iconWrap}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[0.8125rem] font-semibold leading-tight text-ink">
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-1 text-[0.75rem] leading-[1.5] text-ink/55">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink/35 transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
}
