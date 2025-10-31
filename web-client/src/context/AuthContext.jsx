import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { account, ID } from "../appwrite/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await account.get();
      setUser(res);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const register = async (email, password, name) => {
    await account.create(ID.unique(), email, password, name);
    return login(email, password);
  };

  const login = async (email, password) => {
    try {
      // Create a new session directly; avoid session APIs when unauthenticated
      await account.createEmailPasswordSession(email, password);
      await fetchUser();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
