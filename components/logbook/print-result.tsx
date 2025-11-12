import { forwardRef } from "react"
import { BookCheck, BookX, MapPin, Navigation, TrendingUp } from "lucide-react"
import type { CalculationResult } from "@/lib/logbook/types"

interface PrintResultProps {
  result: CalculationResult
  mapImageUrl?: string
}

export const PrintResult = forwardRef<HTMLDivElement, PrintResultProps>(
  ({ result, mapImageUrl }, ref) => {
    return (
      <div ref={ref} className="p-8 max-w-4xl mx-auto print-document">
        <style type="text/css" media="print">{`
          @page {
            size: A4;
            margin: 15mm 20mm;
          }
          
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* Force light mode for print */
            html, body, .print-document {
              background: #ffffff !important;
              color: #1f2937 !important;
            }
            
            body {
              font-size: 11pt;
              line-height: 1.6;
              color: #1f2937 !important;
              background: #ffffff !important;
            }
            
            .print-document {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #1f2937 !important;
              background: #ffffff !important;
            }
            
            /* Typography hierarchy */
            h1 {
              font-size: 14pt;
              font-weight: 700;
              line-height: 1.2;
              margin-bottom: 4pt;
              color: #111827 !important;
              page-break-after: avoid;
            }
            
            h2 {
              font-size: 13pt;
              font-weight: 700;
              line-height: 1.3;
              margin-top: 10pt;
              margin-bottom: 6pt;
              color: #111827 !important;
              page-break-after: avoid;
            }
            
            h3 {
              font-size: 11pt;
              font-weight: 600;
              line-height: 1.4;
              margin-top: 8pt;
              margin-bottom: 5pt;
              color: #111827 !important;
              page-break-after: avoid;
            }
            
            h4 {
              font-size: 10pt;
              font-weight: 600;
              line-height: 1.4;
              margin-top: 6pt;
              margin-bottom: 4pt;
              color: #111827 !important;
            }
            
            p {
              font-size: 11pt;
              line-height: 1.6;
              margin-bottom: 8pt;
              color: #374151 !important;
            }
            
            /* Force light colors for all text elements */
            span, div, td, th {
              color: inherit !important;
            }
            
            .text-gray-900 {
              color: #111827 !important;
            }
            
            .text-gray-700 {
              color: #374151 !important;
            }
            
            .text-gray-600 {
              color: #4b5563 !important;
            }
            
            .text-gray-500 {
              color: #6b7280 !important;
            }
            
            .text-red-700 {
              color: #b91c1c !important;
            }
            
            .text-red-600 {
              color: #dc2626 !important;
            }
            
            .text-green-700 {
              color: #15803d !important;
            }
            
            .text-green-600 {
              color: #16a34a !important;
            }
            
            .text-amber-900 {
              color: #78350f !important;
            }
            
            .text-amber-800 {
              color: #92400e !important;
            }
            
            .text-amber-700 {
              color: #b45309 !important;
            }
            
            /* Force light backgrounds */
            .bg-red-50 {
              background-color: #fef2f2 !important;
            }
            
            .bg-green-50 {
              background-color: #f0fdf4 !important;
            }
            
            .bg-amber-50 {
              background-color: #fffbeb !important;
            }
            
            .bg-gray-50 {
              background-color: #f9fafb !important;
            }
            
            .bg-red-100 {
              background-color: #fee2e2 !important;
            }
            
            .bg-green-100 {
              background-color: #dcfce7 !important;
            }
            
            /* Force light borders */
            .border-gray-300 {
              border-color: #d1d5db !important;
            }
            
            .border-gray-200 {
              border-color: #e5e7eb !important;
            }
            
            .border-red-600 {
              border-color: #dc2626 !important;
            }
            
            .border-green-600 {
              border-color: #16a34a !important;
            }
            
            .border-amber-300 {
              border-color: #fcd34d !important;
            }
            
            .border-amber-200 {
              border-color: #fde68a !important;
            }
            
            .border-amber-500 {
              border-color: #f59e0b !important;
            }
            
            /* Prevent page breaks inside important sections */
            .no-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .map-container {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 16pt;
            }
            
            .map-image {
              max-width: 100% !important;
              max-height: none !important;
              height: auto !important;
              width: auto !important;
              object-fit: contain !important;
            }
            
            /* Ensure readable text sizes */
            .text-xs {
              font-size: 9pt !important;
              line-height: 1.5 !important;
            }
            
            .text-sm {
              font-size: 10pt !important;
              line-height: 1.5 !important;
            }
            
            .text-lg {
              font-size: 13pt !important;
              line-height: 1.5 !important;
            }
            
            .text-2xl {
              font-size: 14pt !important;
              line-height: 1.3 !important;
            }
            
            .text-3xl {
              font-size: 16pt !important;
              line-height: 1.2 !important;
            }
            
            /* Spacing adjustments */
            .mb-6 {
              margin-bottom: 20pt !important;
            }
            
            .mb-8 {
              margin-bottom: 24pt !important;
            }
            
            .mb-4 {
              margin-bottom: 12pt !important;
            }
            
            .mb-3 {
              margin-bottom: 10pt !important;
            }
            
            .mb-2 {
              margin-bottom: 6pt !important;
            }
            
            .mb-1 {
              margin-bottom: 4pt !important;
            }
            
            .mt-8 {
              margin-top: 24pt !important;
            }
            
            .mt-2 {
              margin-top: 6pt !important;
            }
            
            .mt-1 {
              margin-top: 4pt !important;
            }
            
            .p-6 {
              padding: 16pt !important;
            }
            
            .p-5 {
              padding: 14pt !important;
            }
            
            .p-4 {
              padding: 12pt !important;
            }
            
            .pb-6 {
              padding-bottom: 16pt !important;
            }
            
            .pb-2 {
              padding-bottom: 6pt !important;
            }
            
            .pt-6 {
              padding-top: 16pt !important;
            }
            
            .py-2 {
              padding-top: 6pt !important;
              padding-bottom: 6pt !important;
            }
            
            .gap-4 {
              gap: 12pt !important;
            }
            
            .gap-2 {
              gap: 6pt !important;
            }
            
            .space-y-3 > * + * {
              margin-top: 10pt !important;
            }
            
            .space-y-2 > * + * {
              margin-top: 6pt !important;
            }
            
            /* Borders */
            .border-b-2 {
              border-bottom-width: 2pt !important;
            }
            
            .border-l-4 {
              border-left-width: 4pt !important;
            }
            
            /* Grid spacing */
            .grid.gap-4 {
              gap: 12pt !important;
            }
            
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Header with Logo */}
        <div className="mb-6 pb-4 border-b border-gray-300 no-break">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img 
                src="/TRUCKCHECK_LOGO.png" 
                alt="TruckCheck Logo" 
                className="h-12 w-auto"
                style={{ maxHeight: "48px", objectFit: "contain" }}
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900 mb-0.5">
                  Work Diary Requirement Analysis
                </h1>
                <p className="text-[9pt] text-gray-600">
                  100km Radius Check - truckcheck.com.au
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9pt] text-gray-700 font-medium">
                {new Date().toLocaleDateString("en-AU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-[8pt] text-gray-600">
                {new Date().toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Result */}
        <div className={`mb-4 p-4 rounded-lg border-2 no-break ${
          result.logbookRequired
            ? "border-red-600 bg-red-50"
            : "border-green-600 bg-green-50"
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
              result.logbookRequired
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}>
              {result.logbookRequired ? (
                <BookX size={24} strokeWidth={2} />
              ) : (
                <BookCheck size={24} strokeWidth={2} />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                result.logbookRequired ? "text-red-700" : "text-green-700"
              }`}>
                Work Diary {result.logbookRequired ? "REQUIRED" : "NOT REQUIRED"}
              </h2>
              <p className={`text-[9pt] font-medium ${
                result.logbookRequired ? "text-red-600" : "text-green-600"
              }`}>
                {result.logbookRequired
                  ? "Logbook must be maintained for this journey"
                  : "Logbook not required - within 100km radius"}
              </p>
            </div>
          </div>
          <p className={`text-[9pt] leading-relaxed ${
            result.logbookRequired ? "text-red-700" : "text-green-700"
          }`}>
            {result.logbookRequired
              ? "Based on distance calculations, you are travelling more than 100km from your base. A work diary (logbook) is required under NHVR regulations."
              : "Based on distance calculations, you are travelling within 100km of your base. No work diary (logbook) is required under NHVR regulations."}
          </p>
        </div>

        {/* Close to Threshold Warning */}
        {(() => {
          // Use the more accurate maxDistanceFromBase if available, otherwise use straight-line distance
          const relevantDistance = result.maxDistanceFromBase !== null 
            ? result.maxDistanceFromBase 
            : result.distance
          
          // Show warning if within 5km of the 100km threshold (95-105km)
          if (relevantDistance >= 95 && relevantDistance <= 105) {
            const isJustUnder = relevantDistance < 100
            const isJustOver = relevantDistance >= 100 && relevantDistance <= 105
            
              if (isJustUnder) {
              const usingMaxDistance = result.maxDistanceFromBase !== null && result.maxDistanceFromBase !== result.distance
              return (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg no-break">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[12pt] font-bold text-amber-900">
                        {relevantDistance.toFixed(1)} km
                      </div>
                      <div className="text-[9pt] font-medium text-amber-700 uppercase tracking-wide">
                        {usingMaxDistance ? 'Max from Base — ' : ''}Close to Threshold
                      </div>
                    </div>
                    <p className="text-[9pt] text-amber-800 leading-relaxed">
                      {usingMaxDistance 
                        ? `Your route takes you ${relevantDistance.toFixed(1)} km from base at the furthest point. Consider keeping a work diary anyway — GPS variations, detours, or route changes could push you over the 100km radius.`
                        : `You're just under the 100km radius. Consider keeping a work diary anyway — GPS variations, detours, or route changes could push you over the limit.`
                      }
                    </p>
                  </div>
                </div>
              )
            }
            
            if (isJustOver) {
              const usingMaxDistance = result.maxDistanceFromBase !== null && result.maxDistanceFromBase !== result.distance
              return (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg no-break">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[12pt] font-bold text-amber-900">
                        {relevantDistance.toFixed(1)} km
                      </div>
                      <div className="text-[9pt] font-medium text-amber-700 uppercase tracking-wide">
                        {usingMaxDistance ? 'Max from Base — ' : ''}Just Over Threshold
                      </div>
                    </div>
                    <p className="text-[9pt] text-amber-800 leading-relaxed">
                      {usingMaxDistance
                        ? `Your route takes you ${relevantDistance.toFixed(1)} km from base at the furthest point. A work diary is required for this journey under NHVR regulations.`
                        : `You're just over the 100km requirement. A work diary is required for this journey under NHVR regulations.`
                      }
                    </p>
                  </div>
                </div>
              )
            }
          }
          return null
        })()}

        {/* Route Information */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-1.5 border-b border-gray-300 flex items-center gap-2">
            <MapPin size={16} />
            Route Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="font-medium text-gray-700 text-[9pt]">Base Location:</span>
              <span className="text-gray-900 text-right max-w-md text-[9pt]">
                {result.baseLocation.placeName}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="font-medium text-gray-700 text-[9pt]">Total Stops:</span>
              <span className="text-gray-900 text-[9pt]">
                {result.stops.length} {result.stops.length === 1 ? "stop" : "stops"}
              </span>
            </div>
            {result.stops.map((stop, index) => (
              <div key={stop.id} className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="font-medium text-gray-700 text-[9pt]">
                  Stop {index + 1}{index === result.stops.length - 1 ? " (Final):" : ":"}
                </span>
                <span className="text-gray-900 text-right max-w-md text-[9pt]">
                  {stop.location?.placeName || stop.address}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Snapshot */}
        {mapImageUrl && (
          <div className="mb-4 map-container">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-1.5 border-b border-gray-300 flex items-center gap-2">
              <Navigation size={16} />
              Route Map
            </h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <img 
                src={mapImageUrl} 
                alt="Route map" 
                className="w-full h-auto map-image"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        {/* Distance Information */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-1.5 border-b border-gray-300 flex items-center gap-2">
            <TrendingUp size={16} />
            Distance Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-300 no-break">
              <div className="text-[9pt] text-gray-600 mb-1 font-medium">
                Crow Flies Distance
              </div>
              <div className="text-[16pt] font-bold text-gray-900">
                {result.distance.toFixed(1)} km
              </div>
              <div className="text-[8pt] text-gray-500 mt-0.5">
                Straight-line distance to final destination
              </div>
            </div>
            {result.maxDistanceFromBase !== null && (
              <div className={`p-3 rounded-lg border no-break ${
                result.maxDistanceFromBase > 100
                  ? "bg-amber-50 border-amber-300"
                  : "bg-gray-50 border-gray-300"
              }`}>
                <div className="text-[9pt] text-gray-600 mb-1 font-medium">
                  Furthest Point from Base
                </div>
                <div className="text-[16pt] font-bold text-gray-900">
                  {result.maxDistanceFromBase.toFixed(1)} km
                </div>
                <div className="text-[8pt] text-gray-500 mt-0.5">
                  How far you travel from base
                </div>
              </div>
            )}
            {result.drivingDistance !== null && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300 no-break">
                <div className="text-[9pt] text-gray-600 mb-1 font-medium">
                  Total Driving Distance
                </div>
                <div className="text-[16pt] font-bold text-gray-900">
                  {result.drivingDistance.toFixed(1)} km
                </div>
                <div className="text-[8pt] text-gray-500 mt-0.5">
                  Total km you'll drive on this trip
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
        {result.maxDistanceFromBase !== null && 
         result.maxDistanceFromBase > result.distance + 5 && (
          <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded no-break">
            <h4 className="font-semibold text-amber-900 mb-1.5 text-[10pt]">Important: Crow Flies vs Actual Route Distance</h4>
            <p className="text-[9pt] text-amber-800 leading-relaxed">
              <strong>Your destination is {result.distance.toFixed(1)} km away</strong> (as the crow flies), 
              but to get there <strong>you'll travel {result.maxDistanceFromBase.toFixed(1)} km from base</strong> along the actual driving route 
              (a difference of {(result.maxDistanceFromBase - result.distance).toFixed(1)} km). 
              NHVR regulations are based on the actual distance you travel from base, not just the crow flies distance to your destination.
            </p>
            {result.maxDistanceFromBase > 100 && result.distance <= 100 && (
              <p className="text-[9pt] font-semibold text-amber-900 mt-1.5 leading-relaxed">
                Important: Even though your destination is within the 100km radius (as the crow flies), the actual route takes you beyond 100km from base, so a work diary IS required.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[8pt] text-gray-600 mb-1.5 leading-snug">
                <span className="font-bold">Disclaimer:</span> This tool is for reference only and should not be considered legal advice. Always consult the official NHVR regulations and guidelines. While we strive for accuracy, we cannot guarantee the results are error-free. Use at your own discretion.
              </p>
              <p className="text-[8pt] text-gray-500">
                Generated by truckcheck.com.au/logbook-calculator - Work Diary Requirement Calculator
              </p>
            </div>
            <div className="text-right shrink-0">
              <img 
                src="/TRUCKCHECK_LOGO.png" 
                alt="TruckCheck" 
                className="h-8 w-auto opacity-60"
                style={{ maxHeight: "32px", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
)

PrintResult.displayName = "PrintResult"

