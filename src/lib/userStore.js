import { DEMO_USERS } from "../data/users.js";

const KEY = "qahub-users-v1";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("qa-hub-users") : null;

export function loadUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* use defaults */ }
  return DEMO_USERS;
}

export function saveUsers(users) {
  localStorage.setItem(KEY, JSON.stringify(users));
  channel?.postMessage("changed");
}

export function subscribeUsers(handler) {
  if (!channel) return () => {};
  const listener = () => handler(loadUsers());
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
