import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface AuthPageProps {
  onLogin: (email: string, isAdmin: boolean) => void;
  onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function AuthPage({ onLogin, onClose }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginData.email || !loginData.password) {
      setLoginError("Please provide both email and password.");
      return;
    }

    setIsLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to sign in.");
      }

      onLogin(payload.user.email, payload.user.role === "admin");
      setLoginData({ email: "", password: "" });
      onClose();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!registerData.fullName || !registerData.email || !registerData.password) {
      setRegisterError("Please complete every field.");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    setIsRegisterLoading(true);
    setRegisterError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: registerData.fullName,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to create account.");
      }

      onLogin(payload.user.email, payload.user.role === "admin");
      setRegisterData({ fullName: "", email: "", password: "", confirmPassword: "" });
      onClose();
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <motion.div
        className="absolute top-0 left-0 h-80 w-80 rounded-full bg-blue-300 opacity-30 blur-3xl"
        animate={{ x: [0, 120, 0], y: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-300 opacity-30 blur-3xl"
        animate={{ x: [0, -120, 0], y: [0, -60, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl"
          >
            <ShoppingBag className="h-10 w-10" />
          </motion.div>
          <h1 className="text-4xl font-semibold text-slate-900">TechStore</h1>
          <p className="mt-2 text-slate-500">Sign in or create an account to continue shopping.</p>
        </div>

        <Card className="bg-white/90 p-6 shadow-2xl backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      className="pl-10 pr-10"
                      value={loginData.password}
                      onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    Remember me
                  </label>
                  <button type="button" className="text-blue-600 hover:underline">
                    Forgot password?
                  </button>
                </div>

                {loginError && <p className="text-sm text-red-500">{loginError}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={isLoginLoading}>
                  {isLoginLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Nguyen Van A"
                      className="pl-10"
                      value={registerData.fullName}
                      onChange={(event) =>
                        setRegisterData({ ...registerData, fullName: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={registerData.email}
                      onChange={(event) =>
                        setRegisterData({ ...registerData, email: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      className="pl-10 pr-10"
                      value={registerData.password}
                      onChange={(event) =>
                        setRegisterData({ ...registerData, password: event.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirm password</Label>
                  <Input
                    id="register-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={registerData.confirmPassword}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, confirmPassword: event.target.value })
                    }
                  />
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded" required />
                  <span>
                    I agree to the{" "}
                    <a className="text-blue-600 hover:underline" href="#">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a className="text-blue-600 hover:underline" href="#">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </div>

                {registerError && <p className="text-sm text-red-500">{registerError}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={isRegisterLoading}>
                  {isRegisterLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onClose}>
            ← Back to storefront
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
