import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Heart, MessageCircle, Flag, Loader2, Image as ImageIcon, Trash2, Crown, GraduationCap, UserPlus, UserMinus } from "lucide-react";
import { getInitials } from "@/lib/display-name";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "منشورات المعلمين — جو توجيهي" },
      { name: "description", content: "تابع منشورات معلميك، اطرح أسئلتك، وتفاعل مع المجتمع التعليمي." },
      { property: "og:title", content: "منشورات المعلمين — جو توجيهي" },
      { property: "og:description", content: "منصة تفاعلية بين المعلمين والطلاب." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FeedPage,
});

type Post = {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_hidden: boolean;
  author?: { first_name: string | null; last_name: string | null; full_name: string | null; avatar_url: string | null };
  role?: "admin" | "teacher" | "student";
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
};

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  author?: { first_name: string | null; last_name: string | null; full_name: string | null };
  role?: "admin" | "teacher" | "student";
};

function displayName(p?: { first_name: string | null; last_name: string | null; full_name: string | null } | null) {
  if (!p) return "مستخدم";
  const composed = [p.first_name, p.last_name].filter(Boolean).join(" ");
  return composed || p.full_name || "مستخدم";
}

function FeedPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const canPost = isAdmin || isTeacher;

  const load = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("teacher_posts")
      .select("id, author_id, content, image_url, created_at, is_hidden")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(100);
    const list = (rows ?? []) as Post[];
    const authorIds = [...new Set(list.map((p) => p.author_id))];
    if (authorIds.length) {
      const [{ data: profs }, { data: rolesData }, { data: likes }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, full_name, avatar_url").in("id", authorIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", authorIds),
        supabase.from("post_likes").select("post_id, user_id").in("post_id", list.map((p) => p.id)),
        supabase.from("post_comments").select("post_id, is_hidden").in("post_id", list.map((p) => p.id)),
      ]);
      const pMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const rMap = new Map<string, "admin" | "teacher" | "student">();
      for (const r of rolesData ?? []) {
        const existing = rMap.get(r.user_id);
        if (r.role === "admin" || (r.role === "teacher" && existing !== "admin")) rMap.set(r.user_id, r.role);
      }
      const likesByPost = new Map<string, string[]>();
      for (const l of likes ?? []) {
        const arr = likesByPost.get(l.post_id) ?? [];
        arr.push(l.user_id);
        likesByPost.set(l.post_id, arr);
      }
      const commentsByPost = new Map<string, number>();
      for (const c of comments ?? []) {
        if (c.is_hidden) continue;
        commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) ?? 0) + 1);
      }
      for (const p of list) {
        p.author = pMap.get(p.author_id) ?? undefined;
        p.role = rMap.get(p.author_id) ?? "student";
        const lArr = likesByPost.get(p.id) ?? [];
        p.like_count = lArr.length;
        p.liked_by_me = !!user && lArr.includes(user.id);
        p.comment_count = commentsByPost.get(p.id) ?? 0;
      }
    }
    setPosts(list);
    if (user) {
      const { data: f } = await supabase.from("follows").select("followed_id").eq("follower_id", user.id);
      setFollowed(new Set((f ?? []).map((x) => x.followed_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const submit = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("teacher-media").upload(path, imageFile, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("teacher-media").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
      const { error } = await supabase.from("teacher_posts").insert({ author_id: user.id, content: content.trim(), image_url });
      if (error) throw error;
      setContent("");
      setImageFile(null);
      toast.success("تم النشر");
      load();
    } catch (err) {
      const m = err instanceof Error ? err.message : "خطأ";
      toast.error(m);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: Post) => {
    if (!user) return toast.error("سجّل الدخول أولاً");
    if (post.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    }
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) } : p));
  };

  const toggleFollow = async (targetId: string) => {
    if (!user) return toast.error("سجّل الدخول أولاً");
    if (followed.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("followed_id", targetId);
      setFollowed((s) => { const n = new Set(s); n.delete(targetId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, followed_id: targetId });
      setFollowed((s) => new Set(s).add(targetId));
    }
  };

  const report = async (targetType: "post" | "comment", targetId: string) => {
    if (!user) return toast.error("سجّل الدخول أولاً");
    const reason = prompt("سبب الإبلاغ (اختياري):") ?? "";
    const { error } = await supabase.from("moderation_reports").insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason: reason || null });
    if (error) return toast.error(error.message);
    toast.success("تم إرسال الإبلاغ");
  };

  const removePost = async (id: string) => {
    if (!confirm("حذف المنشور؟")) return;
    const { error } = await supabase.from("teacher_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black">منشورات المعلمين</h1>
          <p className="mt-1 text-sm text-muted-foreground">تابع أحدث الشروحات والنصائح من المعلمين.</p>
        </div>

        {canPost && (
          <div className="mb-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <Textarea placeholder="اكتب منشوراً..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{imageFile ? imageFile.name : "إرفاق صورة"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              </label>
              <Button onClick={submit} disabled={posting || !content.trim()}>
                {posting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} نشر
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            لا توجد منشورات بعد.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={user?.id ?? null}
                isAdmin={isAdmin}
                followed={followed.has(p.author_id)}
                onLike={() => toggleLike(p)}
                onFollow={() => toggleFollow(p.author_id)}
                onReport={() => report("post", p.id)}
                onDelete={() => removePost(p.id)}
                onReportComment={(cid) => report("comment", cid)}
              />
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function PostCard({ post, currentUserId, isAdmin, followed, onLike, onFollow, onReport, onDelete, onReportComment }: {
  post: Post; currentUserId: string | null; isAdmin: boolean; followed: boolean;
  onLike: () => void; onFollow: () => void; onReport: () => void; onDelete: () => void; onReportComment: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loadingC, setLoadingC] = useState(false);

  const name = displayName(post.author);
  const initials = getInitials(name);
  const roleBadge = post.role === "admin" ? { icon: Crown, cls: "text-amber-500", label: "المشرف" }
    : post.role === "teacher" ? { icon: GraduationCap, cls: "text-primary", label: "معلّم" } : null;

  const loadComments = async () => {
    setLoadingC(true);
    const { data } = await supabase
      .from("post_comments")
      .select("id, post_id, author_id, content, created_at, is_hidden")
      .eq("post_id", post.id).eq("is_hidden", false)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Comment[];
    const ids = [...new Set(list.map((c) => c.author_id))];
    if (ids.length) {
      const [{ data: profs }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, full_name").in("id", ids),
        supabase.from("user_roles").select("user_id, role").in("user_id", ids),
      ]);
      const pMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const rMap = new Map<string, "admin" | "teacher" | "student">();
      for (const r of rolesData ?? []) {
        const existing = rMap.get(r.user_id);
        if (r.role === "admin" || (r.role === "teacher" && existing !== "admin")) rMap.set(r.user_id, r.role);
      }
      for (const c of list) { c.author = pMap.get(c.author_id) ?? undefined; c.role = rMap.get(c.author_id) ?? "student"; }
    }
    setComments(list);
    setLoadingC(false);
  };

  useEffect(() => { if (open) loadComments(); }, [open]);

  const submitComment = async () => {
    if (!currentUserId || !text.trim()) return;
    const { error } = await supabase.from("post_comments").insert({ post_id: post.id, author_id: currentUserId, content: text.trim() });
    if (error) return toast.error(error.message);
    setText("");
    loadComments();
  };

  const deleteComment = async (id: string) => {
    if (!confirm("حذف التعليق؟")) return;
    await supabase.from("post_comments").delete().eq("id", id);
    loadComments();
  };

  const canDelete = isAdmin || currentUserId === post.author_id;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Link to="/profile/$userId" params={{ userId: post.author_id }} className="shrink-0">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-black text-primary-foreground">
            {initials.toUpperCase()}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/profile/$userId" params={{ userId: post.author_id }} className="font-bold hover:underline">{name}</Link>
            {roleBadge && (
              <span className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs ${roleBadge.cls}`}>
                <roleBadge.icon className="h-3 w-3" /> {roleBadge.label}
              </span>
            )}
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString("ar-EG")}</span>
            {currentUserId && currentUserId !== post.author_id && (
              <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-xs" onClick={onFollow}>
                {followed ? <><UserMinus className="ml-1 h-3 w-3" /> إلغاء المتابعة</> : <><UserPlus className="ml-1 h-3 w-3" /> متابعة</>}
              </Button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
          {post.image_url && (
            <img src={post.image_url} alt="" className="mt-3 max-h-96 w-full rounded-xl object-cover" loading="lazy" />
          )}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <button onClick={onLike} className={`inline-flex items-center gap-1 transition ${post.liked_by_me ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
              <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} /> {post.like_count}
            </button>
            <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
              <MessageCircle className="h-4 w-4" /> {post.comment_count}
            </button>
            <button onClick={onReport} className="mr-auto inline-flex items-center gap-1 text-muted-foreground hover:text-amber-500" title="إبلاغ">
              <Flag className="h-4 w-4" />
            </button>
            {canDelete && (
              <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" title="حذف">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {open && (
            <div className="mt-4 space-y-3 border-t border-border/40 pt-3">
              {loadingC ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground">لا توجد تعليقات بعد.</p>
              ) : comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Link to="/profile/$userId" params={{ userId: c.author_id }} className="font-semibold hover:underline">{displayName(c.author)}</Link>
                      {c.role === "admin" && <Crown className="h-3 w-3 text-amber-500" />}
                      {c.role === "teacher" && <GraduationCap className="h-3 w-3 text-primary" />}
                      <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString("ar-EG")}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <button onClick={() => onReportComment(c.id)} className="text-muted-foreground hover:text-amber-500" title="إبلاغ"><Flag className="h-3.5 w-3.5" /></button>
                  {(isAdmin || currentUserId === c.author_id) && (
                    <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive" title="حذف"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ))}

              {currentUserId ? (
                <div className="flex gap-2">
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="اكتب تعليقاً..." className="min-h-9 flex-1" />
                  <Button size="sm" onClick={submitComment} disabled={!text.trim()}>إرسال</Button>
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  <Link to="/auth" className="text-primary hover:underline">سجّل الدخول</Link> للتعليق
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
