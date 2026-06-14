import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";  // ← axiosInstance use karo

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axiosInstance.get(`/api/auth/verify-email/${token}`);  // ← sahi path
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