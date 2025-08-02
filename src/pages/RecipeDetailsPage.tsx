import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

export const RecipeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  //   not super necessary because /recipes already exists and id: string will accept anything
  useEffect(() => {
    if (!id) {
      navigate("/recipes");
    }
  }, [id, navigate]);

  if (!id) return null;

  return (
    <div className="pt-10 md:pt-20 ml-20">
      Recipe details for recipe id #{id}.
    </div>
  );
};
