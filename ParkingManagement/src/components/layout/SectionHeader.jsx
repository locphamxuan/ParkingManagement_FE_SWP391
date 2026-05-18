export default function SectionHeader({ label, title, description }) {
  return (
    <div className="mb-6 space-y-3">
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-700">
          {label}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-amber-950 sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
