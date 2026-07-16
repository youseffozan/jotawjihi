import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SubjectHub } from "@/components/SubjectHub";
import { supabase } from "@/integrations/supabase/client";

type Subject = { id: string; name_ar: string; name_en: string | null; icon: string | null; grade: string; field: string | null; status: string };

export const Route = createFileRoute("/subject/$subjectId")({
  component: SubjectHubPage,
});

function SubjectHubPage() {
  const { subjectId } = Route.useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("subjects").select("id, name_ar, name_en, icon, grade, field, status").eq("id", subjectId).maybeSingle();
      if (!alive) return;
      if (!data) setNotFoundState(true);
      else setSubject(data as Subject);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [subjectId]);

  if (loading) {
    return <div className="min-h-screen bg-background"><SiteHeader /><div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }
  if (notFoundState || !subject) throw notFound();

  const back = subject.grade === "11"
    ? <Link to="/grade-11" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> عودة للمواد</Link>
    : subject.field
      ? <Link to="/grade-12/$field" params={{ field: subject.field }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> عودة للحقل</Link>
      : <Link to="/grade-12" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> عودة</Link>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <SubjectHub subject={subject} backHref={back} />
      <SiteFooter />
    </div>
  );
}
