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
    <div className={`flex flex-row my-2 items-center w-full max-w-2xl rounded-full border border-${COLORS.BORDER_MEDIUM} ${className}`}>
      {/* Search Icon */}
      <div className="p-1.5">
        <Search className="w-5 h-5"/>
      </div>
      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-10 py-1.5 outline-none"
      />
    </div>
  );
};
