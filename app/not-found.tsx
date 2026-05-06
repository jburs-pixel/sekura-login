export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          El enlace que seguiste no existe o expiró.
        </p>
      </div>
    </main>
  );
}
