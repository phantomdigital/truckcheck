import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params?.error

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-2xl">
                  Authentication Error
                </CardTitle>
              </div>
              <CardDescription>
                {errorMessage || "An error occurred during authentication"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-md bg-muted text-sm">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  What you can do:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Request a new confirmation email if the link expired</li>
                  <li>Check that you're using the most recent email link</li>
                  <li>Try signing up or logging in again</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="default" className="w-full">
                  <Link href="/auth/login">
                    Go to Login
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/sign-up">
                    Sign Up Again
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

