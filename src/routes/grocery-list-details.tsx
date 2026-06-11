import { GroceryListDetailsPage } from "@/features/grocery-lists/pages/GroceryListDetailsPage";

export function meta() {
  return [{ title: "Grocery List | Cantu's Kitchen" }];
}

export default function GroceryListDetailsRoute() {
  return <GroceryListDetailsPage />;
}
