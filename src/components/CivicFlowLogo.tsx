type CivicFlowLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showSubtext?: boolean;
  showText?: boolean;
  compact?: boolean;
  inverted?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const sizeStyles = {
  sm: {
    mark: "h-9 w-9 rounded-[10px]",
    wordmark: "text-base",
    subtext: "text-[0.66rem]",
  },
  md: {
    mark: "h-11 w-11 rounded-xl",
    wordmark: "text-lg",
    subtext: "text-xs",
  },
  lg: {
    mark: "h-14 w-14 rounded-2xl",
    wordmark: "text-2xl",
    subtext: "text-sm",
  },
};

export default function CivicFlowLogo({
  className = "",
  markClassName = "",
  textClassName = "",
  showSubtext = true,
  showText = true,
  compact = false,
  inverted = false,
  size = "md",
}: CivicFlowLogoProps) {
  const styles = sizeStyles[size];
  const shouldShowText = showText && !compact;

  return (
    <div
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="CivicFlow by Westforge"
    >
      <div
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-md shadow-slate-950/20 ring-1 ring-white/10 ${styles.mark} ${markClassName}`}
      >
        <svg
          viewBox="0 0 64 64"
          role="img"
          aria-hidden="true"
          className="h-[78%] w-[78%]"
        >
          <path
            d="M45.5 12H24.5C16.5 12 11 17.5 11 25.5V38.5C11 46.5 16.5 52 24.5 52H45.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="7"
          />
          <path
            d="M18 24C24 24 24 18.5 31.5 18.5H40"
            fill="none"
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <path
            d="M18 32H45"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <path
            d="M18 40C24 40 24 45.5 31.5 45.5H40"
            fill="none"
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <circle cx="43" cy="18.5" r="4.5" fill="#2563eb" />
          <circle cx="48" cy="32" r="4.5" fill="currentColor" />
          <circle cx="43" cy="45.5" r="4.5" fill="#2563eb" />
        </svg>
      </div>

      {shouldShowText ? (
        <div className={`leading-none ${textClassName}`}>
          <p
            className={`font-bold tracking-tight ${
              inverted ? "text-white" : "text-slate-900"
            } ${styles.wordmark}`}
          >
            CivicFlow
          </p>

          {showSubtext ? (
            <p
              className={`mt-1.5 font-semibold uppercase tracking-[0.14em] ${
                inverted ? "text-blue-200/80" : "text-slate-400"
              } ${styles.subtext}`}
            >
              by Westforge
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}