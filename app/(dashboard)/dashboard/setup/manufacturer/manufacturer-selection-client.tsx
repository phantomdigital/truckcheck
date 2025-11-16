"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Check } from "lucide-react"
import Image from "next/image"

interface Manufacturer {
  id: string
  name: string
  description: string
  logo?: string // Path to logo image
  available: boolean
}

const MANUFACTURERS: Manufacturer[] = [
  {
    id: "isuzu",
    name: "Isuzu",
    description: "Leading Japanese truck manufacturer",
    logo: "/TRUCKCHECK_LOGO.png", // Placeholder - would be Isuzu logo
    available: true,
  },
  {
    id: "fuso",
    name: "Fuso",
    description: "Mitsubishi Fuso heavy-duty trucks",
    logo: "/TRUCKCHECK_LOGO.png", // Placeholder - would be Fuso logo
    available: true,
  },
  // Future manufacturers can be added here
  // {
  //   id: "hino",
  //   name: "Hino",
  //   description: "Premium Japanese commercial vehicles",
  //   available: false,
  // },
]

export function ManufacturerSelectionClient() {
  const router = useRouter()
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null)

  const handleContinue = () => {
    if (selectedManufacturer) {
      router.push(`/dashboard/setup/model?manufacturer=${selectedManufacturer}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Manufacturer Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MANUFACTURERS.map((manufacturer) => {
          const isSelected = selectedManufacturer === manufacturer.id
          const isDisabled = !manufacturer.available

          return (
            <Card
              key={manufacturer.id}
              className={`cursor-pointer transition-all ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => !isDisabled && setSelectedManufacturer(manufacturer.id)}
            >
              <CardHeader>
                <div className="flex flex-col items-center gap-4 text-center">
                  {/* Logo */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-white p-4">
                    {manufacturer.logo ? (
                      <Image
                        src={manufacturer.logo}
                        alt={`${manufacturer.name} logo`}
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">
                        {manufacturer.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name and selection indicator */}
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-center gap-2">
                      <CardTitle className="text-2xl">{manufacturer.name}</CardTitle>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <CardDescription>{manufacturer.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!manufacturer.available && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Can't find your brand?</strong> More manufacturers will be added soon. 
          Currently supporting Isuzu and Fuso models.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={() => router.back()}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedManufacturer}
          className="gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

