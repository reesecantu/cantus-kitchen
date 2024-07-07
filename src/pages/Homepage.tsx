import { useNavigate } from "react-router-dom";

function Homepage() {
    const navigate = useNavigate();
  return (
    <>
      <h1>Welcome to the Homepage!</h1>
      <button onClick={() => navigate("/login")}>Login here</button>
    </>
  )
}

export default Homepage;
