import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
} from "react";
import { ChevronDown, Plus, Check } from "lucide-react";

interface SearchableDropdownProps<T> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  items: T[];
  selectedItem?: T;
  onItemSelect: (item: T) => void;
  getItemId: (item: T) => string | number;
  getItemLabel: (item: T) => string;
  className?: string;
  disabled?: boolean;
  mode?: "single" | "multi";
  selectedItems?: T[];
  renderSelectedItem?: (item: T, onRemove: () => void) => React.ReactNode;
}

export interface SearchableDropdownRef {
  openAndFocus: () => void;
}

export const SearchableDropdown = <T,>(
  props: SearchableDropdownProps<T> & { ref?: React.Ref<SearchableDropdownRef> }
) => {
  const {
    label,
    placeholder = "Select item...",
    searchPlaceholder = "Search items...",
    items,
    selectedItem,
    selectedItems = [],
    onItemSelect,
    getItemId,
    getItemLabel,
    renderSelectedItem,
    className = "",
    disabled = false,
    mode = "single",
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Expose methods to parent component
  useImperativeHandle(props.ref, () => ({
    openAndFocus: () => {
      setIsOpen(true);
      // Focus will happen automatically due to the useEffect below
    },
  }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    const matchesSearch = getItemLabel(item)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (mode === "single") {
      return matchesSearch;
    } else {
      // Multi-select: exclude already selected items
      const notAlreadySelected = !selectedItems.some(
        (selected) => getItemId(selected) === getItemId(item)
      );
      return matchesSearch && notAlreadySelected;
    }
  });

  const handleItemSelect = (item: T) => {
    onItemSelect(item);
    setSearchTerm("");
    setIsOpen(false);
  };

  // For single select, determine what to show in the trigger
  const getDisplayValue = () => {
    if (mode === "single" && selectedItem) {
      return getItemLabel(selectedItem);
    }
    return placeholder;
  };

  const isSelected = (item: T) => {
    if (mode === "single") {
      return selectedItem && getItemId(selectedItem) === getItemId(item);
    } else {
      return selectedItems.some(
        (selected) => getItemId(selected) === getItemId(item)
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative" ref={dropdownRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}

        {/* Multi-select: Selected items display */}
        {mode === "multi" && renderSelectedItem && selectedItems.length > 0 && (
          <div className="space-y-2 mb-2">
            {selectedItems.map((item) =>
              renderSelectedItem(item, () => {
                // Handle removal would need to be passed in if needed
              })
            )}
          </div>
        )}

        {/* Dropdown trigger button or search input */}
        {!isOpen ? (
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className={`text-sm ${
                selectedItem ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {getDisplayValue()}
            </span>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </button>
        ) : (
          <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm focus:outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded focus:outline-none"
            >
              <ChevronDown className="h-5 w-5 text-gray-400 transform rotate-180" />
            </button>
          </div>
        )}

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={getItemId(item)}
                  type="button"
                  onClick={() => handleItemSelect(item)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center transition-colors ${
                    isSelected(item) ? "bg-blue-50" : ""
                  }`}
                >
                  {mode === "single" ? (
                    <Check
                      className={`h-4 w-4 mr-2 flex-shrink-0 ${
                        isSelected(item) ? "text-blue-500" : "text-transparent"
                      }`}
                    />
                  ) : (
                    <Plus className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  )}
                  <span className="truncate">{getItemLabel(item)}</span>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  {searchTerm ? "No items found" : "No available items"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

SearchableDropdown.displayName = "SearchableDropdown";
