import { useEffect, useState } from "react";
import { signupUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  
  useEffect(() =>{
     const token = localStorage.getItem("token");
     if(token){
        navigate("/")
     };
  },[]);

  const handleSignup = async (e) => {
    e.preventDefault();

    // clear previous error
    setError("");

    // ================= VALIDATIONS =================

    if (!name || !email || !password) {
      return setError("Name, Email and Password are required");
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return setError("Name should contain only letters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Invalid email format");
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return setError(
        "Password must be at least 8 characters, include uppercase, number & special character"
      );
    }

    if (password !== confirmPassword) {
      return setError("Password and Confirm Password must match");
    }

    if (phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return setError(
          "Phone must be 10 digits and start with 6-9"
        );
      }
    }
    
    try {
    const res = await signupUser({ name, email, password, phone });

    // store token
    localStorage.setItem("token", res.data.accessToken);
    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    // redirect
    navigate("/");

    } catch (err) {
    setError(err.message);
    }
    // ================= API CALL (next step) =================
    console.log({ name, email, password, phone });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-slate-50 px-4">

      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">Get started with TaskFlow in minutes.</p>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mb-4 text-red-500 text-sm">{error}</p>
        )}

        <input
          type="text"
          placeholder="Name"
          className="w-full mb-4 p-3 border rounded-lg"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Phone Number (optional)"
          className="w-full mb-4 p-3 border rounded-lg"
          onChange={(e) => setPhone(e.target.value)}
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

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm Password"
          className="w-full mb-6 p-3 border rounded-lg"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
          Signup
        </button>

        <p className="mt-5 text-sm text-gray-600 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-700 hover:text-indigo-800 font-medium">
            Log in
          </Link>
        </p>
      </form>

    </div>
  );
}