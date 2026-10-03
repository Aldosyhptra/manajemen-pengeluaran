export default function Loading() {
  return (
    <main className="animate-pulse">
      <div className="h-6 w-32 rounded bg-garis/60" />
      <div className="mt-4 h-48 rounded-[4px] border border-garis bg-struk p-4">
        <div className="h-4 w-28 rounded bg-garis/60" />
        <div className="mt-3 h-10 w-40 rounded bg-garis/40" />
        <div className="mt-2 h-2 w-full rounded bg-kertas" />
        <div className="mt-6 h-4 w-28 rounded bg-garis/60" />
        <div className="mt-3 h-10 w-40 rounded bg-garis/40" />
      </div>
      <div className="mt-6 h-48 rounded border border-garis bg-struk" />
      <div className="mt-6 h-48 rounded border border-garis bg-struk" />
    </main>
  );
}
