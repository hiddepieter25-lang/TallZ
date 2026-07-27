export default async function AccountDeleted({
  searchParams,
}: {
  searchParams: Promise<{ partial?: string }>;
}) {
  const { partial } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 text-center sm:px-0">
      <h1 className="mb-3 text-2xl font-semibold tracking-tight">Your data has been deleted</h1>
      <p className="text-sm text-muted">
        {partial
          ? "Your quiz answers, photo reference, and click history are gone, and you've been logged out. Your login itself is being fully removed shortly — contact us if you'd like this expedited."
          : "Your account and all associated data have been removed."}
      </p>
    </div>
  );
}
