export default function App() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Fotocopy Platform
        </p>
        <h1 className="mt-3 text-4xl font-bold">Dashboard toko siap dikembangkan</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Platform ini dirancang untuk toko fotokopi, digital printing, dan usaha jasa dokumen dengan arsitektur multi-tenant.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-2 text-2xl font-semibold">Phase 1</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Tenant</p>
            <p className="mt-2 text-2xl font-semibold">Multi-store</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Prioritas</p>
            <p className="mt-2 text-2xl font-semibold">Pembayaran dulu</p>
          </div>
        </div>
      </div>
    </main>
  );
}
