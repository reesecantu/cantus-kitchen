interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray" | "blue" | "green" | "red";
  className?: string;
  text?: string;
  center?: boolean;
}

export const LoadingSpinner = ({
  size = "md",
  color = "primary",
  className = "",
  text,
  center = false,
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

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const spinnerClasses = [
    "animate-spin rounded-full border-2 border-current border-t-transparent",
    sizeClasses[size],
    colorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const spinner = <div className={spinnerClasses} />;

  if (text) {
    const containerClasses = [
      "flex items-center gap-2",
      center && "justify-center",
      colorClasses[color],
    ]
      .filter(Boolean)
      .join(" ");

    const textClasses = ["font-medium", textSizeClasses[size]].join(" ");

    return (
      <div className={containerClasses}>
        {spinner}
        <span className={textClasses}>{text}</span>
      </div>
    );
  }

  if (center) {
    return <div className="flex justify-center items-center">{spinner}</div>;
  }

  return spinner;
};
