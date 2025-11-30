"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { loginUser, signInWithGoogle, signInWithFacebook } from "@/lib/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, QrCode, MessageCircle, Sparkles, Zap, ShieldCheck } from "lucide-react";

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

// Floating orb component for visual appeal
function FloatingOrb({ delay = 0, duration = 20, className = "" }: { delay?: number; duration?: number; className?: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
      animate={{
        x: [0, 100, 0, -100, 0],
        y: [0, -100, 100, -50, 0],
        scale: [1, 1.2, 0.8, 1.1, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAutoRegistering, setIsAutoRegistering] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector(state => state.auth);

  const handleLogin = async () => {
    try {
      // First, check if there's a demo user in localStorage
      const demoUserStr = localStorage.getItem('demoUser');
      if (demoUserStr) {
        const demoUser = JSON.parse(demoUserStr);
        if (demoUser.email === email.trim().toLowerCase() && demoUser.password === password) {
          // Demo user login successful
          const mockUser = {
            id: 'demo-user-id',
            email: demoUser.email,
            user_metadata: {
              first_name: 'Demo',
              last_name: 'User',
              role: 'admin',
              has_leados_access: true,
              has_agentos_access: true,
            },
            created_at: demoUser.createdAt,
          };

          // Set auth state manually for demo user
          dispatch({ type: 'auth/setAuthState', payload: { user: mockUser } });
          router.push('/dashboard');
          return;
        }
      }

      // If no demo user or credentials don't match, try Supabase
      await dispatch(loginUser({ email, password })).unwrap();
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to login: ', err);
    }
  };

  const handleQuickLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsAutoRegistering(true);
    const toastId = toast.loading('Setting up your account...');

    try {
      // Step 1: Auto-register/login user
      const registerResponse = await fetch('/api/auth/auto-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName: email.split('@')[0],
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerData.success) {
        throw new Error(registerData.error || 'Registration failed');
      }

      toast.loading('Logging you in...', { id: toastId });

      // Step 2: Login with credentials
      await dispatch(loginUser({ email, password })).unwrap();

      toast.loading('Connecting to Meta...', { id: toastId });

      // Step 3: Trigger Meta OAuth
      const metaAuthUrl = `/api/oauth/meta?userId=${registerData.userId}`;
      
      toast.success('Account ready! Connecting to Meta...', { id: toastId });
      
      // Redirect to Meta OAuth
      globalThis.location.href = metaAuthUrl;

    } catch (err) {
      console.error('Quick login failed:', err);
      toast.error(err instanceof Error ? err.message : 'Setup failed', { id: toastId });
      setIsAutoRegistering(false);
    }
  };


  const handleLoginWithGoogle = async () => {
    try {
      await dispatch(signInWithGoogle()).unwrap()
    } catch (e) {
      console.error("Error in google login ", e)
    }
  }

  const handleLoginWithFacebook = async () => {
    try {
      await dispatch(signInWithFacebook()).unwrap()
    } catch (e) {
      console.error("Error in facebook login ", e)
    }
  }

  return (
    <div className="flex min-h-screen w-full relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 bg-liner-to-br from-orange-50/30 via-background to-pink-50/30 dark:from-background dark:via-background dark:to-muted/30 -z-10" />
      
      {/* Floating Theme Toggle */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed top-6 right-6 z-50"
      >
        <div className="backdrop-blur-xl bg-background/30 rounded-full p-1 border border-border/50 shadow-xl">
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Left Side - Branding & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative items-center justify-center overflow-hidden bg-linear-to-br from-orange-50 via-red-50 to-pink-50 dark:from-primary/10 dark:via-purple-500/10 dark:to-pink-500/10">
        {/* Animated floating orbs - different opacity for light/dark modes */}
        <FloatingOrb delay={0} duration={25} className="w-96 h-96 bg-orange-400/20 dark:bg-primary/30 top-20 -left-20" />
        <FloatingOrb delay={5} duration={30} className="w-80 h-80 bg-red-400/20 dark:bg-purple-500/30 bottom-32 right-10" />
        <FloatingOrb delay={10} duration={35} className="w-72 h-72 bg-pink-400/20 dark:bg-pink-500/30 top-1/2 left-1/3" />
        
        {/* Grid overlay - lighter for light mode */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 px-12 xl:px-16 max-w-xl"
        >
          {/* Logo */}
          <motion.div 
            className="mb-12"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-background/90 dark:bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <Logo className="h-10 w-auto" />
            </div>
          </motion.div>

          {/* Welcome text */}
          <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight bg-linear-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-foreground dark:via-foreground dark:to-foreground/60 bg-clip-text text-transparent">
            Welcome back to <span className="bg-linear-to-r from-orange-600 via-red-600 to-pink-600 dark:from-primary dark:via-purple-500 dark:to-pink-500 bg-clip-text text-transparent">Flexoraa</span>
          </h1>
          <p className="text-lg xl:text-xl text-gray-700 dark:text-muted-foreground mb-12 leading-relaxed">
            Your intelligent automation platform. Streamline workflows, boost productivity, and unlock the power of AI-driven insights.
          </p>
          
          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Sparkles, title: "AI-Powered", desc: "Smart automation at your fingertips" },
              { icon: Zap, title: "Lightning Fast", desc: "Optimized for peak performance" },
              { icon: ShieldCheck, title: "Secure", desc: "Enterprise-grade security" },
              { icon: ArrowRight, title: "Seamless", desc: "Effortless integration" },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-pink-500/10  dark:from-primary/10 dark:to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/70 dark:bg-background/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/50 dark:border-border/50 shadow-lg group-hover:shadow-2xl group-hover:border-orange-500/30 dark:group-hover:border-primary/30 transition-all duration-300">
                  <feature.icon className="h-6 w-6 mb-3 text-orange-600 dark:text-primary" />
                  <h3 className="font-semibold text-base mb-1.5 text-gray-900 dark:text-foreground">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        {/* Subtle gradient orbs for mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-20 w-72 h-72 bg-orange-400/10 dark:bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -left-20 w-80 h-80 bg-pink-400/10 dark:bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl">
                <Logo className="h-8 w-auto" />
              </div>
            </motion.div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 bg-linear-to-r from-gray-900 to-gray-700 dark:from-foreground dark:to-foreground/70 bg-clip-text text-transparent">
                Sign in to your account
              </h2>
              <p className="text-gray-600 dark:text-muted-foreground text-base">
                Enter your credentials to access your workspace
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Email Input */}
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <motion.div 
                className="relative group"
                animate={{ scale: emailFocused ? 1.01 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-orange-500/20 to-pink-500/20 dark:from-primary/20 dark:to-purple-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${emailFocused ? 'opacity-70' : ''}`} />
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${emailFocused ? 'text-orange-600 dark:text-primary' : 'text-gray-500 dark:text-muted-foreground'}`} />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-12 h-13 bg-white/70 dark:bg-background/50 backdrop-blur-sm border-gray-200 dark:border-border/50 focus:border-orange-500 dark:focus:border-primary/50 focus:bg-white dark:focus:bg-background/80 transition-all duration-300 text-base rounded-xl shadow-sm"
                    required 
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </div>
              </motion.div>
            </div>
            
            {/* Password Input */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-primary dark:hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <motion.div 
                className="relative group"
                animate={{ scale: passwordFocused ? 1.01 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`absolute inset-0 rounded-xl bg-linear-to-r from-orange-500/20 to-pink-500/20 dark:from-primary/20 dark:to-purple-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${passwordFocused ? 'opacity-70' : ''}`} />
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${passwordFocused ? 'text-orange-600 dark:text-primary' : 'text-gray-500 dark:text-muted-foreground'}`} />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-12 h-13 bg-white/70 dark:bg-background/50 backdrop-blur-sm border-gray-200 dark:border-border/50 focus:border-orange-500 dark:focus:border-primary/50 focus:bg-white dark:focus:bg-background/80 transition-all duration-300 text-base rounded-xl shadow-sm"
                    required 
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </div>
              </motion.div>
            </div>

            {/* Quick Login Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                className="w-full h-14 text-base font-semibold bg-linear-to-r from-orange-600 via-red-600 to-pink-600 dark:from-primary dark:via-purple-600 dark:to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 dark:hover:from-primary/90 dark:hover:via-purple-600/90 dark:hover:to-pink-600/90 shadow-xl shadow-orange-500/30 dark:shadow-primary/30 transition-all duration-300 rounded-xl relative overflow-hidden group" 
                onClick={handleQuickLogin} 
                disabled={isAutoRegistering || !email || !password}
              >
                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isAutoRegistering ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Setting up your account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 ">
                    Quick Login & Connect Meta 
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </motion.div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-gray-600 dark:text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { onClick: handleLoginWithGoogle, icon: GoogleIcon, label: "Google" },
                { onClick: handleLoginWithFacebook, icon: FacebookIcon, label: "Facebook" },
              ].map((social, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    className="h-12 hover:bg-gray-100 dark:hover:bg-muted/70 hover:border-orange-500/30 dark:hover:border-primary/30 transition-all duration-300 rounded-xl backdrop-blur-sm bg-white/70 dark:bg-background/50 shadow-sm border-gray-200 dark:border-border" 
                    onClick={social.onClick}
                  >
                    <social.icon className="mr-2 h-5 w-5" />
                    <span className="font-medium">{social.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* WhatsApp Login Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { route: '/auth/whatsapp-login', icon: MessageCircle, label: "WhatsApp" },
                { route: '/auth/whatsapp-qr-login', icon: QrCode, label: "QR Code" },
              ].map((option, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    className="h-12 hover:bg-gray-100 dark:hover:bg-muted/70 hover:border-green-500/30 transition-all duration-300 rounded-xl backdrop-blur-sm bg-white/70 dark:bg-background/50 shadow-sm group border-gray-200 dark:border-border" 
                    onClick={() => router.push(option.route)}
                  >
                    <option.icon className="mr-2 h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Standard Email Login */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button 
                variant="ghost" 
                className="w-full h-12 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground  hover:bg-gray-100 dark:hover:bg-muted/50 transition-all duration-300 rounded-xl" 
                onClick={handleLogin} 
                disabled={loading === 'pending'}
              >
                {loading === 'pending' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                    Signing in...
                  </span>
                ) : (
                  "Sign in with Email & Password"
                )}
              </Button>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-4 rounded-xl bg-red-50 dark:bg-red-500/20 backdrop-blur-sm border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm text-center font-medium shadow-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Sign Up Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-gray-600 dark:text-muted-foreground pt-4"
            >
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-orange-600 hover:text-orange-700 dark:text-primary dark:hover:text-primary/80 hover:underline font-semibold transition-colors inline-flex items-center gap-1 group"
              >
                Create an account
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
