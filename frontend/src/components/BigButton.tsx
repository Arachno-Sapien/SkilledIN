import React from "react";

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "verified" | "warning" | "outline" | "danger";
  icon?: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
}

export const BigButton: React.FC<BigButtonProps> = ({
  children,
  variant = "primary",
  icon,
  subtitle,
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "w-full min-h-[56px] py-3.5 px-5 rounded-2xl font-bold flex items-center justify-center transition-all duration-150 select-none shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variantClasses = {
    primary:
      "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 shadow-md",
    verified:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md",
    warning:
      "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-md",
    outline:
      "bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 shadow-md",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span className="text-base">{children}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-3 text-left">
          {icon && <span className="flex-shrink-0 text-xl">{icon}</span>}
          <div>
            <div className="text-base font-bold leading-tight">{children}</div>
            {subtitle && (
              <div className="text-xs font-normal opacity-90 leading-snug mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
};
