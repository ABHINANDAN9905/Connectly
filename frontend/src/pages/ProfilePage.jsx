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
import { LANGUAGES } from "../constants";
import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import { deactivateMyAccount, deleteMyAccount, updateMyProfile } from "../lib/api";
import { capitialize, getApiErrorMessage } from "../lib/utils";

const getProfileFormState = (user) => ({
  fullName: user?.fullName || "",
  bio: user?.bio || "",
  nativeLanguage: user?.nativeLanguage || "",
  learningLanguage: user?.learningLanguage || "",
  location: user?.location || "",
  profilePic: user?.profilePic || "",
});

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const { logoutMutation, isPending: isLoggingOut } = useLogout();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [formState, setFormState] = useState(() => getProfileFormState(authUser));

  const refreshAuthUser = () => queryClient.invalidateQueries({ queryKey: ["authUser"] });

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      setIsEditing(false);
      refreshAuthUser();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const { mutate: deactivateAccount, isPending: isDeactivating } = useMutation({
    mutationFn: deactivateMyAccount,
    onSuccess: () => {
      toast.success("Account deactivated");
      refreshAuthUser();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const { mutate: removeAccount, isPending: isDeleting } = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      toast.success("Account deleted");
      refreshAuthUser();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const handleChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveProfile(formState);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormState(getProfileFormState(authUser));
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 1000) + 1;
    handleChange("profilePic", `https://api.dicebear.com/10.x/toon-head/svg?seed=${idx}`);
    toast.success("Random profile picture generated");
  };

  const profileDetails = [
    ["Email", authUser?.email],
    ["Native Language", authUser?.nativeLanguage ? capitialize(authUser.nativeLanguage) : "Not set"],
    [
      "Learning Language",
      authUser?.learningLanguage ? capitialize(authUser.learningLanguage) : "Not set",
    ],
    ["Location", authUser?.location || "Not set"],
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
            <p className="text-sm text-base-content/70 mt-1">View and manage your account.</p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!isEditing) setFormState(getProfileFormState(authUser));
              setIsEditing((value) => !value);
            }}
          >
            {isEditing ? <XIcon className="size-4" /> : <PencilIcon className="size-4" />}
            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-6">
          <section className="card bg-base-200 shadow-md">
            <div className="card-body p-5 sm:p-7">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="avatar">
                      <div className="size-28 rounded-full bg-base-300">
                        {formState.profilePic ? (
                          <img src={formState.profilePic} alt="Profile preview" />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <CameraIcon className="size-10 opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                      <ShuffleIcon className="size-4" />
                      Generate Avatar
                    </button>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Profile Picture URL</span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered w-full"
                      value={formState.profilePic}
                      onChange={(e) => handleChange("profilePic", e.target.value)}
                      placeholder="https://example.com/avatar.png"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formState.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Bio</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-28"
                      value={formState.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      placeholder="Tell people a little about yourself"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Native Language</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={formState.nativeLanguage}
                        onChange={(e) => handleChange("nativeLanguage", e.target.value)}
                      >
                        <option value="">Select your native language</option>
                        {LANGUAGES.map((lang) => (
                          <option key={`native-${lang}`} value={lang.toLowerCase()}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Learning Language</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={formState.learningLanguage}
                        onChange={(e) => handleChange("learningLanguage", e.target.value)}
                      >
                        <option value="">Select language you're learning</option>
                        {LANGUAGES.map((lang) => (
                          <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Location</span>
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute top-1/2 -translate-y-1/2 left-3 size-5 opacity-60" />
                      <input
                        type="text"
                        className="input input-bordered w-full pl-10"
                        value={formState.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                      <XIcon className="size-4" />
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
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
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="avatar">
                      <div className="size-28 rounded-full bg-base-300">
                        {authUser?.profilePic ? (
                          <img src={authUser.profilePic} alt={authUser.fullName} />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <UserIcon className="size-10 opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold break-words">{authUser?.fullName}</h2>
                      <p className="text-base-content/70 break-words">{authUser?.bio || "No bio yet"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profileDetails.map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-base-100 p-4 border border-base-300">
                        <p className="text-xs uppercase tracking-wide text-base-content/60">{label}</p>
                        <p className="font-medium mt-1 break-words">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="card bg-base-200 shadow-md">
              <div className="card-body p-5">
                <h2 className="card-title text-lg">Session</h2>
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

            <section className="card bg-base-200 shadow-md border border-warning/30">
              <div className="card-body p-5">
                <h2 className="card-title text-lg">Deactivate Account</h2>
                <p className="text-sm text-base-content/70">
                  This temporarily disables login for this account.
                </p>
                <button
                  type="button"
                  className="btn btn-warning w-full"
                  onClick={() => {
                    if (window.confirm("Deactivate your account temporarily?")) deactivateAccount();
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

            <section className="card bg-base-200 shadow-md border border-error/30">
              <div className="card-body p-5">
                <h2 className="card-title text-lg text-error">Delete Account</h2>
                <p className="text-sm text-base-content/70">
                  This permanently removes your account, friendships, and friend requests.
                </p>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE to confirm"
                />
                <button
                  type="button"
                  className="btn btn-error w-full"
                  onClick={() => removeAccount()}
                  disabled={deleteConfirm !== "DELETE" || isDeleting}
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
