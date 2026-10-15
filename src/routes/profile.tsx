import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Profile — TOPTIERclub" }],
  }),
  component: Profile,
});

function Profile() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <span className="text-3xl">👤</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold">โปรไฟล์</h1>
        <p className="mt-2 text-muted-foreground">ระบบผู้ใช้กำลังมาในข้อถัดไป</p>
        <button className="mt-8 rounded-full bg-gold px-6 py-2.5 font-medium text-black">
          เข้าสู่ระบบ
        </button>
      </main>
    </div>
  );
}
