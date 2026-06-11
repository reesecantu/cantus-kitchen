import { GroceryListsPage } from "@/features/grocery-lists/pages/GroceryListsPage";

export function meta() {
  return [{ title: "Grocery Lists | Cantu's Kitchen" }];
}

export default function GroceryListsRoute() {
  return <GroceryListsPage />;
}
