import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function AdminInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => setInstalled(media.matches);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener?.("change", onDisplayChange);
    onDisplayChange();
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  if (installed || !promptEvent) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        const result = await promptEvent.userChoice;
        if (result.outcome === "accepted") setInstalled(true);
        setPromptEvent(null);
      }}
      className="inline-flex h-10 items-center gap-2 border border-[#d5dae5] bg-[#fffefe] px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#35405b] hover:border-[#9eadd1]"
    >
      <Download size={14} />
      <span className="hidden sm:inline">Install app</span>
    </button>
  );
}
