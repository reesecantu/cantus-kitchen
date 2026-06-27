interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray" | "blue" | "green" | "red";
  className?: string;
}

export const LoadingSpinner = ({
  size = "md",
  color = "primary",
  className = "",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-blue-600",
    white: "text-white",
    gray: "text-gray-600",
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
  };

  const spinnerClasses = [
    "animate-spin rounded-full border-2 border-current border-t-transparent",
    sizeClasses[size],
    colorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={spinnerClasses} />;
};
