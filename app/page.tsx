export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sekura</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Verificación de autenticidad por código.
        </p>
        <p className="mt-6 text-xs text-zinc-400">
          Escaneá el QR de tu producto para continuar.
        </p>
      </div>
    </main>
  );
}
