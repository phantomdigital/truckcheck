import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { LoginForm } from "@/components/login-form"

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <div className="flex w-full justify-center pt-12 md:pt-20 pb-12 md:pb-20 px-6 md:px-8">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoadingState />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

