import type { Database } from "@/lib/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Batch = Database["public"]["Tables"]["batches"]["Row"];

export function ProductInfo({
  product,
  batch,
}: {
  product: Product | null;
  batch: Batch | null;
}) {
  if (!product) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Produto</p>
      <h3 className="mt-1.5 text-base font-semibold text-zinc-900">
        {product.name}
      </h3>
      {product.manufacturer ? (
        <p className="mt-0.5 text-sm text-zinc-600">{product.manufacturer}</p>
      ) : null}

      {batch ? (
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          {batch.manufactured_at ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                Fabricação
              </dt>
              <dd className="mt-0.5 font-medium text-zinc-900">
                {formatDate(batch.manufactured_at)}
              </dd>
            </div>
          ) : null}
          {batch.origin_country ? (
            <div>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                Origem
              </dt>
              <dd className="mt-0.5 font-medium text-zinc-900">
                {batch.origin_country}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

function formatDate(iso: string): string {
  // Formato pt-BR: 15/01/2026
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
