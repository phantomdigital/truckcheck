"use client"

import { createClient } from "@/lib/supabase/client"
import { captureEvent, resetUser } from "@/lib/posthog/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps = {}) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Track logout event
    if (user) {
      captureEvent("user_logged_out")
    }
    
    await supabase.auth.signOut()
    
    // Reset PostHog user identification
    resetUser()
    
    router.push("/")
    router.refresh()
  }

  return (
    <Button 
      onClick={logout} 
      variant="ghost" 
      size="sm" 
      className={cn("justify-start text-destructive hover:text-destructive hover:bg-destructive/10", className)}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
}

