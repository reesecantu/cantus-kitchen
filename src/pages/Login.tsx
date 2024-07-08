import { useState } from "react";
import supabase from "../../supabase/supabase-client";
import { useNavigate } from "react-router-dom";

interface FormData {
  email: string;
  password: string;
}

interface LoginProps {
  setToken: (data: any) => void;
}

function Login({ setToken }: LoginProps) {
  let navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      console.log(data);
      navigate("/");
      setToken(data.session);
    //   console.log("data session: ", data.session); // debugging
    //   console.log("data as a whole: ", data);
    } catch (error) {
      alert(error);
    }
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
