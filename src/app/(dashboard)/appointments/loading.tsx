export default function AppointmentsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-36 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-muted"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
