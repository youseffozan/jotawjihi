import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { useState } from "react";
import { GraduationCap, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

const FIELD_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "medical", label: "الحقل الصحّي / الطبي" },
  { id: "engineering", label: "الحقل الهندسي" },
  { id: "science-tech", label: "العلوم والتكنولوجيا" },
  { id: "business", label: "الأعمال" },
  { id: "languages", label: "اللغات والعلوم الاجتماعية" },
  { id: "law", label: "القانون والعلوم الشرعية" },
];

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initial ?? "login");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<"11" | "12" | "">("");
  const [field, setField] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!firstName.trim()) { setLoading(false); return toast.error("يرجى إدخال الاسم الأول"); }
        if (!grade) { setLoading(false); return toast.error("يرجى اختيار الصف الدراسي"); }
        if (grade === "12" && !field) { setLoading(false); return toast.error("يرجى اختيار الحقل الأكاديمي"); }

        const full_name = [firstName, fatherName, lastName].map((s) => s.trim()).filter(Boolean).join(" ");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name,
              first_name: firstName.trim(),
              father_name: fatherName.trim() || null,
              last_name: lastName.trim() || null,
              grade,
              field: grade === "12" ? field : null,
            },
          },
        });
        if (error) throw error;
        // If email confirmation is required, session is null and user.identities may be empty.
        const needsConfirm = !data.session;
        if (needsConfirm) {
          setPendingConfirm(true);
          toast.success("تم إرسال رابط تفعيل إلى بريدك الإلكتروني");
        } else {
          toast.success("تم إنشاء الحساب بنجاح!");
          navigate({ to: "/" });
        }
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

  if (pendingConfirm) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-black">تحقّق من بريدك الإلكتروني</h1>
          <p className="mt-3 text-muted-foreground">
            تم إرسال رابط تفعيل إلى <span className="font-semibold">{email}</span>.
            يرجى فتح البريد وتفعيل حسابك للمتابعة.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">لم تجد الرسالة؟ تحقّق من مجلد الرسائل غير المرغوب فيها (Spam).</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setPendingConfirm(false); setMode("login"); }}>
              العودة لتسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            سجل دخولك للوصول لجميع الامتحانات المحاكية والدروس التفاعلية. الحساب مجاني بالكامل.
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
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="firstName">الاسم الأول</Label>
                    <Input id="firstName" placeholder="محمد" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="fatherName">اسم الأب <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
                    <Input id="fatherName" placeholder="أحمد" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">اسم العائلة</Label>
                    <Input id="lastName" placeholder="العلي" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="grade">الصف الدراسي</Label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => { setGrade(e.target.value as "11" | "12" | ""); if (e.target.value !== "12") setField(""); }}
                    className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  >
                    <option value="">اختر الصف</option>
                    <option value="11">الأول ثانوي (الحادي عشر)</option>
                    <option value="12">الثاني ثانوي (التوجيهي)</option>
                  </select>
                </div>
                {grade === "12" && (
                  <div>
                    <Label htmlFor="field">الحقل الأكاديمي</Label>
                    <select
                      id="field"
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    >
                      <option value="">اختر الحقل</option>
                      {FIELD_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}
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
