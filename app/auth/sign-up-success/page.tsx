import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const params = await searchParams
  const hasCheckoutIntent = params?.checkout === "true"

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
                {hasCheckoutIntent && (
                  <>
                    <br />
                    <br />
                    <span className="font-medium text-foreground">
                      After confirming your email, you&apos;ll be redirected to
                      complete your Pro upgrade.
                    </span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

