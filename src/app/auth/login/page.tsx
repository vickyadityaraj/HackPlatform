"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("USER_SUSPENDED") || res.error.includes("suspended")) {
          setError("Your account has been suspended. Please contact an organizer.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
        setLoading(false);
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-neutral-950 overflow-hidden px-4 font-sans">
      {/* Soft Background Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[50%] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[50%] rounded-full bg-violet-600/5 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/15">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-50">Hackathon Portal</h2>
            <p className="text-xs text-neutral-450">Innovate, collaborate, and compete on a single platform</p>
          </div>
        </div>

        {/* Form Card Container */}
        <Card className="border-neutral-800 bg-neutral-900/40 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardHeader className="space-y-1.5 pb-6 border-b border-neutral-800/40">
            <CardTitle className="text-xl font-bold tracking-tight text-center text-neutral-50">Sign In</CardTitle>
            <CardDescription className="text-xs text-neutral-400 text-center">
              Access your personalized hackathon workspace
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="py-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Address Input Group */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-[11px] h-4 w-4 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-neutral-950/60 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500 text-sm h-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input Group */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-[11px] h-4 w-4 text-neutral-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-neutral-950/60 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus-visible:ring-violet-500/40 focus-visible:border-violet-500 text-sm h-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-4 pb-6 px-6 border-t border-neutral-800/35">
              <Button 
                type="submit" 
                className="w-full bg-violet-600 text-neutral-100 font-semibold hover:bg-violet-700 shadow-md shadow-violet-500/10 h-10 text-sm transition-all duration-200" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-xs text-center text-neutral-450">
                {"Don't have an account? "}
                <Link 
                  href="/auth/register" 
                  className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Create one now
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
