import { useState , useEffect} from "react";
import { loginUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() =>{
    const token = localStorage.getItem("token");
    if(token){
       navigate("/");
    };
  },[]);

  const handleLogin = async (e) => {
  e.preventDefault();

  setError("");

  try {
    if (!email || !password) {
      return setError("Email and Password are required");
    }

    const res = await loginUser({ email, password });

    localStorage.setItem("token", res.data.accessToken);
    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    navigate("/");

  } catch (err) {
    setError(err.message);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-slate-50 px-4">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">Log in to continue to TaskFlow.</p>
        </div>
        
        {error && (
        <p className="mb-4 text-red-500 text-sm">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-3 border rounded-lg pr-20"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
          Login
        </button>

        <p className="mt-5 text-sm text-gray-600 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-indigo-700 hover:text-indigo-800 font-medium">
            Sign up
          </Link>
        </p>
      </form>

    </div>
  );
};

export default Login;  