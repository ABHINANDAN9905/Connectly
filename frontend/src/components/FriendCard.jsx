import { Link } from "react-router-dom";
import {
  MessageCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  UserRound,
} from "lucide-react";

const FriendCard = ({ friend }) => {
  return (
    <div className="card bg-base-200 hover:shadow-lg transition-all duration-300 border border-base-300">
      <div className="card-body p-5">

        {/* PROFILE HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/student/${friend._id}`}>
            <div className="avatar">
              <div className="w-14 h-14 rounded-full ring-2 ring-primary/20">
                {friend.profilePic ? (
                  <img
                    src={friend.profilePic}
                    alt={friend.fullName}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                    <UserRound className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </Link>

          <div className="min-w-0">
            <Link
              to={`/student/${friend._id}`}
              className="font-semibold text-lg truncate block hover:text-primary transition-colors"
            >
              {friend.fullName}
            </Link>

            {friend.location && (
              <div className="flex items-center gap-1 text-xs text-base-content/60 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{friend.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* ACADEMIC INFO */}
        <div className="space-y-2 mb-4">

          {(friend.course || friend.branch) && (
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4 text-primary shrink-0" />

              <span>
                {friend.course}
                {friend.course && friend.branch && " • "}
                {friend.branch}
              </span>
            </div>
          )}

          {(friend.year || friend.semester) && (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Briefcase className="w-4 h-4 text-primary shrink-0" />

              <span>
                {friend.year}
                {friend.year && friend.semester && " • "}
                {friend.semester}
              </span>
            </div>
          )}

        </div>

        {/* BIO */}
        {friend.bio && (
          <p className="text-sm text-base-content/70 line-clamp-2 mb-4">
            {friend.bio}
          </p>
        )}

        {/* SKILLS */}
        {friend.skills?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-base-content/50 uppercase mb-2">
              Skills
            </p>

            <div className="flex flex-wrap gap-1.5">
              {friend.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="badge badge-primary badge-outline badge-sm"
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

        {/* LOOKING FOR */}
        {friend.lookingFor?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-base-content/50 uppercase mb-2">
              Looking For
            </p>

            <div className="flex flex-wrap gap-1.5">
              {friend.lookingFor.slice(0, 3).map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="badge badge-secondary badge-outline badge-sm"
                >
                  {item}
                </span>
              ))}

              {friend.lookingFor.length > 3 && (
                <span className="badge badge-sm">
                  +{friend.lookingFor.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* MESSAGE */}
        <Link
          to={`/chat/${friend._id}`}
          className="btn btn-outline btn-primary w-full gap-2 mt-auto"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Link>

      </div>
    </div>
  );
};

export default FriendCard;