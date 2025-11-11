"use client"

import { motion } from "framer-motion"
import { ReactNode, useEffect, useState } from "react"

interface AuthPageWrapperProps {
  children: ReactNode
}

export function AuthPageWrapper({ children }: AuthPageWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full justify-center pt-12 md:pt-20 pb-12 md:pb-20 px-6 md:px-8"
    >
      <div className="w-full max-w-md">
        {children}
      </div>
    </motion.div>
  )
}

