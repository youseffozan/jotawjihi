import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle, Crown } from "lucide-react";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            منصّة الامتحانات الإلكترونية الأولى للطلبة الأردنيين. للصفين الأول ثانوي والثاني ثانوي.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">المنصّة</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/grade-11" className="hover:text-foreground">الأول ثانوي</Link></li>
            <li><Link to="/grade-12" className="hover:text-foreground">التوجيهي</Link></li>
            <li><Link to="/leaderboard" className="hover:text-foreground">لوحة الصدارة</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">تسجيل الدخول</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">تواصل معنا</h4>
          <div className="mt-3 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  يوسف <span aria-hidden>👑</span>
                </div>
                <div className="text-[11px] text-muted-foreground">مدير المنصّة</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> yousef@jotawjihi.com</li>
              <li className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> واتساب متاح</li>
              <li className="inline-flex items-center gap-2"><Instagram className="h-3.5 w-3.5" /> @jotawjihi</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} جو توجيهي. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
