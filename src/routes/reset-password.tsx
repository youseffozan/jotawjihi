import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور — جو توجيهي" },
      { name: "description", content: "قم بتعيين كلمة مرور جديدة لحسابك في جو توجيهي." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery link (session set from URL hash).
    // Ensure a recovery/session exists before allowing password update.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("كلمة المرور قصيرة جداً");
    if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("تم تحديث كلمة المرور بنجاح");
      navigate({ to: "/" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-xl shadow-primary/20">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-black">تعيين كلمة مرور جديدة</h1>
            <p className="mt-2 text-sm text-muted-foreground">أدخل كلمة المرور الجديدة الخاصة بحسابك.</p>
          </div>

          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
                <PasswordInput id="confirm" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} className="mt-1.5" required />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ كلمة المرور
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              رابط إعادة التعيين غير صالح أو منتهي.{" "}
              <Link to="/auth" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
