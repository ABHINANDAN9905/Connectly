import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`
        );
        setMessage("Email verified successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        setMessage("Verification link is invalid or expired.");
      }
    };
    verifyEmail();
  }, [token, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h2 className="text-xl font-semibold">{message}</h2>
    </div>
  );
};

export default VerifyEmailPage;