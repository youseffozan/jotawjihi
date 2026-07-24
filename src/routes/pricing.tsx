import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "الاشتراكات — جو توجيهي" },
      { name: "description", content: "خطط اشتراك مرنة لكل طالب أردني: مجاني، شهري، وسنوي." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "مجاني", nameEn: "Free", price: "0", period: "دائماً",
    features: ["الوصول لعينة من الامتحانات", "تصحيح فوري", "لوحة الصدارة العامة", "دعم عبر البريد"],
    cta: "ابدأ مجاناً", highlight: false,
  },
  {
    name: "بريميوم شهري", nameEn: "Premium Monthly", price: "9.99", period: "دينار / شهر",
    features: ["جميع الامتحانات", "تحليل أداء متقدم", "شرح تفصيلي للأسئلة", "بنك أسئلة كامل", "دعم أولوية"],
    cta: "اشترك الآن", highlight: true,
  },
  {
    name: "سنوي كامل", nameEn: "Full Year Access", price: "79.99", period: "دينار / سنة",
    features: ["كل مزايا البريميوم", "امتحانات محاكاة كاملة", "خطة دراسية شخصية", "جلسات مراجعة مسجلة", "شهادات إنجاز", "خصم 33%"],
    cta: "احصل على الأفضل", highlight: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" /> قريباً
          </div>
          <h2 className="mt-3 text-2xl font-black">الاشتراكات المدفوعة قيد الإطلاق</h2>
          <p className="mt-2 text-sm text-muted-foreground">تصفّح الخطط المتاحة أدناه، وسنفتح الاشتراك رسمياً قريباً. يمكنك حالياً استخدام كل الامتحانات المتوفّرة مجاناً.</p>
        </div>

        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-primary" /> اختر ما يناسبك
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">خطط اشتراك مرنة</h1>
          <p className="mt-3 text-muted-foreground">ابدأ مجاناً وترقّى حسب حاجتك</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl border p-6 ${p.highlight ? "border-primary bg-gradient-to-br from-primary/10 via-card to-card shadow-2xl shadow-primary/10 md:scale-105" : "border-border/60 bg-card"}`}>
              {p.highlight && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">الأكثر شعبية</div>
              )}
              <div className="text-sm font-semibold text-muted-foreground">{p.nameEn}</div>
              <h3 className="text-2xl font-black">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={p.highlight ? "default" : "outline"} size="lg">
                <Link to="/auth" search={{ mode: "signup" as const }}>{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
          <h3 className="font-bold">ضمان استرجاع خلال 7 أيام</h3>
          <p className="mt-1 text-sm text-muted-foreground">جرّب المنصّة بدون مخاطر. إذا لم تعجبك، نعيد لك كامل المبلغ.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
