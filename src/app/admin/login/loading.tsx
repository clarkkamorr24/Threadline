import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoginLoading() {
  return (
    <main
      className="bg-admin-sidebar grid min-h-dvh place-items-center px-5 py-12"
      role="status"
      aria-label="Loading"
    >
      <div className="w-full max-w-96">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-40 bg-white/15" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>

        <div className="bg-background border-line flex flex-col gap-5 border p-7">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </main>
  );
}
