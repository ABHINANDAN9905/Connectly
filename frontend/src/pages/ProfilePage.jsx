import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CameraIcon,
  LoaderIcon,
  LogOutIcon,
  MapPinIcon,
  PencilIcon,
  PowerOffIcon,
  SaveIcon,
  ShuffleIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import {
  deactivateMyAccount,
  deleteMyAccount,
  updateMyProfile,
} from "../lib/api";
import { getApiErrorMessage } from "../lib/utils";

const COURSES = [
  "B.Tech",
  "MCA",
  "BCA",
  "MBA",
  "M.Tech",
  "BBA",
  "B.Com",
  "B.Sc",
  "M.Sc",
  "Other",
];

const BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Artificial Intelligence & Machine Learning",
  "Data Science",
  "Cyber Security",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

const SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

const SKILLS = [
  "JavaScript",
  "React",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Python",
  "Java",
  "C",
  "C++",
  "Data Structures & Algorithms",
  "AI/ML",
  "Data Science",
  "Cybersecurity",
  "UI/UX",
  "Figma",
  "Cloud",
  "DevOps",
  "Git/GitHub",
  "Other",
];

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

const getProfileFormState = (user) => ({
  fullName: user?.fullName || "",
  registrationId: user?.registrationId || "",
  course: user?.course || "",
  branch: user?.branch || "",
  year: user?.year || "",
  semester: user?.semester || "",
  skills: user?.skills || [],
  lookingFor: user?.lookingFor || [],
  bio: user?.bio || "",
  location: user?.location || "",
  profilePic: user?.profilePic || "",
});

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const { logoutMutation, isPending: isLoggingOut } = useLogout();

  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [formState, setFormState] = useState(() =>
    getProfileFormState(authUser)
  );

  const refreshAuthUser = () => {
    queryClient.invalidateQueries({
      queryKey: ["authUser"],
    });
  };

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: updateMyProfile,

    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditing(false);
      refreshAuthUser();
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const { mutate: deactivateAccount, isPending: isDeactivating } =
    useMutation({
      mutationFn: deactivateMyAccount,

      onSuccess: () => {
        toast.success("Account deactivated");
        refreshAuthUser();
      },

      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });

  const { mutate: removeAccount, isPending: isDeleting } = useMutation({
    mutationFn: deleteMyAccount,

    onSuccess: () => {
      toast.success("Account deleted");
      refreshAuthUser();
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSkillChange = (skill) => {
    setFormState((current) => {
      const exists = current.skills.includes(skill);

      return {
        ...current,
        skills: exists
          ? current.skills.filter((item) => item !== skill)
          : [...current.skills, skill],
      };
    });
  };

  const handleLookingForChange = (option) => {
    setFormState((current) => {
      const exists = current.lookingFor.includes(option);

      return {
        ...current,
        lookingFor: exists
          ? current.lookingFor.filter((item) => item !== option)
          : [...current.lookingFor, option],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!formState.registrationId.trim()) {
      toast.error("Registration ID is required");
      return;
    }

    if (!formState.course) {
      toast.error("Please select your course");
      return;
    }

    if (!formState.branch) {
      toast.error("Please select your branch");
      return;
    }

    if (!formState.year) {
      toast.error("Please select your year");
      return;
    }

    if (!formState.semester) {
      toast.error("Please select your semester");
      return;
    }

    if (formState.skills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    if (formState.lookingFor.length === 0) {
      toast.error("Please select what you are looking for");
      return;
    }

    saveProfile(formState);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(getProfileFormState(authUser));
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 1000) + 1;

    handleChange(
      "profilePic",
      `https://api.dicebear.com/10.x/toon-head/svg?seed=${idx}`
    );

    toast.success("Random profile picture generated");
  };

  const profileDetails = [
    ["Email", authUser?.email || "Not available"],
    ["Registration ID", authUser?.registrationId || "Not set"],
    ["Course", authUser?.course || "Not set"],
    ["Branch", authUser?.branch || "Not set"],
    ["Year", authUser?.year || "Not set"],
    ["Semester", authUser?.semester || "Not set"],
    ["Location", authUser?.location || "Not set"],
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              My Profile
            </h1>

            <p className="text-sm text-base-content/70 mt-1">
              Manage your LPU student profile.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!isEditing) {
                setFormState(getProfileFormState(authUser));
              }

              setIsEditing((value) => !value);
            }}
          >
            {isEditing ? (
              <XIcon className="size-4" />
            ) : (
              <PencilIcon className="size-4" />
            )}

            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-6">

          {/* MAIN PROFILE */}
          <section className="card bg-base-200 shadow-md">
            <div className="card-body p-5 sm:p-7">

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* PROFILE PICTURE */}
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="avatar">
                      <div className="size-28 rounded-full bg-base-300">
                        {formState.profilePic ? (
                          <img
                            src={formState.profilePic}
                            alt="Profile preview"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <CameraIcon className="size-10 opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRandomAvatar}
                      className="btn btn-accent"
                    >
                      <ShuffleIcon className="size-4" />
                      Generate Avatar
                    </button>
                  </div>

                  {/* PROFILE PIC URL */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Profile Picture URL
                      </span>
                    </label>

                    <input
                      type="url"
                      className="input input-bordered w-full"
                      value={formState.profilePic}
                      onChange={(e) =>
                        handleChange("profilePic", e.target.value)
                      }
                      placeholder="https://example.com/avatar.png"
                    />
                  </div>

                  {/* FULL NAME */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Full Name
                      </span>
                    </label>

                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formState.fullName}
                      onChange={(e) =>
                        handleChange("fullName", e.target.value)
                      }
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  {/* REGISTRATION ID */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Registration ID
                      </span>
                    </label>

                    <input
                      type="text"
                      className="input input-bordered w-full uppercase"
                      value={formState.registrationId}
                      onChange={(e) =>
                        handleChange(
                          "registrationId",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="e.g. 12345678"
                      required
                    />
                  </div>

                  {/* ACADEMIC INFORMATION */}
                  <div>
                    <h2 className="font-semibold text-lg mb-3">
                      Academic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* COURSE */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">
                            Course
                          </span>
                        </label>

                        <select
                          className="select select-bordered w-full"
                          value={formState.course}
                          onChange={(e) =>
                            handleChange("course", e.target.value)
                          }
                          required
                        >
                          <option value="">
                            Select course
                          </option>

                          {COURSES.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* BRANCH */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">
                            Branch
                          </span>
                        </label>

                        <select
                          className="select select-bordered w-full"
                          value={formState.branch}
                          onChange={(e) =>
                            handleChange("branch", e.target.value)
                          }
                          required
                        >
                          <option value="">
                            Select branch
                          </option>

                          {BRANCHES.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* YEAR */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">
                            Year
                          </span>
                        </label>

                        <select
                          className="select select-bordered w-full"
                          value={formState.year}
                          onChange={(e) =>
                            handleChange("year", e.target.value)
                          }
                          required
                        >
                          <option value="">
                            Select year
                          </option>

                          {YEARS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SEMESTER */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">
                            Semester
                          </span>
                        </label>

                        <select
                          className="select select-bordered w-full"
                          value={formState.semester}
                          onChange={(e) =>
                            handleChange("semester", e.target.value)
                          }
                          required
                        >
                          <option value="">
                            Select semester
                          </option>

                          {SEMESTERS.map((semester) => (
                            <option key={semester} value={semester}>
                              {semester}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* SKILLS */}
                  <div>
                    <h2 className="font-semibold text-lg mb-3">
                      Skills
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((skill) => {
                        const selected =
                          formState.skills.includes(skill);

                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleSkillChange(skill)}
                            className={`btn btn-sm ${
                              selected
                                ? "btn-primary"
                                : "btn-outline"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>

                    {formState.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formState.skills.map((skill) => (
                          <span
                            key={skill}
                            className="badge badge-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* LOOKING FOR */}
                  <div>
                    <h2 className="font-semibold text-lg mb-3">
                      Looking For
                    </h2>

                    <p className="text-sm text-base-content/60 mb-3">
                      What are you looking for on Connectly?
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {LOOKING_FOR_OPTIONS.map((option) => {
                        const selected =
                          formState.lookingFor.includes(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              handleLookingForChange(option)
                            }
                            className={`btn btn-sm ${
                              selected
                                ? "btn-secondary"
                                : "btn-outline"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {formState.lookingFor.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formState.lookingFor.map((option) => (
                          <span
                            key={option}
                            className="badge badge-secondary"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BIO */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Bio
                      </span>
                    </label>

                    <textarea
                      className="textarea textarea-bordered h-28"
                      value={formState.bio}
                      onChange={(e) =>
                        handleChange("bio", e.target.value)
                      }
                      placeholder="Tell other LPU students about yourself..."
                      maxLength={500}
                    />

                    <label className="label">
                      <span className="label-text-alt">
                        {formState.bio.length}/500
                      </span>
                    </label>
                  </div>

                  {/* LOCATION */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Location
                      </span>
                    </label>

                    <div className="relative">
                      <MapPinIcon className="absolute top-1/2 -translate-y-1/2 left-3 size-5 opacity-60" />

                      <input
                        type="text"
                        className="input input-bordered w-full pl-10"
                        value={formState.location}
                        onChange={(e) =>
                          handleChange("location", e.target.value)
                        }
                        placeholder="Phagwara, Punjab"
                      />
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">

                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleCancel}
                    >
                      <XIcon className="size-4" />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <SaveIcon className="size-4" />
                      )}

                      Save Changes
                    </button>

                  </div>
                </form>
              ) : (

                /* ================= VIEW PROFILE ================= */

                <div className="space-y-6">

                  {/* PROFILE HEADER */}
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">

                    <div className="avatar">
                      <div className="size-28 rounded-full bg-base-300">

                        {authUser?.profilePic ? (
                          <img
                            src={authUser.profilePic}
                            alt={authUser.fullName}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <UserIcon className="size-10 opacity-50" />
                          </div>
                        )}

                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold break-words">
                        {authUser?.fullName}
                      </h2>

                      <p className="text-base-content/70 break-words">
                        {authUser?.bio || "No bio yet"}
                      </p>
                    </div>

                  </div>

                  {/* BASIC DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {profileDetails.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-base-100 p-4 border border-base-300"
                      >
                        <p className="text-xs uppercase tracking-wide text-base-content/60">
                          {label}
                        </p>

                        <p className="font-medium mt-1 break-words">
                          {value}
                        </p>
                      </div>
                    ))}

                  </div>

                  {/* SKILLS */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      Skills
                    </h3>

                    {authUser?.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {authUser.skills.map((skill) => (
                          <span
                            key={skill}
                            className="badge badge-primary badge-lg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-base-content/60">
                        No skills added yet.
                      </p>
                    )}
                  </div>

                  {/* LOOKING FOR */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      Looking For
                    </h3>

                    {authUser?.lookingFor?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {authUser.lookingFor.map((option) => (
                          <span
                            key={option}
                            className="badge badge-secondary badge-lg"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-base-content/60">
                        Nothing added yet.
                      </p>
                    )}
                  </div>

                </div>
              )}

            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-4">

            {/* SESSION */}
            <section className="card bg-base-200 shadow-md">
              <div className="card-body p-5">

                <h2 className="card-title text-lg">
                  Session
                </h2>

                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={() => logoutMutation()}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <LogOutIcon className="size-4" />
                  )}

                  Logout
                </button>

              </div>
            </section>

            {/* DEACTIVATE */}
            <section className="card bg-base-200 shadow-md border border-warning/30">
              <div className="card-body p-5">

                <h2 className="card-title text-lg">
                  Deactivate Account
                </h2>

                <p className="text-sm text-base-content/70">
                  This temporarily disables login for this account.
                </p>

                <button
                  type="button"
                  className="btn btn-warning w-full"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Deactivate your account temporarily?"
                      )
                    ) {
                      deactivateAccount();
                    }
                  }}
                  disabled={isDeactivating}
                >
                  {isDeactivating ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <PowerOffIcon className="size-4" />
                  )}

                  Deactivate
                </button>

              </div>
            </section>

            {/* DELETE */}
            <section className="card bg-base-200 shadow-md border border-error/30">
              <div className="card-body p-5">

                <h2 className="card-title text-lg text-error">
                  Delete Account
                </h2>

                <p className="text-sm text-base-content/70">
                  This permanently removes your account,
                  friendships, and friend requests.
                </p>

                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={deleteConfirm}
                  onChange={(e) =>
                    setDeleteConfirm(e.target.value)
                  }
                  placeholder="Type DELETE to confirm"
                />

                <button
                  type="button"
                  className="btn btn-error w-full"
                  onClick={() => removeAccount()}
                  disabled={
                    deleteConfirm !== "DELETE" || isDeleting
                  }
                >
                  {isDeleting ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}

                  Delete Permanently
                </button>

              </div>
            </section>

          </aside>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;