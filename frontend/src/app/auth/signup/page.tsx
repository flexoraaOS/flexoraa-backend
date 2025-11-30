"use client";

import React, { useState }     from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";
import { Toaster, toast }      from "sonner";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { signInWithGoogle, signInWithFacebook, signupUser }                     from "@/lib/features/authSlice";

import { Button }       from "@/components/ui/button";
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle
}                      from "@/components/ui/card";
import { Input }       from "@/components/ui/input";
import { Label }       from "@/components/ui/label";
import { Logo }        from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ThemeToggle";


function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.06,4.71c2.04-6.044,7.932-10.401,14.634-10.401c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.018,35.258,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="#1877F2"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="#25D366"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}
export default function SignupPage() {
  const dispatch = useAppDispatch();                              
  const { loading } = useAppSelector(state => state.auth);       
  const router    = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!firstName || !lastName) {
      toast.error("Please enter your full name.");
      return;
    }
    if (password !== confirmPw) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      // unwrap() now really throws your rejectWithValue payload (a string)
      await dispatch(
        signupUser({ firstName, lastName, email, password })
      ).unwrap();

      toast.success("Account created! Redirecting to login…");
      router.push("/");
    } catch (err) {
      // We are logging the error and displaying a toast
      console.error("Signup failed:", err);
      toast.error( "Signup failed. Please try again.");
    }
  };
  const handleGoogleSignup = async () => {
    try {
      await dispatch(signInWithGoogle()).unwrap();
    } catch (err) {
      console.error('Failed to initiate Google signup: ', err);
    }
  };

  const handleFacebookSignup = async () => {
    try {
      await dispatch(signInWithFacebook()).unwrap();
    } catch (err) {
      console.error('Failed to initiate Facebook signup: ', err);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen animated-background p-4" id="animated-background">
      {/* Floating Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Toaster richColors />
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4"><Logo/></div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Fill in your details to get started.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Re‑enter your password"
                required
              />
            </div>
          </CardContent>
<br/>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full " variant="red"
              disabled={loading === "pending"}
            >
              {loading === "pending" ? "Creating…" : "Create Account"}
            </Button>
          </CardFooter>
        </form>

        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"/>
            </div>
            <div className="relative flex justify-center text-xs uppercase bg-card px-2 text-muted-foreground">
              Or continue with
            </div>
          </div>

          <Button variant="outline" className="w-full"
          onClick={handleGoogleSignup}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Sign up with Google
          </Button>

          <Button variant="outline" className="w-full"
          onClick={handleFacebookSignup}
          >
            <FacebookIcon className="mr-2 h-5 w-5" />
            Sign up with Facebook
          </Button>

          <Button variant="outline" className="w-full"
          onClick={() => router.push('/auth/whatsapp-login')}
          >
            <WhatsAppIcon className="mr-2 h-5 w-5" />
            Sign up with WhatsApp
          </Button>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#ec4343] hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
