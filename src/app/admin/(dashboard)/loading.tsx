import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="border-line bg-line grid gap-px border sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="bg-background flex flex-col gap-3 p-5.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="border-line border">
        <div className="border-line-strong flex items-center gap-4 border-b-2 px-5 py-4">
          <Skeleton className="h-4 w-32" />
        </div>

        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="border-line flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
          >
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="hidden h-6 w-24 md:block" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
