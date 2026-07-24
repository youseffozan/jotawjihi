import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-base font-bold">جو توجيهي</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            منصّة الامتحانات الإلكترونية الأولى للطلبة الأردنيين. للصفين الأول ثانوي والثاني ثانوي.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">المنصّة</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/grade-11">الأول ثانوي</Link></li>
            <li><Link to="/grade-12">التوجيهي</Link></li>
            <li><Link to="/pricing">الاشتراكات</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">الموارد</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/leaderboard">لوحة الصدارة</Link></li>
            <li><Link to="/auth">تسجيل الدخول</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">تواصل معنا</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>info@tawjihi.jo</li>
            <li>عمّان — الأردن</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © 2026 جو توجيهي. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
