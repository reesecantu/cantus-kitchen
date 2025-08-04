import { CreateRecipe } from "../components/CreateRecipe";
import { useAuth } from "../contexts/AuthContext"

export const CreatePage = () => {
    const {user} = useAuth();
    return(
        <div >
            {user ? <CreateRecipe /> : <p className="pt-25 text-center text-lg text-gray-900">Sign in to create your own recipes!</p>}
        </div>
    );
}