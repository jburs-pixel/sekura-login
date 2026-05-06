import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DistributorCTA } from "@/components/scanner/DistributorCTA";
import { ProductInfo } from "@/components/scanner/ProductInfo";
import { StatusCard } from "@/components/scanner/StatusCard";
import { getClientIp } from "@/lib/scan/ipHash";
import { parseCountry, parseToken } from "@/lib/scan/parseToken";
import { recordScan } from "@/lib/scan/recordScan";
import { createClient } from "@/lib/supabase/server";

// El scan tiene side effect (insert en scans), no se puede cachear.
export const dynamic = "force-dynamic";

export default async function ScannerPage({
  params,
}: {
  params: Promise<{ country: string; token: string }>;
}) {
  const { country: rawCountry, token: rawToken } = await params;

  // Validar país (V1: solo BR)
  const countryResult = parseCountry(rawCountry);
  if (!countryResult.ok) notFound();

  // Validar formato del token client-side antes de tocar Supabase
  // (criterio aceptación #2 — falla rápida con 404 en vez de 400 random).
  const tokenResult = parseToken(rawToken);
  if (!tokenResult.ok) notFound();

  // Hacer el scan + insert en la misma request (no roundtrip).
  // Usamos los headers del request para IP y user-agent reales.
  const headerList = await headers();
  const fakeRequest = new Request("http://internal", {
    headers: headerList,
  });
  const ip = getClientIp(fakeRequest);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await recordScan({
    token: tokenResult.value.raw,
    ip,
    userAgent: headerList.get("user-agent"),
    userId: user?.id ?? null,
  });

  // Si el RPC falla, mostramos un estado neutro. Es mejor que un 500.
  if (!result.ok) {
    return <ErrorView />;
  }

  const response = result.value;

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Sekura</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Verificação de produto
        </h1>
      </header>

      <div className="space-y-4">
        <StatusCard result={response.result} />

        {response.result !== "unknown" ? (
          <ProductInfo product={response.product} batch={response.batch} />
        ) : null}

        <DistributorCTA
          country={countryResult.value}
          token={tokenResult.value.raw}
        />
      </div>

      <footer className="mt-10 text-center">
        <p className="text-xs text-zinc-400">
          Código: <span className="font-mono">{tokenResult.value.raw}</span>
        </p>
      </footer>
    </main>
  );
}

function ErrorView() {
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-7">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Erro temporário
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
          Não conseguimos verificar o código neste momento. Tente novamente em
          alguns minutos.
        </p>
      </div>
    </main>
  );
}
