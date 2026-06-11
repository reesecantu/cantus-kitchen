import { CreatePage } from "@/features/recipes/pages/CreatePage";

export function meta() {
  return [{ title: "Create Recipe | Cantu's Kitchen" }];
}

export default function CreateRoute() {
  return <CreatePage />;
}
