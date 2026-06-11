import { Button } from "@quiniela-mundial-2026/ui/components/button";
import html2canvas from "html2canvas";
import { Download, Share2 } from "lucide-react";
import { useRef, useState, type Ref } from "react";

import { buildShareStandingsModel } from "@/lib/share-standings";
import type { ShareStandingsRow } from "@/lib/share-standings";
import { useI18n } from "@/lib/i18n";
import type { PublicDashboardMatch } from "@/lib/public-dashboard";

type ShareStandingsExportProps = {
  liveMatches: PublicDashboardMatch[];
  rows: ShareStandingsRow[];
};

export function ShareStandingsExport({ liveMatches, rows }: ShareStandingsExportProps) {
  const { locale, t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const model = buildShareStandingsModel({
    generatedAt: Date.now(),
    liveMatches,
    locale,
    rows,
  });

  async function handleExport() {
    const element = cardRef.current;
    if (!element || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#f8f4ec",
        scale: 2,
        useCORS: true,
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) {
        return;
      }

      const file = new File([blob], "quiniela-tabla-completa.png", { type: "image/png" });
      const navigatorWithShare = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (navigator.share && (!navigatorWithShare.canShare || navigatorWithShare.canShare({ files: [file] }))) {
        try {
          await navigator.share({
            files: [file],
            text: model.title,
            title: model.subtitle,
          });
          return;
        } catch {
          // Fall back to download when native sharing rejects file shares.
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = file.name;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mt-4">
      <Button className="w-full rounded-[1rem] sm:w-auto" disabled={rows.length === 0 || isExporting} onClick={handleExport} type="button" variant="outline">
        {isExporting ? <Download aria-hidden="true" className="size-4 animate-pulse" /> : <Share2 aria-hidden="true" className="size-4" />}
        {isExporting ? t.dashboard.exportingStandings : t.dashboard.shareFullStandings}
      </Button>

      <div className="pointer-events-none fixed top-0 left-[-9999px]" aria-hidden="true">
        <ShareStandingsCard ref={cardRef} model={model} />
      </div>
    </div>
  );
}

function ShareStandingsCard({
  model,
  ref,
}: {
  model: ReturnType<typeof buildShareStandingsModel>;
  ref: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} style={{ backgroundColor: "#f8f4ec", color: "#17213f", padding: 48, width: 1080 }}>
      <div
        style={{
          backgroundColor: "#fffdfa",
          border: "1px solid #d8d0bf",
          borderRadius: 42,
          boxShadow: "0 28px 80px rgba(42,57,141,0.18)",
          overflow: "hidden",
        }}
      >
        <div style={{ backgroundColor: "#2A398D", color: "#f8f8f2", padding: "40px 48px" }}>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 24, fontWeight: 900, letterSpacing: "0.2em", margin: 0, textTransform: "uppercase" }}>{model.title}</p>
          <div style={{ alignItems: "flex-end", display: "flex", gap: 32, justifyContent: "space-between", marginTop: 20 }}>
            <h2 style={{ fontFamily: "Anybody, Lexend, sans-serif", fontSize: 72, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.95, margin: 0 }}>{model.subtitle}</h2>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 24, fontWeight: 600, lineHeight: 1.25, margin: 0, maxWidth: 448, textAlign: "right" }}>{model.generatedLabel}</p>
          </div>
        </div>

        <div style={{ padding: "36px 40px" }}>
          <table style={{ borderCollapse: "collapse", textAlign: "left", width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #d8d0bf", color: "#647098", fontSize: 20, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                <th style={{ padding: 16, width: 128 }}>Puesto</th>
                <th style={{ padding: 16 }}>Participante</th>
                <th style={{ padding: 16, textAlign: "right", width: 160 }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row) => (
                <tr key={`${row.rank}-${row.name}`} style={{ borderTop: "1px solid #e5dece" }}>
                  <th style={{ color: "#2A398D", fontFamily: "Anybody, Lexend, sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", padding: 16 }}>#{row.rank}</th>
                  <td style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.035em", padding: 16 }}>{row.name}</td>
                  <td style={{ fontFamily: "Anybody, Lexend, sans-serif", fontSize: 48, fontWeight: 800, letterSpacing: "-0.055em", padding: 16, textAlign: "right" }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ alignItems: "center", backgroundColor: "#f2eadb", borderTop: "1px solid #e5dece", color: "#5d6686", display: "flex", fontSize: 24, fontWeight: 700, justifyContent: "space-between", padding: "24px 48px" }}>
          <span>quiniela.luisralda.com</span>
          <span style={{ backgroundColor: "#BD0015", borderRadius: 999, color: "#ffffff", padding: "8px 16px" }}>Mundial 2026</span>
        </div>
      </div>
    </div>
  );
}
