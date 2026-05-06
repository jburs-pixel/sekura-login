import Link from "next/link";

/**
 * CTA para distribuidores. Lleva al login con `?next=` apuntando al detalle
 * operativo del mismo ítem, así después del magic link el usuario aterriza
 * directo en la vista protegida.
 */
export function DistributorCTA({
  country,
  token,
}: {
  country: string;
  token: string;
}) {
  const detailPath = `/${country}/scanner/${token}/detail`;
  const loginHref = `/login?next=${encodeURIComponent(detailPath)}`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-5">
      <p className="text-sm text-zinc-700">
        É distribuidor deste produto? Acesse o detalhe operativo:
        histórico de scans, rota logística e ações.
      </p>
      <Link
        href={loginHref}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Entrar como distribuidor
      </Link>
    </div>
  );
}
