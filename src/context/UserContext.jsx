import { createContext, useContext, useEffect, useState } from "react";
import { loadUsers, saveUsers, subscribeUsers } from "../lib/userStore.js";

const UserContext = createContext(null);
const KEY = "qahub-current-user-id";

export function UserProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [userId, setUserId] = useState(() => localStorage.getItem(KEY) || "u1");

  useEffect(() => subscribeUsers(setUsers), []);

  // If the current user was removed, fall back to the first user
  const user = users.find((u) => u.id === userId) ?? users[0];

  const switchUser = (id) => {
    setUserId(id);
    localStorage.setItem(KEY, id);
  };

  const updateUsers = (next) => {
    setUsers(next);
    saveUsers(next);
  };

  return (
    <UserContext.Provider value={{ user, users, switchUser, updateUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
