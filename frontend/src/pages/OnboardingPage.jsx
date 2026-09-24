import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  ShuffleIcon,
  UserIcon,
  GraduationCapIcon,
  IdCardIcon,
  CodeIcon,
  BriefcaseBusinessIcon,
  UsersIcon,
} from "lucide-react";
import { getApiErrorMessage } from "../lib/utils";

// ==========================================
// COURSES
// ==========================================

const COURSES = [
  "B.Tech",
  "MCA",
  "BCA",
  "BBA",
  "MBA",
  "B.Com",
  "M.Tech",
  "M.Sc",
  "B.Sc",
  "Other",
];

// ==========================================
// BRANCHES
// ==========================================

const BRANCHES = [
  "Computer Science and Engineering",
  "Information Technology",
  "Artificial Intelligence",
  "Artificial Intelligence and Machine Learning",
  "Data Science",
  "Cyber Security",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];

// ==========================================
// YEARS
// ==========================================

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

// ==========================================
// SEMESTERS
// ==========================================

const SEMESTERS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
];

// ==========================================
// SKILLS
// ==========================================

const SKILLS = [
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
  "SQL",
  "Data Science",
  "AI/ML",
  "Cybersecurity",
  "Cloud",
  "UI/UX",
];

// ==========================================
// LOOKING FOR
// ==========================================

const LOOKING_FOR_OPTIONS = [
  "Hackathon Team",
  "Internship",
  "Project Partner",
  "Study Partner",
  "Startup Team",
  "Freelancing",
  "Networking",
  "Mentor",
];

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    registrationId: authUser?.registrationId || "",
    course: authUser?.course || "",
    branch: authUser?.branch || "",
    year: authUser?.year || "",
    semester: authUser?.semester || "",

    skills: Array.isArray(authUser?.skills)
      ? authUser.skills
      : [],

    lookingFor: Array.isArray(authUser?.lookingFor)
      ? authUser.lookingFor
      : [],

    bio: authUser?.bio || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  // ==========================================
  // ONBOARDING MUTATION
  // ==========================================

  const {
    mutate: onboardingMutation,
    isPending,
  } = useMutation({
    mutationFn: completeOnboarding,

    onSuccess: () => {
      toast.success(
        "LPU profile completed successfully!"
      );

      queryClient.invalidateQueries({
        queryKey: ["authUser"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  // ==========================================
  // HANDLE FIELD CHANGE
  // ==========================================

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ==========================================
  // SKILLS
  // ==========================================

  const handleSkillChange = (skill) => {
    setFormState((current) => {
      const alreadySelected =
        current.skills.includes(skill);

      return {
        ...current,

        skills: alreadySelected
          ? current.skills.filter(
              (item) => item !== skill
            )
          : [...current.skills, skill],
      };
    });
  };

  // ==========================================
  // LOOKING FOR
  // ==========================================

  const handleLookingForChange = (option) => {
    setFormState((current) => {
      const alreadySelected =
        current.lookingFor.includes(option);

      return {
        ...current,

        lookingFor: alreadySelected
          ? current.lookingFor.filter(
              (item) => item !== option
            )
          : [...current.lookingFor, option],
      };
    });
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    // Full Name
    if (!formState.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    // Registration ID
    if (!formState.registrationId.trim()) {
      toast.error(
        "Please enter your Registration ID"
      );
      return;
    }

    // Course
    if (!formState.course) {
      toast.error("Please select your course");
      return;
    }

    // Branch
    if (!formState.branch) {
      toast.error("Please select your branch");
      return;
    }

    // Year
    if (!formState.year) {
      toast.error("Please select your year");
      return;
    }

    // Semester
    if (!formState.semester) {
      toast.error("Please select your semester");
      return;
    }

    // Skills
    if (
      !Array.isArray(formState.skills) ||
      formState.skills.length === 0
    ) {
      toast.error(
        "Please select at least one skill"
      );
      return;
    }

    // Looking For
    if (
      !Array.isArray(formState.lookingFor) ||
      formState.lookingFor.length === 0
    ) {
      toast.error(
        "Please select what you are looking for"
      );
      return;
    }

    // Debug - remove later
    console.log(
      "ONBOARDING DATA:",
      formState
    );

    onboardingMutation(formState);
  };

  // ==========================================
  // RANDOM AVATAR
  // ==========================================

  const handleRandomAvatar = () => {
    const idx =
      Math.floor(Math.random() * 1000) + 1;

    const randomAvatar =
      `https://api.dicebear.com/10.x/toon-head/svg?seed=${idx}`;

    setFormState((current) => ({
      ...current,
      profilePic: randomAvatar,
    }));

    toast.success(
      "Random profile picture generated!"
    );
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-4xl shadow-xl">
        <div className="card-body p-6 sm:p-8">

          {/* ==========================================
              HEADER
          ========================================== */}

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Complete Your LPU Profile
            </h1>

            <p className="text-base-content/70 mt-2">
              Build your student profile and connect
              with the right people
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ==========================================
                PROFILE PICTURE
            ========================================== */}

            <div className="flex flex-col items-center justify-center space-y-4">

              <div className="avatar">
                <div className="size-32 rounded-full bg-base-300 overflow-hidden">

                  {formState.profilePic ? (
                    <img
                      src={formState.profilePic}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <CameraIcon className="size-12 opacity-40" />
                    </div>
                  )}

                </div>
              </div>

              <button
                type="button"
                onClick={handleRandomAvatar}
                className="btn btn-outline"
              >
                <ShuffleIcon className="size-4" />
                Generate Avatar
              </button>

            </div>

            {/* ==========================================
                BASIC INFORMATION
            ========================================== */}

            <div className="divider">
              <UserIcon className="size-4" />
              Basic Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* FULL NAME */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Full Name *
                  </span>
                </label>

                <label className="input input-bordered flex items-center gap-2">

                  <UserIcon className="size-5 opacity-60" />

                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={(e) =>
                      handleChange(
                        "fullName",
                        e.target.value
                      )
                    }
                    placeholder="Your full name"
                    className="grow"
                    required
                  />

                </label>

              </div>

              {/* REGISTRATION ID */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Registration ID *
                  </span>
                </label>

                <label className="input input-bordered flex items-center gap-2">

                  <IdCardIcon className="size-5 opacity-60" />

                  <input
                    type="text"
                    value={formState.registrationId}
                    onChange={(e) =>
                      handleChange(
                        "registrationId",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Your Registration ID"
                    className="grow"
                    required
                  />

                </label>

              </div>

            </div>

            {/* ==========================================
                ACADEMIC INFORMATION
            ========================================== */}

            <div className="divider">
              <GraduationCapIcon className="size-4" />
              Academic Information
            </div>

            {/* COURSE + BRANCH */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* COURSE */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Course / Program *
                  </span>
                </label>

                <select
                  className="select select-bordered w-full"
                  value={formState.course}
                  onChange={(e) =>
                    handleChange(
                      "course",
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select your course
                  </option>

                  {COURSES.map((course) => (
                    <option
                      key={course}
                      value={course}
                    >
                      {course}
                    </option>
                  ))}

                </select>

              </div>

              {/* BRANCH */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Branch *
                  </span>
                </label>

                <select
                  className="select select-bordered w-full"
                  value={formState.branch}
                  onChange={(e) =>
                    handleChange(
                      "branch",
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select your branch
                  </option>

                  {BRANCHES.map((branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* YEAR + SEMESTER */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* YEAR */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Year *
                  </span>
                </label>

                <select
                  className="select select-bordered w-full"
                  value={formState.year}
                  onChange={(e) =>
                    handleChange(
                      "year",
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select year
                  </option>

                  {YEARS.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}

                </select>

              </div>

              {/* SEMESTER */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Semester *
                  </span>
                </label>

                <select
                  className="select select-bordered w-full"
                  value={formState.semester}
                  onChange={(e) =>
                    handleChange(
                      "semester",
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select semester
                  </option>

                  {SEMESTERS.map((semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      Semester {semester}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* ==========================================
                SKILLS
            ========================================== */}

            <div className="divider">
              <CodeIcon className="size-4" />
              Skills
            </div>

            <div className="form-control">

              <label className="label">
                <span className="label-text font-medium">
                  What are you good at? *
                </span>
              </label>

              <p className="text-sm text-base-content/60 mb-3">
                Select all the skills you have.
              </p>

              <div className="flex flex-wrap gap-2">

                {SKILLS.map((skill) => {

                  const selected =
                    formState.skills.includes(skill);

                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() =>
                        handleSkillChange(skill)
                      }
                      className={`badge badge-lg cursor-pointer py-4 px-4 ${
                        selected
                          ? "badge-primary"
                          : "badge-outline"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}

              </div>

              {formState.skills.length > 0 && (
                <p className="text-sm text-primary mt-3">
                  {formState.skills.length} skill
                  {formState.skills.length > 1
                    ? "s"
                    : ""}{" "}
                  selected
                </p>
              )}

            </div>

            {/* ==========================================
                LOOKING FOR
            ========================================== */}

            <div className="divider">
              <BriefcaseBusinessIcon className="size-4" />
              What Are You Looking For?
            </div>

            <div className="form-control">

              <label className="label">
                <span className="label-text font-medium">
                  I am looking for... *
                </span>
              </label>

              <p className="text-sm text-base-content/60 mb-3">
                Select what you want to find on Connectly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {LOOKING_FOR_OPTIONS.map((option) => {

                  const selected =
                    formState.lookingFor.includes(
                      option
                    );

                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() =>
                        handleLookingForChange(
                          option
                        )
                      }
                      className={`btn justify-start ${
                        selected
                          ? "btn-primary"
                          : "btn-outline"
                      }`}
                    >
                      <UsersIcon className="size-4" />
                      {option}
                    </button>
                  );
                })}

              </div>

              {formState.lookingFor.length > 0 && (
                <p className="text-sm text-primary mt-3">
                  {formState.lookingFor.length} option
                  {formState.lookingFor.length > 1
                    ? "s"
                    : ""}{" "}
                  selected
                </p>
              )}

            </div>

            {/* ==========================================
                BIO
            ========================================== */}

            <div className="form-control">

              <label className="label">
                <span className="label-text font-medium">
                  About You
                </span>
              </label>

              <textarea
                className="textarea textarea-bordered h-28"
                value={formState.bio}
                onChange={(e) =>
                  handleChange(
                    "bio",
                    e.target.value
                  )
                }
                placeholder="Tell other LPU students about yourself, your interests, goals, projects..."
              />

            </div>

            {/* ==========================================
                LOCATION
            ========================================== */}

            <div className="form-control">

              <label className="label">
                <span className="label-text font-medium">
                  Location
                </span>
              </label>

              <label className="input input-bordered flex items-center gap-2">

                <MapPinIcon className="size-5 opacity-60" />

                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) =>
                    handleChange(
                      "location",
                      e.target.value
                    )
                  }
                  placeholder="e.g. LPU, Phagwara"
                  className="grow"
                />

              </label>

            </div>

            {/* ==========================================
                SUBMIT
            ========================================== */}

            <button
              className="btn btn-primary w-full"
              disabled={isPending}
              type="submit"
            >

              {isPending ? (
                <>
                  <LoaderIcon className="animate-spin size-5" />
                  Creating Your Profile...
                </>
              ) : (
                <>
                  <GraduationCapIcon className="size-5" />
                  Complete LPU Profile
                </>
              )}

            </button>

          </form>

        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;