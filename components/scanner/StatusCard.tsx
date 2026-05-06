import type { ScanResult } from "@/lib/types/database";

type StatusConfig = {
  label: string;
  description: string;
  // Color principal del estado, aplicado al ícono y al borde superior.
  color: "green" | "amber" | "red" | "blue";
  Icon: () => React.ReactElement;
};

const STATUS_CONFIG: Record<ScanResult, StatusConfig> = {
  authentic: {
    label: "Produto autêntico",
    description: "Este código foi verificado pelo fabricante.",
    color: "green",
    Icon: CheckIcon,
  },
  suspicious: {
    label: "Atenção: padrão suspeito",
    description:
      "Este código foi escaneado várias vezes em pouco tempo. Pode indicar uma cópia.",
    color: "amber",
    Icon: AlertIcon,
  },
  unknown: {
    label: "Código não encontrado",
    description:
      "Não conseguimos identificar este produto. Verifique se escaneou o código correto.",
    color: "red",
    Icon: XIcon,
  },
  already_claimed: {
    label: "Item já registrado",
    description:
      "Este produto já foi registrado por outro distribuidor em nossa rede.",
    color: "blue",
    Icon: InfoIcon,
  },
};

const COLOR_CLASSES: Record<StatusConfig["color"], string> = {
  green: "border-emerald-500 bg-emerald-50 text-emerald-900",
  amber: "border-amber-500 bg-amber-50 text-amber-900",
  red: "border-red-500 bg-red-50 text-red-900",
  blue: "border-sky-500 bg-sky-50 text-sky-900",
};

const ICON_COLOR: Record<StatusConfig["color"], string> = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  blue: "text-sky-600",
};

export function StatusCard({ result }: { result: ScanResult }) {
  const config = STATUS_CONFIG[result];
  const { Icon } = config;

  return (
    <div
      className={`rounded-2xl border-t-4 bg-white px-6 py-7 shadow-sm ${COLOR_CLASSES[config.color]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 ${ICON_COLOR[config.color]}`}>
          <Icon />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {config.label}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Iconos (SVG inline, 28×28, stroke-based para mantener nitidez en HiDPI)
// =============================================================================

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
