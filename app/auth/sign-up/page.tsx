import { SignUpForm } from "@/components/sign-up-form"

export default function Page() {
  return (
    <div className="flex w-full justify-center pt-12 md:pt-20 pb-12 md:pb-20 px-6 md:px-8">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}

