export const GROCERY_LIST_QUERY_KEYS = {
  groceryLists: ["grocery-lists"] as const,
  groceryList: (id: string) => ["grocery-list", id] as const,
};
