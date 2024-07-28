import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth";
import { jwtDecode } from "jwt-decode";

function Homepage() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  return (
    <>
      <h1>Hello Friends!</h1>
      <h2>Homepage Under Construction</h2>
      <p>
        I've got quite a laundry list of features I want to add. The big ticket
        item is a grocery list generator for the recipes you soon will see here.
        In the meantime, here is a heart for you for checking out the pages: ❤️
      </p>
      {session && (
        <button onClick={() => console.log(jwtDecode(session.access_token))}>
          decode access token
        </button>
      )}
      {!user && <button onClick={() => navigate("/login")}>Login here</button>}
    </>
  );
}

export default Homepage;
