import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login, register } from "../api/auth.api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      navigate("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.detail || "Could not create account. Try a different email or username.";
      setError(message);
    }
  }

  return (
    <main 
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), url('https://image.tmdb.org/t/p/original/8mnXR9rey5uQ08rZAvzojKWbDQS.jpg')`
      }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-border bg-muted p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <div className="mt-6 grid gap-3">
          <Input placeholder="Full name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <Input placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          <Input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <Input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button>Create account</Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="font-medium text-primary">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

