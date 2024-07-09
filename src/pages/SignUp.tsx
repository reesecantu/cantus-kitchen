import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth";

interface FormData {
  email: string;
  password: string;
}

function SignUp() {
  let navigate = useNavigate();
  const { registerUser } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    registerUser(formData.email, formData.password);
    navigate("/");
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
        <input
          placeholder="Email"
          name="email"
          type="email"
          onChange={handleChange}
        />

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

export default SignUp;
