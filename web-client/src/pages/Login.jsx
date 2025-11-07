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
    <div className="flex h-screen">
      <div className="w-1/2 relative hidden lg:flex items-center justify-center">
        <img
          src="assets/hero-login.png"
          alt="TaskFlow Promo Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 px-12 text-left max-w-xl text-[#111827]">
          <div className="flex items-center gap-2 mb-10">
            <img
              src="assets/taskflow_icon.svg"
              alt="icon"
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold">TaskFlow</h1>
          </div>

          <h2 className="text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
            Керуйте проєктами легко
          </h2>
          <p className="text-lg text-[#1f2937] drop-shadow-md font-medium">
            Повноцінна система управління з командами, завданнями та реальним
            часом. Все, що потрібно для продуктивності.
          </p>
        </div>

        <div className="absolute inset-0 bg-white opacity-10"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#1f2937]">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg z-20">
          <div className="flex items-center justify-center mb-6">
            <img src="assets/logo.svg" alt="logo" className="w-28" />
          </div>
          <h2 className="text-2xl font-semibold text-center text-very-dark-blue mb-4">
            Увійти до TaskFlow
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              {...register("email")}
              placeholder="Email"
              type="email"
              className="border border-grayish-blue p-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-orange"
              required
            />
            <input
              {...register("password")}
              placeholder="Пароль"
              type="password"
              className="border border-grayish-blue p-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-orange"
              required
            />
            <button
              type="submit"
              className="w-full bg-orange text-white py-3 rounded hover:bg-orange/90 transition-colors cursor-pointer"
            >
              Увійти
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-dark-grayish-blue">
            Ще немає акаунту?{" "}
            <Link
              to="/register"
              className="text-orange font-medium hover:underline"
            >
              Створити
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
