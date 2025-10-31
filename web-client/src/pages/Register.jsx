import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const { register: registerUser, user, loading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      await registerUser(data.email, data.password, data.name);
      navigate("/dashboard");
    } catch (err) {
      alert("Registration error: " + err.message);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-lg shadow-md w-80"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Create account</h2>
        <input
          {...register("name")}
          placeholder="Name"
          className="border p-2 w-full mb-3"
          required
        />
        <input
          {...register("email")}
          placeholder="Email"
          type="email"
          className="border p-2 w-full mb-3"
          required
        />
        <input
          {...register("password")}
          placeholder="Password"
          type="password"
          className="border p-2 w-full mb-3"
          required
        />
        <button className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600">
          Sign Up
        </button>
        <p className="text-center mt-3 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}

