import { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getProfile } from "../services/userService";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    id: "",
    fullname: "",
    email: "",
    role: "",
    profileImage: null,
    createdAt: null,
  });

  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setUser({
        id: "",
        fullname: "",
        email: "",
        role: "",
        profileImage: null,
        createdAt: null,
      });
      setLoading(false);
      return null;
    }

    setLoading(true);
    const result = await getProfile();

    if (!result.error) {
      const nextUser = {
        id: result.data.id || result.data.user_id || result.data.userId || "",
        fullname: result.data.fullname || "",
        email: result.data.email || "",
        role: result.data.role || "",
        profileImage:
          result.data.profileImage ||
          result.data.profile_image ||
          null,
        createdAt: result.data.createdAt || result.data.created_at || null,
      };

      setLoading(false);
      setUser(nextUser);
      return nextUser;
    }

    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshUser);
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  return useContext(UserContext);
}
