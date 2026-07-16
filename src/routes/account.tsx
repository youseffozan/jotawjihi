import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { UserCog, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "إعدادات الحساب — جو توجيهي" },
      { name: "description", content: "قم بتحديث بياناتك الشخصية والصف الدراسي وكلمة المرور." },
    ],
  }),
  component: AccountPage,
});

type ExtendedProfile = {
  first_name: string | null;
  father_name: string | null;
  last_name: string | null;
  mobile: string | null;
  full_name: string | null;
  grade: "11" | "12" | null;
  field: string | null;
  is_public: boolean | null;
};

const FIELD_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "medical", label: "الحقل الصحّي / الطبي" },
  { id: "engineering", label: "الحقل الهندسي" },
  { id: "science-tech", label: "العلوم والتكنولوجيا" },
  { id: "business", label: "الأعمال" },
  { id: "languages", label: "اللغات والعلوم الاجتماعية" },
  { id: "law", label: "القانون والعلوم الشرعية" },
];

function AccountPage() {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [grade, setGrade] = useState<"11" | "12" | "">("");
  const [field, setField] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, father_name, last_name, mobile, full_name, grade, field, is_public")
        .eq("id", user.id)
        .maybeSingle<ExtendedProfile>();
      if (data) {
        setFirstName(data.first_name ?? "");
        setFatherName(data.father_name ?? "");
        setLastName(data.last_name ?? "");
        setMobile(data.mobile ?? "");
        setGrade((data.grade as "11" | "12" | null) ?? "");
        setField(data.field ?? "");
        setIsPublic(Boolean(data.is_public));
        // Backfill from full_name if legacy account
        if (!data.first_name && !data.last_name && data.full_name) {
          const parts = data.full_name.trim().split(/\s+/);
          if (parts.length > 0) setFirstName((prev) => prev || parts[0]);
          if (parts.length > 1) setLastName((prev) => prev || parts[parts.length - 1]);
        }
      }
    })();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!grade) return toast.error("يرجى اختيار الصف الدراسي");
    if (grade === "12" && !field) return toast.error("يرجى اختيار الحقل الأكاديمي");
    if (!firstName.trim()) return toast.error("يرجى إدخال الاسم الأول");
    if (mobile && !/^[0-9+\-\s]{7,20}$/.test(mobile.trim())) {
      return toast.error("رقم الجوال غير صالح");
    }
    setSaving(true);
    try {
      const composedFullName = [firstName, fatherName, lastName]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ");
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim() || null,
          father_name: fatherName.trim() || null,
          last_name: lastName.trim() || null,
          mobile: mobile.trim() || null,
          full_name: composedFullName || null,
          grade,
          field: grade === "12" ? field : null,
          is_public: isPublic,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("تم تحديث بياناتك بنجاح");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (newPassword !== confirmPassword) return toast.error("كلمتا المرور غير متطابقتين");
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("تم تحديث كلمة المرور");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast.error(message);
    } finally {
      setChangingPw(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">إعدادات الحساب</h1>
            <p className="text-sm text-muted-foreground">حدّث بياناتك الشخصية وصفّك الدراسي وكلمة المرور.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 rounded-3xl border border-border/60 bg-card p-8 shadow-lg">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" value={user.email ?? ""} disabled className="mt-1.5 opacity-70" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input id="firstName" placeholder="محمد" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="fatherName">اسم الأب</Label>
              <Input id="fatherName" placeholder="أحمد" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input id="lastName" placeholder="العلي" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="mobile">رقم الجوال</Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="tel"
              placeholder="07XXXXXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1.5"
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="grade">الصف الدراسي</Label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => { const v = e.target.value as "11" | "12" | ""; setGrade(v); if (v !== "12") setField(""); }}
              className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">اختر الصف</option>
              <option value="11">الأول ثانوي (الحادي عشر)</option>
              <option value="12">الثاني ثانوي (التوجيهي)</option>
            </select>
            <p className="mt-2 text-xs text-muted-foreground">تغيير الصف يُحدّث الامتحانات المعروضة لك مباشرة.</p>
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

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input"
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold">إظهار بروفايلي العام للآخرين</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  عند تفعيل هذا الخيار، يمكن للآخرين رؤية اسمك ونتائجك في البروفايل العام ولوحة الصدارة.
                  بخلاف ذلك يظهر اسمك بشكل مختصر أو مجهول للحفاظ على خصوصيتك.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">إلغاء</Link>
            </Button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="mt-8 space-y-5 rounded-3xl border border-border/60 bg-card p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تغيير كلمة المرور</h2>
              <p className="text-xs text-muted-foreground">اختر كلمة مرور قوية لا تقل عن 6 أحرف.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <div className="relative mt-1.5">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute inset-y-0 left-2 grid place-items-center text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative mt-1.5">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute inset-y-0 left-2 grid place-items-center text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={changingPw || !newPassword}>
            {changingPw && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تحديث كلمة المرور
          </Button>
        </form>
      </div>
    </div>
  );
}
