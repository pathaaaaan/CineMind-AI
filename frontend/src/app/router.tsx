import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/layout/app-shell";
import { DashboardPage } from "../pages/dashboard";
import { HomePage } from "../pages/home";
import { LoginPage } from "../pages/login";
import { MovieDetailPage } from "../pages/movie-detail";
import { RegisterPage } from "../pages/register";
import { SearchPage } from "../pages/search";
import { WatchlistPage } from "../pages/watchlist";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

