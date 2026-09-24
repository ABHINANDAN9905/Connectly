import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";

import { Link } from "react-router-dom";

import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  GraduationCapIcon,
  Code2Icon,
  BriefcaseBusinessIcon,
  SearchIcon,
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from "lucide-react";

import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();

  // ==========================================
  // FRIENDS
  // ==========================================

  const {
    data: friends = [],
    isLoading: loadingFriends,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // ==========================================
  // RECOMMENDED STUDENTS
  // ==========================================

  const {
    data: recommendedUsers = [],
    isLoading: loadingUsers,
    isError: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  // ==========================================
  // OUTGOING REQUESTS
  // ==========================================

  const {
    data: outgoingFriendReqs = [],
  } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // ==========================================
  // SEND FRIEND REQUEST
  // ==========================================

  const {
    mutate: sendRequestMutation,
    isPending: isSendingRequest,
  } = useMutation({
    mutationFn: sendFriendRequest,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["outgoingFriendReqs"],
      });

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  // ==========================================
  // REQUESTED USER IDS
  // ==========================================

  const outgoingRequestsIds = new Set(
    (outgoingFriendReqs || [])
      .map((req) => req?.recipient?._id)
      .filter(Boolean)
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingUsers || loadingFriends) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />

          <p className="text-sm opacity-60">
            Finding students for you...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-base-100">

      <div className="p-4 sm:p-6 lg:p-8">

        <div className="max-w-7xl mx-auto space-y-8">

          {/* =====================================================
              HERO SECTION
          ===================================================== */}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-base-200 to-secondary/10 border border-base-300">

            {/* Background decorations */}

            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />

            <div className="relative p-6 sm:p-8 lg:p-10">

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">

                <div className="max-w-2xl">

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">

                    <SparklesIcon className="size-4" />

                    Connectly • LPU Community

                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">

                    Find your
                    <span className="text-primary">
                      {" "}people.
                    </span>

                    <br />

                    Build something
                    <span className="text-secondary">
                      {" "}great.
                    </span>

                  </h1>

                  <p className="mt-4 text-base sm:text-lg opacity-70 max-w-xl">

                    Connect with LPU students for hackathons,
                    projects, internships, startups, freelancing
                    and networking.

                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">

                    <a
                      href="#discover"
                      className="btn btn-primary"
                    >
                      <SearchIcon className="size-4" />
                      Discover Students
                    </a>

                    <Link
                      to="/notifications"
                      className="btn btn-outline"
                    >
                      <UsersIcon className="size-4" />
                      Friend Requests
                    </Link>

                  </div>

                </div>

                {/* HERO STATS */}

                <div className="grid grid-cols-2 gap-3 min-w-[260px]">

                  <div className="rounded-2xl bg-base-100/70 backdrop-blur border border-base-300 p-5">

                    <UsersIcon className="size-6 text-primary mb-3" />

                    <p className="text-2xl font-bold">
                      {recommendedUsers.length}
                    </p>

                    <p className="text-sm opacity-60">
                      Students to discover
                    </p>

                  </div>

                  <div className="rounded-2xl bg-base-100/70 backdrop-blur border border-base-300 p-5">

                    <Code2Icon className="size-6 text-secondary mb-3" />

                    <p className="text-2xl font-bold">
                      Connect
                    </p>

                    <p className="text-sm opacity-60">
                      By skills & interests
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================================
              YOUR FRIENDS
          ===================================================== */}

          <section>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">

              <div>

                <div className="flex items-center gap-2">

                  <UsersIcon className="size-5 text-primary" />

                  <h2 className="text-xl sm:text-2xl font-bold">
                    Your Friends
                  </h2>

                </div>

                <p className="text-sm opacity-60 mt-1">
                  Students you're already connected with.
                </p>

              </div>

              {friends.length > 0 && (
                <Link
                  to="/friends"
                  className="btn btn-ghost btn-sm"
                >
                  View all
                  <ArrowRightIcon className="size-4" />
                </Link>
              )}

            </div>

            {friends.length === 0 ? (

              <NoFriendsFound />

            ) : (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                {friends.slice(0, 4).map((friend) => (

                  <FriendCard
                    key={friend._id}
                    friend={friend}
                  />

                ))}

              </div>

            )}

          </section>

          {/* =====================================================
              DISCOVER SECTION
          ===================================================== */}

          <section id="discover">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">

              <div>

                <div className="flex items-center gap-2">

                  <SparklesIcon className="size-5 text-primary" />

                  <h2 className="text-2xl sm:text-3xl font-bold">
                    Discover LPU Students
                  </h2>

                </div>

                <p className="text-sm sm:text-base opacity-60 mt-1">
                  Find people who match your skills,
                  interests and goals.
                </p>

              </div>

              <div className="badge badge-primary badge-outline py-3 px-4">
                {recommendedUsers.length} students
              </div>

            </div>

            {/* ERROR */}

            {usersError ? (

              <div className="rounded-2xl border border-error/20 bg-error/5 p-8 text-center">

                <h3 className="font-semibold text-lg">
                  Couldn't load students
                </h3>

                <p className="text-sm opacity-60 mt-1">
                  Please refresh the page and try again.
                </p>

              </div>

            ) : recommendedUsers.length === 0 ? (

              /* EMPTY STATE */

              <div className="rounded-3xl border border-base-300 bg-base-200/50 p-10 sm:p-14 text-center">

                <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">

                  <UsersIcon className="size-8 text-primary" />

                </div>

                <h3 className="text-xl font-bold">
                  No students found yet
                </h3>

                <p className="text-sm opacity-60 max-w-md mx-auto mt-2">
                  Once other LPU students complete their
                  Connectly profiles, they'll appear here.
                </p>

              </div>

            ) : (

              /* =================================================
                 STUDENT CARDS
              ================================================= */

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                {recommendedUsers.map((user) => {

                  const hasRequestBeenSent =
                    outgoingRequestsIds.has(user._id);

                  return (

                    <article
                      key={user._id}
                      className="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200/60 hover:bg-base-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                    >

                      {/* Top gradient */}

                      <div className="h-20 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/5" />

                      <div className="px-5 pb-5">

                        {/* =====================================
                            AVATAR
                        ===================================== */}

                        <div className="-mt-10 mb-4 flex items-end justify-between">

                          <div className="avatar">

                            <div className="size-20 rounded-2xl ring-4 ring-base-200 bg-base-300 overflow-hidden shadow-lg">

                              {user.profilePic ? (

                                <img
                                  src={user.profilePic}
                                  alt={user.fullName}
                                  className="w-full h-full object-cover"
                                />

                              ) : (

                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary bg-primary/10">

                                  {user.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase() || "U"}

                                </div>

                              )}

                            </div>

                          </div>

                          {hasRequestBeenSent && (
                            <span className="badge badge-success badge-outline gap-1">

                              <CheckCircleIcon className="size-3" />

                              Requested

                            </span>
                          )}

                        </div>

                        {/* =====================================
                            NAME
                        ===================================== */}

                        <div>

                          <h3 className="text-xl font-bold truncate">
                            {user.fullName}
                          </h3>

                          {user.location && (

                            <div className="flex items-center gap-1.5 text-xs opacity-60 mt-1">

                              <MapPinIcon className="size-3.5" />

                              <span className="truncate">
                                {user.location}
                              </span>

                            </div>

                          )}

                        </div>

                        {/* =====================================
                            ACADEMIC INFO
                        ===================================== */}

                        <div className="mt-4 space-y-2">

                          {user.course && (

                            <div className="flex items-start gap-2">

                              <GraduationCapIcon className="size-4 mt-0.5 text-primary shrink-0" />

                              <div>

                                <p className="text-sm font-medium">
                                  {user.course}
                                </p>

                                {user.branch && (
                                  <p className="text-xs opacity-60">
                                    {user.branch}
                                  </p>
                                )}

                              </div>

                            </div>

                          )}

                          {(user.year || user.semester) && (

                            <div className="flex items-center gap-2 text-xs opacity-60">

                              <BookOpenIcon className="size-4" />

                              <span>

                                {user.year}

                                {user.year && user.semester
                                  ? " • "
                                  : ""}

                                {user.semester
                                  ? `Semester ${user.semester}`
                                  : ""}

                              </span>

                            </div>

                          )}

                        </div>

                        {/* =====================================
                            SKILLS
                        ===================================== */}

                        {Array.isArray(user.skills) &&
                          user.skills.length > 0 && (

                            <div className="mt-4">

                              <div className="flex items-center gap-2 mb-2">

                                <Code2Icon className="size-4 opacity-60" />

                                <span className="text-xs font-semibold uppercase tracking-wide opacity-60">
                                  Skills
                                </span>

                              </div>

                              <div className="flex flex-wrap gap-1.5">

                                {user.skills
                                  .slice(0, 5)
                                  .map((skill) => (

                                    <span
                                      key={skill}
                                      className="badge badge-sm badge-outline"
                                    >
                                      {skill}
                                    </span>

                                  ))}

                                {user.skills.length > 5 && (

                                  <span className="badge badge-sm badge-ghost">

                                    +{user.skills.length - 5}

                                  </span>

                                )}

                              </div>

                            </div>

                          )}

                        {/* =====================================
                            LOOKING FOR
                        ===================================== */}

                        {Array.isArray(user.lookingFor) &&
                          user.lookingFor.length > 0 && (

                            <div className="mt-4">

                              <div className="flex items-center gap-2 mb-2">

                                <BriefcaseBusinessIcon className="size-4 opacity-60" />

                                <span className="text-xs font-semibold uppercase tracking-wide opacity-60">
                                  Looking For
                                </span>

                              </div>

                              <div className="flex flex-wrap gap-1.5">

                                {user.lookingFor
                                  .slice(0, 3)
                                  .map((item) => (

                                    <span
                                      key={item}
                                      className="badge badge-sm badge-primary badge-outline"
                                    >
                                      {item}
                                    </span>

                                  ))}

                                {user.lookingFor.length > 3 && (

                                  <span className="badge badge-sm badge-ghost">

                                    +{user.lookingFor.length - 3}

                                  </span>

                                )}

                              </div>

                            </div>

                          )}

                        {/* =====================================
                            BIO
                        ===================================== */}

                        {user.bio && (

                          <p className="mt-4 text-sm leading-relaxed opacity-65 line-clamp-2">

                            {user.bio}

                          </p>

                        )}

                        {/* =====================================
                            CONNECT BUTTON
                        ===================================== */}

                        <button
                          className={`btn w-full mt-5 ${
                            hasRequestBeenSent
                              ? "btn-disabled"
                              : "btn-primary"
                          }`}
                          onClick={() =>
                            sendRequestMutation(user._id)
                          }
                          disabled={
                            hasRequestBeenSent ||
                            isSendingRequest
                          }
                        >

                          {hasRequestBeenSent ? (

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

                    </article>

                  );

                })}

              </div>

            )}

          </section>

        </div>

      </div>

    </main>
  );
};

export default HomePage;