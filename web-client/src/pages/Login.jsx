import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      alert("Login error: " + err.message);
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
        <h2 className="text-2xl font-semibold mb-4 text-center">Sign In</h2>
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
          Sign In
        </button>
        <p className="text-center mt-3 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}

