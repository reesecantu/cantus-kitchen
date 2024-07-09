import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth";

interface FormData {
  email: string;
  password: string;
}

function Login() {
  let navigate = useNavigate();
  const { loginUser } = useAuth();
  const { state } = useLocation();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    loginUser(formData.email, formData.password);
    navigate(state?.path || "/");
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input placeholder="Email" name="email" onChange={handleChange} />

        <input
          placeholder="Password"
          name="password"
          type="password"
          onChange={handleChange}
        />

        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export default Login;
