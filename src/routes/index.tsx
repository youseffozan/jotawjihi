import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GraduationCap, BookOpen, ChevronDown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDisplayName } from "@/lib/display-name";
import { grade12Fields } from "@/lib/exam-data";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const { user, profile } = useAuth();
  const [tracksOpen, setTracksOpen] = useState(false);
  const displayName = formatDisplayName({ first_name: profile?.first_name, last_name: profile?.last_name, full_name: profile?.full_name, email: user?.email });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="relative overflow-hidden py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              {user ? <>أهلاً بك، <span className="text-shimmer">{displayName}</span></> : <>اختر صفّك، <span className="text-shimmer">وابدأ الآن</span></>}
            </h1>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Link to="/grade-11" className="facet-card group relative border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/50">
              <BookOpen className="h-10 w-10 text-primary" />
              <h2 className="mt-6 text-2xl font-bold">الأول ثانوي</h2>
              <p className="mt-2 text-sm text-muted-foreground">مباحث الصف الحادي عشر كاملة.</p>
            </Link>
            <button onClick={() => setTracksOpen(!tracksOpen)} className="facet-card group text-right border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/50">
              <GraduationCap className="h-10 w-10 text-primary" />
              <h2 className="mt-6 text-2xl font-bold">التوجيهي (Tawjihi)</h2>
              <p className="mt-2 text-sm text-muted-foreground">اختر حقلك وتابع مسارك الأكاديمي.</p>
            </button>
          </div>
          {tracksOpen && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3 rounded-2xl bg-card/50 p-6 border border-border">
              {grade12Fields.map(f => (
                <Link key={f.id} to="/grade-12/$field" params={{ field: f.id }} className="card-interactive rounded-xl border border-border bg-background p-4 hover:border-primary/50">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="mt-2 font-bold">{f.nameAr}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
