"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Github } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

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

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setLoading(true);
    setError(null);
    try {
      await signIn(provider, { callbackUrl });
    } catch (err) {
      console.error("OAuth sign in error:", err);
      setError(`Failed to sign in with ${provider}.`);
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
                <Label htmlFor="email" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email or Login ID</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-[11px] h-4 w-4 text-neutral-500" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="name@example.com or team01"
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

              {/* OAuth Divider */}
              <div className="relative flex items-center justify-center w-full my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800"></div>
                </div>
                <span className="relative px-3 text-[10px] text-neutral-500 uppercase tracking-wider bg-[#101010]">
                  Or continue with
                </span>
              </div>

              {/* OAuth Social Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthSignIn("github")}
                  disabled={loading}
                  className="bg-neutral-950 border-neutral-800 hover:bg-neutral-850 hover:text-white text-xs h-10 font-semibold"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                  className="bg-neutral-950 border-neutral-800 hover:bg-neutral-850 hover:text-white text-xs h-10 font-semibold"
                >
                  <GoogleIcon />
                  Google
                </Button>
              </div>

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
