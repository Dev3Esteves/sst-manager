import { Skeleton, TableSkeleton, KpiGridSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <KpiGridSkeleton n={4} />
      <div className="rounded-lg border p-6">
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  )
}
