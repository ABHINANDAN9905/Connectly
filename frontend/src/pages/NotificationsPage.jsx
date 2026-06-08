import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import useNotifications from "../hooks/useNotifications";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NoNotificationsFound from "../components/NoNotificationsFound";

const formatRelativeTime = (date) => {
  if (!date) return "Unknown";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

const NotificationsPage = () => {
  const { notifications, totalUnread, isReady, markChannelRead } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  const handleNotificationClick = async (notification) => {
    if (!notification.targetUserId) return;
    // Mark read immediately in context so badge drops before navigation
    await markChannelRead(notification.channelId);
    navigate(`/chat/${notification.targetUserId}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {/* ── Unread Messages Section ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Unread Messages</h2>
            {isReady && totalUnread > 0 && (
              <span className="badge badge-error ml-2">{totalUnread} unread</span>
            )}
          </div>

          {!isReady ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.channelId}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left card bg-base-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="card-body p-4 flex flex-row items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-base-300 overflow-hidden ring-2 ring-primary/20">
                        <img
                          src={notification.avatar}
                          alt={notification.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/favicon.ico"; }}
                        />
                      </div>
                      {/* Unread dot */}
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-error border-2 border-base-200" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{notification.title}</h3>
                          <p className="text-xs opacity-60 truncate">{notification.subtitle}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="badge badge-error badge-sm font-bold">
                            {notification.unreadCount}
                          </span>
                          <p className="text-xs opacity-50 whitespace-nowrap flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {formatRelativeTime(notification.time)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-base-content/70 mt-1.5 truncate">
                        {notification.preview}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body p-6 text-center">
                <p className="text-base-content/60">
                  All caught up — no unread chat notifications right now.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Friend Requests ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div key={request._id} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img src={request.sender.profilePic} alt={request.sender.fullName} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                  Native: {request.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-sm">
                                  Learning: {request.sender.learningLanguage}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>
                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img src={notification.recipient.profilePic} alt={notification.recipient.fullName} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 &&
              acceptedRequests.length === 0 &&
              isReady &&
              notifications.length === 0 && <NoNotificationsFound />}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;