import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  BookOpen,
  School,
  Moon,
  Sun
} from 'lucide-react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

type AuthView = 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT' | 'RESET';

const Login: React.FC = () => {
  const [view, setView] = useState<AuthView>('LOGIN');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // OTP State
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot/Reset State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { login, isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("Login Redirect Check:", { isAuthenticated, isLoading });

      if (hasAnyRole(['SUPERADMIN', 'ADMIN', 'EDITOR', 'MODULE_EDITOR', 'PROGRAM_EDITOR', 'ABOUT_US_EDITOR'])) {
        console.log("Redirecting to /dashboard");
        navigate('/dashboard');
      } else {
        console.log("Redirecting to / (Landing Page) - Roles mismatch");
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoading, hasAnyRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt started", { username, passwordLength: password.length });

    if (!username.trim() || !password.trim()) {
      console.log("Login failed: missing credentials");
      return;
    }

    setIsSubmitting(true);
    console.log("Calling login API...");
    const success = await login(username, password);
    console.log("Login API result:", success);
    setIsSubmitting(false);

    if (success) {
      console.log("Login successful, navigation should happen via useEffect");
    } else {
      console.log("Login returned false");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register attempt started", { regUsername, regEmail });

    if (!regUsername || !regEmail || !regPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Calling register API...");
      const response = await authApi.register({
        username: regUsername,
        email: regEmail,
        password: regPassword
      });
      console.log("Register API success:", response);

      toast.success("Account created successfully", {
        description: "Please check your email for the verification code."
      });
      console.log("Setting view to OTP");
      setView('OTP');
    } catch (error: any) {
      console.error("Register error:", error);

      // SHOW USER THE EXACT ERROR
      const errorMsg = error.response?.data?.message || error.message;
      const status = error.response?.status;

      if (typeof error.response?.data === 'string' && error.response.data.includes('<!doctype html>')) {
        alert("CRITICAL ERROR: The API returned HTML instead of JSON. This usually means the Backend URL is wrong or the endpoint is 404. Check console.");
      } else {
        alert(`Registration Failed: [${status}] ${errorMsg}`);
      }

      toast.error("Registration failed", {
        description: errorMsg || "Something went wrong"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await authApi.forgotPassword(forgotEmail);
      toast.success(res || "OTP sent to your email", {
        description: "Check your inbox for the reset code"
      });
      setView('RESET');
    } catch (error: any) {
      console.error(error);
      toast.error("Request failed", {
        description: error.response?.data?.message || "Could not send OTP"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await authApi.resetPassword({
        email: forgotEmail,
        otp: resetOtp,
        newPassword: newPassword
      });
      toast.success("Password Reset Successful", {
        description: "You can now login with your new password"
      });
      setView('LOGIN');
      setPassword('');
    } catch (error: any) {
      console.error(error);
      toast.error("Reset failed", {
        description: error.response?.data?.message || "Invalid OTP or Server Error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const isValid = await authApi.validateOtp(regEmail, otp, 'REGISTRATION');

      if (isValid) {
        toast.success("Account verified", {
          description: "You can now login with your credentials."
        });
        setView('LOGIN');
        setUsername(regUsername); // Pre-fill login
        setOtp('');
      } else {
        toast.error("Invalid Code", {
          description: "The code you entered is invalid or expired."
        });
      }
    } catch (error: any) {
      toast.error("Verification failed", {
        description: "Something went wrong during verification."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Theme Toggle - Absolute Position */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 backdrop-blur-sm"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
        </Button>
      </div>

      {/* Left side - Institutional Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-slate-900 border-r border-slate-800">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" className="text-white" />
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 backdrop-blur-sm">
                <School className="h-8 w-8 text-amber-500" />
              </div>
              <span className="font-serif text-2xl tracking-wide text-amber-500">UCM Portal</span>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <h1 className="font-serif text-5xl leading-tight text-slate-50">
              Empowering the Next Generation of <span className="text-amber-500">Leaders</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Access your comprehensive academic dashboard. Manage courses, track requests, and stay connected with the Universal College of Management ecosystem.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <span>Academic Resources</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <GraduationCap className="h-4 w-4 text-amber-500" />
                <span>Student Support</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-600">
            &copy; 2024 Universal College of Management. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          {/* Mobile Logo for small screens */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="p-3 bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-800">
              <School className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          {view === 'LOGIN' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-serif">Student & Staff Login</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter your institutional credentials to proceed
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-600 dark:text-slate-300">Username or ID</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jdoe123"
                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-600 dark:text-slate-300">Password</Label>
                    <a
                      href="#"
                      className="text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400"
                      onClick={(e) => { e.preventDefault(); setView('FORGOT'); }}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500 pr-10"
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In to Portal
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">New to UCM?</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                onClick={() => setView('REGISTER')}
                disabled={isSubmitting}
              >
                Activate Student Account
              </Button>
            </div>
          )}

          {view === 'REGISTER' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={() => setView('LOGIN')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-serif">Account Activation</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Register your account to access portal features
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <Label htmlFor="reg-username" className="text-slate-600 dark:text-slate-300">Choose Username</Label>
                  <Input
                    id="reg-username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Username"
                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-slate-600 dark:text-slate-300">Institutional Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@student.ucm.edu"
                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-slate-600 dark:text-slate-300">Create Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Account
                </Button>
              </form>
            </div>
          )}

          {view === 'OTP' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={() => setView('REGISTER')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 mb-2">
                  <Mail className="h-6 w-6 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-serif">Verify Email</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We've sent a 6-digit code to <br /> <span className="font-medium text-slate-900 dark:text-slate-200">{regEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-600 dark:text-slate-300 text-center block">Enter Verification Code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    maxLength={6}
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium shadow-md transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Login
                </Button>
              </form>
            </div>
          )}

          {view === 'FORGOT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={() => setView('LOGIN')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
                </Button>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-serif">Reset Password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter your email to receive a reset code
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-600 dark:text-slate-300">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@student.ucm.edu"
                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium shadow-md transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Code
                </Button>
              </form>
            </div>
          )}

          {view === 'RESET' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-serif">New Password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the code sent to {forgotEmail} and your new password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-otp" className="text-slate-600 dark:text-slate-300">Reset Code</Label>
                  <Input
                    id="reset-otp"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="000000"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    maxLength={6}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-600 dark:text-slate-300">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-amber-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium shadow-md transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
