import { Search } from "lucide-react";
import { COLORS } from "../../utils/constants";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) => {
  return (
    <div className={`flex flex-row my-2 items-center w-full max-w-3xl rounded-full border-2 ${COLORS.BORDER_PRIMARY} ${className}`}>
      {/* Search Icon */}
      <div className="p-1.5">
        <Search className={`w-4 h-4 md:w-5 md:h-5 ${COLORS.TEXT_SECONDARY}`}/>
      </div>
      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pr-10 md:py-1.5 py-1 outline-none text-${COLORS.TEXT_PRIMARY}`}
      />
    </div>
  );
};
