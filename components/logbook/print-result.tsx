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
              font-size: 24pt;
              font-weight: 700;
              line-height: 1.2;
              margin-bottom: 8pt;
              color: #111827 !important;
              page-break-after: avoid;
            }
            
            h2 {
              font-size: 18pt;
              font-weight: 700;
              line-height: 1.3;
              margin-top: 16pt;
              margin-bottom: 8pt;
              color: #111827 !important;
              page-break-after: avoid;
            }
            
            h3 {
              font-size: 14pt;
              font-weight: 600;
              line-height: 1.4;
              margin-top: 12pt;
              margin-bottom: 8pt;
              color: #111827 !important;
              page-break-after: avoid;
            }
            
            h4 {
              font-size: 12pt;
              font-weight: 600;
              line-height: 1.4;
              margin-top: 10pt;
              margin-bottom: 6pt;
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
              font-size: 20pt !important;
              line-height: 1.3 !important;
            }
            
            .text-3xl {
              font-size: 28pt !important;
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

        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-300 no-break">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NHVR Logbook Check Result
          </h1>
          <p className="text-sm text-gray-600">
            Generated on {new Date().toLocaleDateString("en-AU", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            at {new Date().toLocaleTimeString("en-AU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            truckcheck.com.au - NHVR Logbook Checker
          </p>
        </div>

        {/* Main Result */}
        <div className={`mb-6 p-6 rounded-lg border-2 no-break ${
          result.logbookRequired
            ? "border-red-600 bg-red-50"
            : "border-green-600 bg-green-50"
        }`}>
          <div className="flex items-center gap-4 mb-3">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
              result.logbookRequired
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}>
              {result.logbookRequired ? (
                <BookX size={32} strokeWidth={2} />
              ) : (
                <BookCheck size={32} strokeWidth={2} />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                result.logbookRequired ? "text-red-700" : "text-green-700"
              }`}>
                Logbook {result.logbookRequired ? "REQUIRED" : "NOT REQUIRED"}
              </h2>
              <p className={`text-sm font-medium ${
                result.logbookRequired ? "text-red-600" : "text-green-600"
              }`}>
                {result.logbookRequired
                  ? "Work diary must be completed"
                  : "Work diary not required for this trip"}
              </p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${
            result.logbookRequired ? "text-red-700" : "text-green-700"
          }`}>
            {result.logbookRequired
              ? "You are travelling more than 100km from your base. A work diary (logbook) is required under NHVR regulations."
              : "You are travelling within 100km of your base. No work diary (logbook) is required under NHVR regulations."}
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
                <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-lg no-break">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-amber-900">
                        {relevantDistance.toFixed(1)} km
                      </div>
                      <div className="text-sm font-medium text-amber-700 uppercase tracking-wide">
                        {usingMaxDistance ? 'Max from Base — ' : ''}Close to Threshold
                      </div>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      {usingMaxDistance 
                        ? `Your route takes you ${relevantDistance.toFixed(1)} km from base at the furthest point. Consider keeping a logbook anyway — GPS variations, detours, or route changes could push you over the 100km limit.`
                        : `You're just under the 100km requirement. Consider keeping a logbook anyway — GPS variations, detours, or route changes could push you over the limit.`
                      }
                    </p>
                  </div>
                </div>
              )
            }
            
            if (isJustOver) {
              const usingMaxDistance = result.maxDistanceFromBase !== null && result.maxDistanceFromBase !== result.distance
              return (
                <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-lg no-break">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-amber-900">
                        {relevantDistance.toFixed(1)} km
                      </div>
                      <div className="text-sm font-medium text-amber-700 uppercase tracking-wide">
                        {usingMaxDistance ? 'Max from Base — ' : ''}Just Over Threshold
                      </div>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
            <MapPin size={20} />
            Route Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700 text-sm">Base Location:</span>
              <span className="text-gray-900 text-right max-w-md text-sm">
                {result.baseLocation.placeName}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700 text-sm">Total Stops:</span>
              <span className="text-gray-900 text-sm">
                {result.stops.length} {result.stops.length === 1 ? "stop" : "stops"}
              </span>
            </div>
            {result.stops.map((stop, index) => (
              <div key={stop.id} className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700 text-sm">
                  Stop {index + 1}{index === result.stops.length - 1 ? " (Final):" : ":"}
                </span>
                <span className="text-gray-900 text-right max-w-md text-sm">
                  {stop.location?.placeName || stop.address}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Snapshot */}
        {mapImageUrl && (
          <div className="mb-6 map-container">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
              <Navigation size={20} />
              Route Map
            </h3>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
            <TrendingUp size={20} />
            Distance Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 no-break">
              <div className="text-sm text-gray-600 mb-1 font-medium">
                Distance (as the crow flies)
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {result.distance.toFixed(1)} km
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Straight-line to final destination
              </div>
            </div>
            {result.maxDistanceFromBase !== null && (
              <div className={`p-4 rounded-lg border no-break ${
                result.maxDistanceFromBase > 100
                  ? "bg-amber-50 border-amber-300"
                  : "bg-gray-50 border-gray-300"
              }`}>
                <div className="text-sm text-gray-600 mb-1 font-medium">
                  Furthest Point from Base
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {result.maxDistanceFromBase.toFixed(1)} km
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  How far you travel from base
                </div>
              </div>
            )}
            {result.drivingDistance !== null && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 no-break">
                <div className="text-sm text-gray-600 mb-1 font-medium">
                  Total Driving Distance
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {result.drivingDistance.toFixed(1)} km
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total km you'll drive on this trip
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
        {result.maxDistanceFromBase !== null && 
         result.maxDistanceFromBase > result.distance + 5 && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded no-break">
            <h4 className="font-semibold text-amber-900 mb-2">Important: Destination vs Route Distance</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Your destination is {result.distance.toFixed(1)} km away</strong> (straight line), 
              but to get there <strong>you'll travel {result.maxDistanceFromBase.toFixed(1)} km from base</strong> along the actual driving route 
              (a difference of {(result.maxDistanceFromBase - result.distance).toFixed(1)} km). 
              NHVR regulations are based on how far you travel from base, not just where your destination is.
            </p>
            {result.maxDistanceFromBase > 100 && result.distance <= 100 && (
              <p className="text-sm font-semibold text-amber-900 mt-2 leading-relaxed">
                Important: Even though your destination is within 100km, the route takes you beyond the 100km radius, so a logbook IS required.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300 text-left">
          <p className="text-[10px] text-gray-600 mb-1">
          <span className="font-bold">Disclaimer:</span> This tool is for reference only and should not be considered legal advice. Always consult the official NHVR regulations and guidelines. While we strive for accuracy, we cannot guarantee the results are error-free. Use at your own discretion.
          </p>
          <p className="text-[10px] text-gray-500">
            Generated by truckcheck.com.au/logbook-calculator - Free NHVR Logbook Checker
          </p>
        </div>
      </div>
    )
  }
)

PrintResult.displayName = "PrintResult"

