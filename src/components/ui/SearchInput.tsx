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
    <div className={`relative w-full ${className}`}>
      {/* Search Icon */}
      <div>
        <Search className="w-5 h-5" />
      </div>
      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-10 py-3 border border-${COLORS.BORDER_MEDIUM}`}
      />
    </div>
  );
};
