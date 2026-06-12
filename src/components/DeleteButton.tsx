import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => void | Promise<void>;
  isPending?: boolean;
  label?: string;
  confirmMessage?: string;
  ariaLabel?: string;
}

export const DeleteButton = ({
  onDelete,
  isPending = false,
  label = "Delete",
  confirmMessage = "Are you sure?",
  ariaLabel = "Delete",
}: DeleteButtonProps) => {
  const handleClick = async () => {
    if (confirm(confirmMessage)) {
      await onDelete();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={ariaLabel}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "Deleting..." : label}
    </button>
  );
};
