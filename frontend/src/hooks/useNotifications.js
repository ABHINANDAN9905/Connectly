import { useContext } from "react";
import { NotificationContext } from "../contexts/notificationContext";

const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export default useNotifications;
