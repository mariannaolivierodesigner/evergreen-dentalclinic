import { useEffect, useState } from "react";

// Chrome/Edge (desktop e Android) espongono l'evento "beforeinstallprompt" quando
// il sito soddisfa i requisiti PWA (manifest + service worker + HTTPS). Safari/iOS
// non lo supporta: lì l'installazione avviene da "Condividi → Aggiungi a Home".
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !installed, promptInstall };
}

export function InstallAppButton({ className }: { className?: string }) {
  const { canInstall, promptInstall } = useInstallPrompt();
  if (!canInstall) return null;

  return (
    <button
      onClick={promptInstall}
      className={
        className ??
        "inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-xs font-medium transition-colors hover:bg-secondary"
      }
    >
      Installa app
    </button>
  );
}
