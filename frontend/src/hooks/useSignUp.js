import { useMutation } from "@tanstack/react-query";
import { signup } from "../lib/api";
import toast from "react-hot-toast";
import { useState } from "react";

const useSignUp = () => {
  const [successMessage, setSuccessMessage] = useState(null);

  const { mutate, isPending, error } = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      toast.success(data.message || "Registration successful! Please check your email.");
    },
  });

  return { isPending, error, signupMutation: mutate, successMessage };
};

export default useSignUp;