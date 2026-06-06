import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Toaster } from "sonner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-[72px]">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/30 pb-20 lg:pb-0">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
      <BottomNav />
    </div>
  )
}
