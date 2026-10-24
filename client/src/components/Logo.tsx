export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-accent" />
        <path
          d="M9 20.5c1.4 1.6 3.6 2.5 6.4 2.5 3.6 0 5.9-1.7 5.9-4.3 0-2.4-1.7-3.5-5.4-4.2-2.6-.5-3.4-1-3.4-1.9 0-1 1-1.6 2.6-1.6 1.6 0 2.9.6 3.8 1.6l2-2.2C19.6 8.9 17.7 8 15.2 8c-3.4 0-5.8 1.8-5.8 4.4 0 2.4 1.7 3.6 5.3 4.2 2.7.5 3.5 1 3.5 1.9 0 1.1-1.1 1.7-2.8 1.7-1.9 0-3.4-.7-4.4-1.9Z"
          className="fill-accent-ink"
        />
      </svg>
      SubTrack
    </span>
  );
}
