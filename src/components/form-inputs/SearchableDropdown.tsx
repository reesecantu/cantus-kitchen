interface SearchableDropdownProps<T> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  items: T[];
  selectedItems?: T[];
  onItemSelect: (item: T) => void;
  getItemId: (item: T) => string | number;
  getItemLabel: (item: T) => string;
  renderSelectedItem?: (item: T, onRemove: () => void) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SearchableDropdown = () => {
  return <div></div>;
};
