import { RefreshCcw, Loader2 } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "cancel"
  | "tertiary"
  | "refresh";
type ButtonSize = "small" | "medium" | "large" | "sm";

type Props = {
  children?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  fullWidth?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
};

const CustomButton = ({
  children,
  startIcon,
  endIcon,
  className = "",
  onClick,
  type = "button",
  loading,
  disabled,
  size = "medium",
  fullWidth = true,
  loadingText = "Loading...",
  variant = "primary",
}: Props) => {
  // Variant styles using Tailwind classes with custom colors from logo
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-primary-500 text-white border-none shadow-[0_5px_10px_rgba(0,0,0,0.2)] hover:bg-primary-600 hover:shadow-[0_8px_15px_rgba(0,0,0,0.3)] disabled:bg-neutral-600 disabled:opacity-70 disabled:shadow-none",
    secondary:
      "bg-transparent text-secondary-600 border border-secondary-600 shadow-none hover:bg-secondary-50 hover:border-secondary-700 hover:border-[1.5px] disabled:opacity-50 disabled:shadow-none",
    cancel:
      "bg-transparent text-error-600 border-[1.5px] border-error-300 shadow-none hover:bg-error-50 disabled:opacity-50 disabled:shadow-none",
    tertiary:
      "bg-transparent text-tertiary-300 border-[1.5px] border-tertiary-300 shadow-none hover:bg-tertiary-50 disabled:opacity-50 disabled:shadow-none",
    refresh:
      "bg-transparent text-primary-600 border border-primary-600 shadow-none rounded-2xl hover:bg-primary-50 disabled:opacity-50 disabled:shadow-none",
  };

  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    sm: "text-[0.7rem] px-3 py-1.5",
    small: "text-xs px-3 py-1.5",
    medium: "text-sm px-3 py-1.5",
    large: "text-base px-4 py-2",
  };

  // Determine the start icon
  const getStartIcon = () => {
    if (loading) {
      if (variant === "refresh") {
        return <RefreshCcw size={16} className="animate-spin" />;
      }
      return undefined;
    }
    if (variant === "refresh" && !startIcon) {
      return <RefreshCcw size={16} />;
    }
    return startIcon;
  };

  const isDisabled = disabled || loading;
  const widthClass = fullWidth ? "w-full" : "w-fit";

  return (
    <button
      className={` ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className} flex items-center justify-center gap-2 rounded-[0.3rem] font-medium tracking-widest capitalize transition-all duration-300 ease-in-out ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} `}
      onClick={onClick}
      type={type}
      disabled={isDisabled}
    >
      {getStartIcon()}
      {loading && variant !== "refresh" ? (
        <span className="flex items-center gap-2">
          <Loader2 size={20} className="animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
      {loading && variant !== "refresh" ? null : endIcon}
    </button>
  );
};

export default CustomButton;
