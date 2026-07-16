import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Zap,
  Award,
  ChevronDown,
  BookMarked,
  FlaskConical,
  Factory,
  Home,
  BarChart3,
} from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { useLocalProgress } from "@/lib/local-progress";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { progress } = useLocalProgress();
  const [tracksOpen, setTracksOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');

  const features = [
    {
      icon: <CheckCircle2 className="w-8 h-8 text-primary" />,
      title: "امتحانات محاكية",
      description: "ألف سؤال مصمم حسب المناهج الأردنية",
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "تصحيح فوري",
      description: "تقييم أدائك فور انتهاءك من كل امتحان",
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "تتبع التقدم",
      description: "تابع مستواك ومقارنته مع أصدقائك والعالم",
    },
  ];

  const grade12Tracks = [
    { id: "scientific", name: "علمي", icon: <FlaskConical className="w-10 h-10 text-primary" /> },
    { id: "literary", name: "أدبي", icon: <BookMarked className="w-10 h-10 text-primary" /> },
    { id: "industrial", name: "صناعي", icon: <Factory className="w-10 h-10 text-primary" /> },
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="min-h-screen bg-background text-foreground py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-border bg-muted/30 p-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === 'home' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Home className="h-4 w-4" />
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </button>
          </div>
        </div>
        <Dashboard />
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-8 pt-8">
          <div className="inline-flex rounded-full border border-border bg-muted/30 p-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === 'home' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Home className="h-4 w-4" />
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </button>
          </div>
        </div>
      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold sm:text-6xl tracking-tight animate-fade-up">
            منصة <span className="text-shimmer">جوجي توجيهي</span> لامتحاناتك
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              كل ما تحتاجه للتفوق في الأوّل ثانوي والتوجيهي في مكان واحد
            </p>

          {/* Grade Selector */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            <Link
              to="/grade-11"
              className="facet-card group relative border border-border bg-card p-8 text-right transition-all hover:-translate-y-1 hover:border-primary/50"
            >
              <BookOpen className="h-10 w-10 text-primary" />
              <h2 className="mt-6 text-2xl font-bold">الأول ثانوي</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                  جميع المواد كاملة
                </p>
            </Link>

            <button
              onClick={() => setTracksOpen(!tracksOpen)}
              className="facet-card group text-right border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/50"
            >
              <GraduationCap className="h-10 w-10 text-primary" />
              <div className="flex items-center justify-between">
                <h2 className="mt-6 text-2xl font-bold">التوجيهي</h2>
                <ChevronDown className={`mt-6 transition-transform ${tracksOpen ? "rotate-180" : ""}`} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                  اختر فرعك الدراسي
                </p>
            </button>
          </div>

          {/* Track Selector (Grade 12) */}
          {tracksOpen && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3 rounded-2xl bg-card/50 p-6 border border-border animate-pop-in max-w-3xl mx-auto">
              {grade12Tracks.map((track) => (
                <Link
                key={track.id}
                to="/grade-12/$field"
                params={{ field: track.id }}
                className="card-interactive relative rounded-xl border border-border bg-card p-6 hover:border-primary/50"
              >
                {track.icon}
                <h3 className="mt-4 font-bold">{track.name}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                    اضغط للاستمرار
                  </p>
              </Link>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12">لماذا منصتنا؟</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, idx) => (
              <div key={idx} className="border border-border bg-card rounded-xl p-6 text-right animate-fade-up" style={{ animationDelay: `${idx * 100 + 'ms' }}>
                {feature.icon}
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
