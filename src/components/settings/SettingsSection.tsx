export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 mb-4 text-sm text-text-secondary">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}
