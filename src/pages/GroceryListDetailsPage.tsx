import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { GroceryListDetails } from "../components/GroceryListDetails";

export const GroceryListDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();


  useEffect(() => {
    if (!id) {
      navigate("/grocery-lists");
    }
  }, [id, navigate]);

  if (!id) return null;

  return (
    <GroceryListDetails listId={id} />
  );
};
