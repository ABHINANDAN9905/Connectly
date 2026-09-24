import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  GraduationCap,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router";
import { FcGoogle } from "react-icons/fc";
import useSignUp from "../hooks/useSignUp";
import AnimatedAuthBackground from "../components/AnimatedAuthBackground";
const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const {
    signupMutation,
    isPending,
    error,
    successMessage,
  } = useSignUp();
  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };
  return (
    <div className="min-h-screen w-full bg-white flex">
      {/* =====================================================
          LEFT SIDE - LPU CAMPUS
      ===================================================== */}
      <div
        className="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: "url('/lpu-campus.png')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />

        {/* Left content */}
        <div className="relative z-10 w-full min-h-screen p-8 xl:p-12 flex flex-col">

          {/* ================= TOP HEADER ================= */}
          <div className="flex justify-between items-start">

            {/* LPU LOGO */}
            <div className="flex items-center gap-5">

              <div className="w-[78px] h-[78px] rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/lpu-logo.png"
                  alt="Lovely Professional University"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="border-r border-white/70 pr-7">

                <h1 className="text-white text-lg xl:text-xl font-bold leading-tight">
                  LOVELY
                  <br />
                  PROFESSIONAL
                  <br />
                  UNIVERSITY
                </h1>

                <p className="text-white/90 text-[11px] italic mt-2 whitespace-nowrap">
                  Transforming Education Transforming India
                </p>

              </div>

            </div>


            {/* TOP RIGHT TEXT */}
            <div className="border-l border-white/80 pl-4 text-white text-sm leading-7">
              <p>Learn</p>
              <p>Connect</p>
              <p>Collaborate</p>
              <p>Grow</p>
            </div>

          </div>


          {/* ================= HERO ================= */}
          <div className="mt-16 xl:mt-20 max-w-2xl">

            {/* Orange handwritten style text */}
            <p className="text-orange-400 text-2xl xl:text-3xl italic font-semibold leading-tight mb-8">
              Same Campus.
              <br />
              Bigger Connections.
            </p>


            {/* Main heading */}
            <h2 className="text-white text-4xl xl:text-6xl font-extrabold leading-[1.05]">

              Meet beyond
              <br />

              <span className="text-orange-500">
                your classroom.
              </span>

            </h2>


            {/* Description */}
            <p className="text-white/90 text-base xl:text-lg mt-6 max-w-xl leading-relaxed">

              A community for LPU students to make new friends,
              find study partners, connect with seniors & juniors,
              and grow together.

            </p>

          </div>


          {/* ================= FEATURES ================= */}
          <div className="grid grid-cols-4 gap-2 xl:gap-3 mt-7 max-w-[560px]">

            {/* Make Friends */}
            <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-3 xl:p-4 text-center">

              <Users
                className="mx-auto text-orange-500 mb-2"
                size={32}
              />

              <p className="text-white text-xs xl:text-sm font-medium">
                Make
                <br />
                Friends
              </p>

            </div>


            {/* Study Partners */}
            <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-3 xl:p-4 text-center">

              <GraduationCap
                className="mx-auto text-orange-500 mb-2"
                size={32}
              />

              <p className="text-white text-xs xl:text-sm font-medium">
                Find
                <br />
                Study Partners
              </p>

            </div>


            {/* Knowledge */}
            <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-3 xl:p-4 text-center">

              <Lightbulb
                className="mx-auto text-orange-500 mb-2"
                size={32}
              />

              <p className="text-white text-xs xl:text-sm font-medium">
                Share
                <br />
                Knowledge
              </p>

            </div>


            {/* Conversations */}
            <div className="bg-black/35 backdrop-blur-md border border-white/10 rounded-xl p-3 xl:p-4 text-center">

              <MessageCircle
                className="mx-auto text-orange-500 mb-2"
                size={32}
              />

              <p className="text-white text-xs xl:text-sm font-medium">
                Start
                <br />
                Conversations
              </p>

            </div>

          </div>


          {/* ================= BOTTOM ================= */}
          <div className="mt-auto pb-2">

            <p className="text-white text-xl xl:text-2xl italic font-semibold leading-tight">

              “Better Students
              <br />

              &nbsp;&nbsp;&nbsp;A Brighter Tomorrow”

            </p>


            {/* Orange underline */}
            <div className="w-40 h-1 bg-orange-500 rotate-[-8deg] mt-3 ml-12" />


            {/* LPU bottom */}
            <div className="flex justify-end items-center gap-2 mt-4">

              <span className="text-white text-3xl xl:text-4xl italic">
                LPU
              </span>

              <span className="text-orange-500 text-3xl xl:text-4xl">
                ♥
              </span>

            </div>


            <p className="text-white/80 text-[9px] xl:text-[10px] tracking-[3px] text-right mt-1">
              PEOPLE&nbsp;&nbsp; | &nbsp;&nbsp;PURPOSE&nbsp;&nbsp; | &nbsp;&nbsp;POSSIBILITIES
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          RIGHT SIDE - SIGNUP
      ===================================================== */}
      <div className="relative w-full lg:w-1/2 min-h-screen bg-[#fafafa] flex items-center justify-center px-4 sm:px-6 py-8 overflow-hidden">

        {/* Animated Authentication Background */}
        <AnimatedAuthBackground />

        {/* Signup Content */}
        <div className="relative z-10 w-full max-w-2xl">

          {/* Signup Card */}
          <div className="animated-border">
            <div className="bg-white rounded-[24px] px-7 sm:px-12 lg:px-14 py-9 sm:py-10">

            {/* ================= SIGN IN ================= */}
            <div className="flex justify-end mb-8 sm:mb-10">

              <p className="text-sm text-gray-500">

                Already have an account?{" "}

                <Link
                  to="/login"
                  className="text-orange-500 font-semibold hover:text-orange-600 transition"
                >
                  Sign in
                </Link>

              </p>

            </div>


            {/* ================= HEADING ================= */}
            <div className="text-center mb-8">

              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Create an Account
              </h2>

              <p className="text-gray-500 mt-3 text-sm sm:text-base leading-6">

                Join Connectly and start connecting with new friends, study partners, and seniors & juniors from LPU
                <br className="hidden sm:block" />
                <span className="text-orange-500 font-semibold">
                  {" "}
                </span>

              </p>

            </div>


            {/* ================= ERROR ================= */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm text-red-600">

                  {error?.response?.data?.message ||
                    error?.message ||
                    "Signup failed"}

                </p>

              </div>
            )}


            {/* ================= SUCCESS ================= */}
            {successMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                <p className="text-sm text-green-600">
                  {successMessage}
                </p>

              </div>
            )}


            {/* ================= FORM ================= */}
            <form onSubmit={handleSignup}>

              {/* FULL NAME */}
              <div className="mb-5">

                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={21}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={signupData.fullName}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        fullName: e.target.value,
                      })
                    }
                    className="
                      w-full
                      h-14
                      pl-12
                      pr-4
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      text-gray-900
                      placeholder:text-gray-400
                      outline-none
                      transition
                      focus:border-orange-500
                      focus:ring-2
                      focus:ring-orange-100
                    "
                    required
                  />
                </div>
              </div>
              {/* EMAIL */}
              <div className="mb-5">

                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={21}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    placeholder="john@gmail.com"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        email: e.target.value,
                      })
                    }
                    className="
                      w-full
                      h-14
                      pl-12
                      pr-4
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      text-gray-900
                      placeholder:text-gray-400
                      outline-none
                      transition
                      focus:border-orange-500
                      focus:ring-2
                      focus:ring-orange-100
                    "
                    required
                  />

                </div>

              </div>


              {/* PASSWORD */}
              <div className="mb-2">

                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={21}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        password: e.target.value,
                      })
                    }
                    className="
                      w-full
                      h-14
                      pl-12
                      pr-12
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      text-gray-900
                      placeholder:text-gray-400
                      outline-none
                      transition
                      focus:border-orange-500
                      focus:ring-2
                      focus:ring-orange-100
                    "
                    required
                  />


                  {/* Show password */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                      hover:text-gray-600
                      transition
                    "
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 6 characters long
                </p>
              </div>
              {/* ================= CREATE ACCOUNT ================= */}
              <button
                type="submit"
                disabled={isPending}
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-gradient-to-r
                  from-orange-500
                  to-orange-600
                  hover:from-orange-600
                  hover:to-orange-700
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                  text-white
                  font-semibold
                  text-base
                  sm:text-lg
                  transition
                  shadow-md
                  shadow-orange-200
                  flex
                  items-center
                  justify-center
                "
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
              {/* ================= OR ================= */}
              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-gray-300 flex-1" />
                <span className="text-gray-500 text-sm font-medium">
                  OR
                </span>
                <div className="h-px bg-gray-300 flex-1" />
              </div>
              {/* ================= GOOGLE ================= */}
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
                }}
                className="
                  w-full
                  h-14
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  hover:bg-gray-50
                  transition
                  flex
                  items-center
                  justify-center
                  gap-3
                  font-semibold
                  text-gray-800
                "
              >
                <FcGoogle className="w-6 h-6" />
                Continue with Google
              </button>
              {/* ================= SECURITY ================= */}
              <div className="flex items-center justify-center gap-3 mt-7">
                <ShieldCheck
                  size={22}
                  className="text-gray-500"
                />
                <p className="text-sm text-gray-500">
                  Your data is safe with us
                </p>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;