import { api } from "./axios";
import type { User } from "../types/api";

export type LoginPayload = { identifier: string; password: string };
export type RegisterPayload = { email: string; username: string; password: string; full_name?: string };

export async function login(payload: LoginPayload) {
  const { data } = await api.post<{ access_token: string; user: User }>("/auth/login", {
    identifier: payload.identifier,
    password: payload.password
  });
  localStorage.setItem("cinemind_token", data.access_token);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function me() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function logout() {
  localStorage.removeItem("cinemind_token");
}

export function getStoredToken() {
  return localStorage.getItem("cinemind_token");
}
