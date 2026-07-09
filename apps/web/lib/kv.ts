import type { KvPort } from "@rosm/core/ports";

// Web KvPort backed by localStorage, guarded for SSR (no localStorage on the
// server, where the route archive reads empty and writes no-op). Access is lazy
// so importing this module never touches localStorage at load time.
export const kv: KvPort = {
  get: (key) => (typeof localStorage !== "undefined" ? localStorage.getItem(key) : null),
  set: (key, value) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
};
