import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  CheckCircleIcon,
  Code2Icon,
  GraduationCapIcon,
  LoaderIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getUserById,
  getOutgoingFriendReqs,
  sendFriendRequest,
} from "../lib/api";

const StudentProfilePage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // =========================================================
  // GET SPECIFIC STUDENT
  // =========================================================

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });

  const student = data?.user;

  // =========================================================
  // OUTGOING FRIEND REQUESTS
  // =========================================================

  const { data: outgoingRequests = [] } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // =========================================================
  // CHECK REQUEST STATUS
  // =========================================================

  const hasRequestBeenSent = outgoingRequests.some(
    (request) => request?.recipient?._id === id
  );

  // =========================================================
  // SEND FRIEND REQUEST
  // =========================================================

  const { mutate: sendRequest, isPending } = useMutation({
    mutationFn: sendFriendRequest,

    onSuccess: () => {
      toast.success("Friend request sent!");

      queryClient.invalidateQueries({
        queryKey: ["outgoingFriendReqs"],
      });

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });

      queryClient.invalidateQueries({
        queryKey: ["student", id],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to send friend request"
      );
    },
  });

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="size-8 animate-spin text-primary" />

          <p className="text-sm opacity-60">
            Loading student profile...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================

  if (isError || !student) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto size-16 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
            <UsersIcon className="size-8 text-error" />
          </div>

          <h2 className="text-2xl font-bold">
            Student not found
          </h2>

          <p className="opacity-60 mt-2">
            This profile may no longer be available.
          </p>

          <Link
            to="/"
            className="btn btn-primary mt-5"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">

        {/* BACK */}
        <Link
          to="/"
          className="btn btn-ghost btn-sm mb-5"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Discover
        </Link>

        {/* PROFILE CARD */}
        <div className="rounded-3xl overflow-hidden border border-base-300 bg-base-200 shadow-xl">

          {/* COVER */}
          <div className="h-32 sm:h-44 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/10" />

          <div className="px-5 sm:px-8 pb-8">

            {/* PROFILE HEADER */}
            <div className="-mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-5">

              {/* PROFILE IMAGE */}
              <div className="avatar">
                <div className="size-28 sm:size-32 rounded-3xl ring-4 ring-base-200 bg-base-300 overflow-hidden shadow-xl">

                  {student.profilePic ? (
                    <img
                      src={student.profilePic}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary bg-primary/10">
                      {student.fullName
                        ?.charAt(0)
                        ?.toUpperCase() || "U"}
                    </div>
                  )}

                </div>
              </div>

              {/* CONNECT BUTTON */}
              <button
                className={`btn ${
                  hasRequestBeenSent
                    ? "btn-disabled"
                    : "btn-primary"
                }`}
                onClick={() => sendRequest(student._id)}
                disabled={
                  hasRequestBeenSent || isPending
                }
              >
                {isPending ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : hasRequestBeenSent ? (
                  <>
                    <CheckCircleIcon className="size-4" />
                    Request Sent
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="size-4" />
                    Connect
                  </>
                )}
              </button>

            </div>

            {/* NAME */}
            <div className="mt-5">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {student.fullName}
              </h1>

              {student.location && (
                <div className="flex items-center gap-1.5 mt-2 text-sm opacity-60">
                  <MapPinIcon className="size-4" />
                  {student.location}
                </div>
              )}
            </div>

            {/* BIO */}
            {student.bio && (
              <div className="mt-6">
                <h2 className="font-semibold text-lg mb-2">
                  About
                </h2>

                <p className="text-sm sm:text-base leading-relaxed opacity-70">
                  {student.bio}
                </p>
              </div>
            )}

            {/* ACADEMIC INFORMATION */}
            <div className="mt-7">
              <h2 className="font-semibold text-lg mb-3">
                Academic Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* COURSE */}
                {student.course && (
                  <div className="rounded-xl bg-base-100 border border-base-300 p-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <GraduationCapIcon className="size-5" />

                      <span className="text-xs font-semibold uppercase opacity-60">
                        Course
                      </span>
                    </div>

                    <p className="font-medium">
                      {student.course}
                    </p>
                  </div>
                )}

                {/* BRANCH */}
                {student.branch && (
                  <div className="rounded-xl bg-base-100 border border-base-300 p-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <GraduationCapIcon className="size-5" />

                      <span className="text-xs font-semibold uppercase opacity-60">
                        Branch
                      </span>
                    </div>

                    <p className="font-medium">
                      {student.branch}
                    </p>
                  </div>
                )}

                {/* YEAR */}
                {student.year && (
                  <div className="rounded-xl bg-base-100 border border-base-300 p-4">
                    <span className="text-xs font-semibold uppercase opacity-60">
                      Year
                    </span>

                    <p className="font-medium mt-1">
                      {student.year}
                    </p>
                  </div>
                )}

                {/* SEMESTER */}
                {student.semester && (
                  <div className="rounded-xl bg-base-100 border border-base-300 p-4">
                    <span className="text-xs font-semibold uppercase opacity-60">
                      Semester
                    </span>

                    <p className="font-medium mt-1">
                      Semester {student.semester}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* SKILLS */}
            <div className="mt-7">
              <div className="flex items-center gap-2 mb-3">
                <Code2Icon className="size-5 text-primary" />

                <h2 className="font-semibold text-lg">
                  Skills
                </h2>
              </div>

              {student.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {student.skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="badge badge-primary badge-outline py-3 px-3"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm opacity-50">
                  No skills added.
                </p>
              )}
            </div>

            {/* LOOKING FOR */}
            <div className="mt-7">
              <div className="flex items-center gap-2 mb-3">
                <BriefcaseBusinessIcon className="size-5 text-secondary" />

                <h2 className="font-semibold text-lg">
                  Looking For
                </h2>
              </div>

              {student.lookingFor?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {student.lookingFor.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="badge badge-secondary badge-outline py-3 px-3"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm opacity-50">
                  Nothing added yet.
                </p>
              )}
            </div>

            {/* REGISTRATION ID */}
            {student.registrationId && (
              <div className="mt-7 rounded-xl bg-base-100 border border-base-300 p-4">
                <p className="text-xs uppercase font-semibold opacity-50">
                  Registration ID
                </p>

                <p className="font-medium mt-1">
                  {student.registrationId}
                </p>
              </div>
            )}

            {/* BOTTOM CONNECT */}
            <div className="mt-8 pt-6 border-t border-base-300">
              <button
                className={`btn btn-lg w-full ${
                  hasRequestBeenSent
                    ? "btn-disabled"
                    : "btn-primary"
                }`}
                onClick={() => sendRequest(student._id)}
                disabled={
                  hasRequestBeenSent || isPending
                }
              >
                {isPending ? (
                  <>
                    <LoaderIcon className="size-5 animate-spin" />
                    Sending Request...
                  </>
                ) : hasRequestBeenSent ? (
                  <>
                    <CheckCircleIcon className="size-5" />
                    Friend Request Sent
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="size-5" />
                    Send Friend Request
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default StudentProfilePage;