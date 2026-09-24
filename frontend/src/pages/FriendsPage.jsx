import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getUserFriends } from "../lib/api";
import NoFriendsFound from "../components/NoFriendsFound";
import PageLoader from "../components/PageLoader.jsx";
import {
  MessageCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  UserRound,
} from "lucide-react";

const FriendsPage = () => {
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          Friends
        </h1>

        <p className="text-sm text-base-content/60 mt-1">
          Connect and collaborate with your LPU friends.
        </p>
      </div>

      {friends.length === 0 ? (
        <NoFriendsFound />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {friends.map((friend) => (
            <div
              key={friend._id}
              className="group rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Link to={`/student/${friend._id}`}>
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-full ring-2 ring-primary/20">
                      {friend.profilePic ? (
                        <img
                          src={friend.profilePic}
                          alt={friend.fullName}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                          <UserRound className="w-7 h-7 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="min-w-0">
                  <Link
                    to={`/student/${friend._id}`}
                    className="font-bold text-lg hover:text-primary transition-colors truncate block"
                  >
                    {friend.fullName}
                  </Link>

                  {friend.location && (
                    <div className="flex items-center gap-1 text-sm text-base-content/60 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{friend.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Info */}
              <div className="mt-5 space-y-2">
                {(friend.course || friend.branch) && (
                  <div className="flex items-start gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 mt-0.5 text-primary shrink-0" />

                    <span className="text-base-content/80">
                      {friend.course}
                      {friend.course && friend.branch ? " • " : ""}
                      {friend.branch}
                    </span>
                  </div>
                )}

                {(friend.year || friend.semester) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-primary shrink-0" />

                    <span className="text-base-content/70">
                      {friend.year}
                      {friend.year && friend.semester ? " • " : ""}
                      {friend.semester}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {friend.bio && (
                <p className="mt-4 text-sm text-base-content/70 line-clamp-2">
                  {friend.bio}
                </p>
              )}

              {/* Skills */}
              {friend.skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
                    Skills
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {friend.skills.slice(0, 4).map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="badge badge-sm badge-primary badge-outline"
                      >
                        {skill}
                      </span>
                    ))}

                    {friend.skills.length > 4 && (
                      <span className="badge badge-sm">
                        +{friend.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Looking For */}
              {friend.lookingFor?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
                    Looking for
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {friend.lookingFor.slice(0, 3).map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="badge badge-sm badge-secondary badge-outline"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Button */}
              <Link
                to={`/chat/${friend._id}`}
                className="btn btn-primary btn-sm w-full mt-5 gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;