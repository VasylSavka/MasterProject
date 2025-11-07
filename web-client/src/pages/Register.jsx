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
      alert("Помилка реєстрації: " + err.message);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="relative h-screen w-screen flex items-center justify-center">
      <img
        src="assets/hero-login.png"
        alt="Hero Background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black opacity-10" />

      <div className="relative z-10 max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <img src="assets/logo.svg" alt="TaskFlow Logo" className="w-28" />
        </div>

        <h2 className="text-2xl font-semibold text-center text-very-dark-blue mb-4">
          Створити акаунт
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register("name")}
            placeholder="Ім’я"
            className="border border-grayish-blue p-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-orange"
            required
          />
          <input
            {...register("email")}
            placeholder="Електронна пошта"
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
            Зареєструватись
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-dark-grayish-blue">
          Вже маєте акаунт?{" "}
          <Link to="/login" className="text-orange font-medium hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
