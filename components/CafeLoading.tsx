
import {
  Coffee,
  Gamepad2,
  Sparkles,
} from "lucide-react";

type CafeLoadingProps = {
  statusText?: string;
  serverText?: string;
  fullScreen?: boolean;
};

export default function CafeLoading({
  statusText = "در حال آماده‌سازی سیستم و رزرو",
  serverText = "سرور رزرو: فعال و آماده‌به‌کار",
  fullScreen = true,
}: CafeLoadingProps) {
  return (
    <main
      dir="rtl"
      aria-label="در حال بارگذاری"
      aria-busy="true"
      className={`relative isolate flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 py-12 text-slate-100 ${
        fullScreen ? "min-h-screen" : "min-h-[500px] h-full"
      }`}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-3xl animate-pulse"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl animate-ping [animation-duration:3s]"
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated logo */}
        <div className="relative mb-6 flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-purple-500 border-t-cyan-400 [animation-duration:1.8s]" />

          {/* Inner reverse spinning ring */}
          <div className="absolute inset-3 animate-spin rounded-full border-2 border-transparent border-b-fuchsia-500 border-l-cyan-300 opacity-80 [animation-direction:reverse] [animation-duration:2.5s]" />

          {/* Center badge */}
          <div className="animate-cafe-float relative flex h-28 w-28 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 shadow-2xl shadow-purple-900/50 backdrop-blur-md sm:h-32 sm:w-32">
            {/* Coffee steam */}
            <div
              aria-hidden="true"
              className="absolute -top-4 flex items-center justify-center gap-1.5"
            >
              <span className="h-4 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-300ms]" />
              <span className="h-5 w-1.5 animate-bounce rounded-full bg-purple-400 [animation-delay:-150ms]" />
              <span className="h-4 w-1.5 animate-bounce rounded-full bg-fuchsia-400" />
            </div>

            {/* Gamepad */}
            <Gamepad2
              aria-hidden="true"
              className="h-12 w-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]"
              strokeWidth={1.8}
            />

            {/* Coffee icon */}
            <div className="absolute -bottom-2 -right-3 rounded-full border border-slate-700 bg-slate-950 p-1.5 shadow-lg">
              <Coffee
                aria-hidden="true"
                className="h-6 w-6 text-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Brand title */}
        <div className="max-w-sm space-y-3 px-4 text-center">
          <h1 className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-500 bg-clip-text text-3xl font-black uppercase tracking-widest text-transparent drop-shadow-[0_4px_15px_rgba(168,85,247,0.4)] sm:text-4xl">
            CAFE GAME{" "}
            <span className="inline-block border-b-2 border-cyan-400 text-cyan-400">
              HD
            </span>
          </h1>

          {/* Status text */}
          <div
            role="status"
            className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 sm:text-sm"
          >
            <Sparkles
              aria-hidden="true"
              className="h-4 w-4 shrink-0 animate-spin text-cyan-400"
            />

            <span>{statusText}</span>

            <span
              aria-hidden="true"
              className="inline-flex"
            >
              <span className="animate-ping">.</span>
              <span className="animate-ping [animation-delay:200ms]">.</span>
              <span className="animate-ping [animation-delay:400ms]">.</span>
            </span>
          </div>
        </div>

        {/* Animated loading bar */}
        <div
          className="relative mt-7 h-2 w-64 overflow-hidden rounded-full border border-slate-700/60 bg-slate-800/80 shadow-inner sm:w-80"
          aria-hidden="true"
        >
          <div className="animate-cafe-loading-bar absolute inset-y-0 right-0 w-full rounded-full bg-gradient-to-l from-cyan-500 via-purple-500 to-fuchsia-500" />
        </div>

        {/* Server status */}
        <div className="mt-6 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>{serverText}</span>
        </div>
      </div>
    </main>
  );
}
