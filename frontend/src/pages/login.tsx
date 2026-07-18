import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../api/auth.api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Invalid email or password.";
      setError(message);
    }
  }

  return (
    <main 
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), url('https://image.tmdb.org/t/p/original/2ssWTSVklAEc98frZUQhgtGHx7s.jpg')`
      }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-border bg-muted p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <div className="mt-6 grid gap-3">
          <Input type="text" placeholder="Email or Username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button>Sign in</Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          New here? <Link to="/register" className="font-medium text-primary">Create an account</Link>
        </p>
      </form>
    </main>
  );
}

