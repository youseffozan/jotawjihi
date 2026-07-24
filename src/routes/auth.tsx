import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initial ?? "login");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<"11" | "12" | "">("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!grade) {
          setLoading(false);
          return toast.error("يرجى اختيار الصف الدراسي");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name, grade },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب بنجاح!");
        navigate({ to: "/" });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك");
        setMode("login");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isForgot = mode === "forgot";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2">
        <div className="hidden md:block">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-xl shadow-primary/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            مرحباً بك في
            <span className="block bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">جو توجيهي</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            سجل دخولك للوصول لجميع الامتحانات المحاكية والدروس التفاعلية. الحساب مجاني والاشتراك اختياري.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
          {!isForgot && (
            <div className="mb-6 flex gap-2 rounded-lg bg-muted p-1">
              <button type="button" onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === "login" ? "bg-background shadow" : "text-muted-foreground"}`}>
                تسجيل الدخول
              </button>
              <button type="button" onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === "signup" ? "bg-background shadow" : "text-muted-foreground"}`}>
                إنشاء حساب
              </button>
            </div>
          )}

          {isForgot && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold">استعادة كلمة المرور</h2>
              <p className="mt-1 text-sm text-muted-foreground">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input id="name" placeholder="أدخل اسمك" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="grade">الصف الدراسي</Label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as "11" | "12" | "")}
                    className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  >
                    <option value="">اختر الصف</option>
                    <option value="11">الأول ثانوي (الحادي عشر)</option>
                    <option value="12">الثاني ثانوي (التوجيهي)</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
            </div>
            {!isForgot && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="mt-1.5" required />
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "دخول" : mode === "signup" ? "إنشاء الحساب" : "إرسال رابط الاستعادة"}
            </Button>
          </form>

          {isForgot && (
            <p className="mt-4 text-center text-xs">
              <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                ← العودة لتسجيل الدخول
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← العودة للرئيسية</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
