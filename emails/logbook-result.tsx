import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { CalculationResult } from '@/lib/logbook/types'

interface LogbookResultEmailProps {
  result: CalculationResult
  mapImageUrl?: string
  description?: string
  generatedDate: string
}

// Get site URL for email - ensure it's publicly accessible (not localhost)
// Email clients need absolute URLs that are accessible from the internet
const getEmailSiteUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl
  }
  // Fallback to production URL - email clients need publicly accessible URLs
  return 'https://truckcheck.com.au'
}
const siteUrl = getEmailSiteUrl()
const logoUrl = `${siteUrl}/TRUCKCHECK_LOGO.png`

export function LogbookResultEmail({
  result,
  mapImageUrl,
  description,
  generatedDate,
}: LogbookResultEmailProps) {
  // Format date like PDF: "15 Jan 2024"
  const formattedDate = new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  // Format time like PDF: "14:30"
  const formattedTime = new Date().toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Html>
      <Head />
      <Preview>Work Diary Requirement Analysis - {result.logbookRequired ? 'REQUIRED' : 'NOT REQUIRED'}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo - Outlook compatible table layout */}
          <Section style={headerSection}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={headerTable}>
              <tr>
                <td style={headerLeft}>
                  <table cellPadding="0" cellSpacing="0" border={0}>
                    <tr>
                      <td>
                        <Img
                          src={logoUrl}
                          alt="TruckCheck Logo"
                          width="140"
                          height="36"
                          style={logo}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={headerTextWrapper}>
                        <Heading style={h1}>
                          Work Diary Requirement Analysis
                        </Heading>
                        <Text style={subtitle}>
                          As The Crow Flies - 100km Radius Check - truckcheck.com.au
                        </Text>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style={headerRight} align="right" valign="top">
                  <Text style={dateText}>{formattedDate}</Text>
                  <Text style={timeText}>{formattedTime}</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Description/Message */}
          {description && (
            <Section style={descriptionSection}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tr>
                  <td style={descriptionText}>{description}</td>
                </tr>
              </table>
            </Section>
          )}

          {/* Main Result - Outlook compatible */}
          <Section style={resultSection(result.logbookRequired)}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tr>
                <td>
                  <Heading style={h2(result.logbookRequired)}>
                    Work Diary {result.logbookRequired ? 'REQUIRED' : 'NOT REQUIRED'}
                  </Heading>
                  <Text style={resultSubtext(result.logbookRequired)}>
                    {result.logbookRequired
                      ? 'Logbook must be maintained for this journey'
                      : 'Logbook not required - within 100km radius'}
                  </Text>
                  <Text style={resultDescription(result.logbookRequired)}>
                    {result.logbookRequired
                      ? 'Based on distance calculations, you are travelling more than 100km from your base. A work diary (logbook) is required under NHVR regulations.'
                      : 'Based on distance calculations, you are travelling within 100km of your base. No work diary (logbook) is required under NHVR regulations.'}
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Route Information */}
          <Section style={section}>
            <Heading style={h3}>Route Information</Heading>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={infoTable}>
              <tr style={infoRow}>
                <td style={infoLabel} width="140">
                  <Text style={infoLabelText}>Base Location:</Text>
                </td>
                <td style={infoValue} align="right">
                  <Text style={infoValueText}>{result.baseLocation.placeName}</Text>
                </td>
              </tr>
              <tr style={infoRow}>
                <td style={infoLabel} width="140">
                  <Text style={infoLabelText}>Total Stops:</Text>
                </td>
                <td style={infoValue} align="right">
                  <Text style={infoValueText}>
                    {result.stops.length} {result.stops.length === 1 ? 'stop' : 'stops'}
                  </Text>
                </td>
              </tr>
              {result.stops.map((stop, index) => (
                <tr key={stop.id} style={infoRow}>
                  <td style={infoLabel} width="140">
                    <Text style={infoLabelText}>
                      Stop {index + 1}{index === result.stops.length - 1 ? ' (Final):' : ':'}
                    </Text>
                  </td>
                  <td style={infoValue} align="right">
                    <Text style={infoValueText}>
                      {stop.location?.placeName || stop.address}
                    </Text>
                  </td>
                </tr>
              ))}
            </table>
          </Section>

          {/* Map Snapshot - Constrained size for Outlook */}
          {mapImageUrl && (
            <Section style={section}>
              <Heading style={h3}>Route Map</Heading>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tr>
                  <td align="center" style={mapWrapper}>
                    <Img
                      src={mapImageUrl}
                      alt="Route map"
                      width="550"
                      style={mapImage}
                    />
                  </td>
                </tr>
              </table>
            </Section>
          )}

          {/* Distance Summary */}
          <Section style={section}>
            <Heading style={h3}>Distance Summary</Heading>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={distanceTable}>
              <tr>
                <td style={distanceCard} width={result.maxDistanceFromBase !== null ? "48%" : "100%"}>
                  <Text style={distanceLabel}>Crow Flies Distance</Text>
                  <Text style={distanceValue}>{result.distance.toFixed(1)} km</Text>
                  <Text style={distanceDescription}>
                    Straight-line distance to final destination
                  </Text>
                </td>
                {result.maxDistanceFromBase !== null && (
                  <td style={distanceCard} width="48%">
                    <Text style={distanceLabel}>Furthest Point from Base</Text>
                    <Text style={distanceValue}>{result.maxDistanceFromBase.toFixed(1)} km</Text>
                    <Text style={distanceDescription}>
                      How far you travel from base
                    </Text>
                  </td>
                )}
              </tr>
              {result.drivingDistance !== null && (
                <tr>
                  <td style={distanceCardFull} colSpan={result.maxDistanceFromBase !== null ? 2 : 1}>
                    <Text style={distanceLabel}>Total Driving Distance</Text>
                    <Text style={distanceValue}>{result.drivingDistance.toFixed(1)} km</Text>
                    <Text style={distanceDescription}>
                      Total km you'll drive on this trip
                    </Text>
                  </td>
                </tr>
              )}
            </table>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={footerTable}>
              <tr>
                <td style={footerTextColumn} valign="top">
                  <Text style={footerText}>
                    <strong>Disclaimer:</strong> This tool is for reference only and should not be considered legal advice. Always consult the official NHVR regulations and guidelines. While we strive for accuracy, we cannot guarantee the results are error-free. Use at your own discretion.
                  </Text>
                  <Text style={footerCredit}>
                    Generated by truckcheck.com.au/100km-distance-checker-as-the-crow-flies - 100km Distance Checker
                  </Text>
                </td>
                <td style={footerLogoColumn} align="right" valign="top" width="112">
                  <Img
                    src={logoUrl}
                    alt="TruckCheck"
                    width="112"
                    height="29"
                    style={footerLogo}
                  />
                </td>
              </tr>
            </table>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Outlook-compatible styles - all inline, no flexbox, table-based layouts
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0',
  padding: '0',
  width: '100%',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  width: '100%',
}

const headerSection = {
  padding: '24px 24px 16px 24px',
  borderBottom: '1px solid #d1d5db',
  marginBottom: '16px',
}

const headerTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  border: '0',
}

const headerLeft = {
  verticalAlign: 'top',
  padding: '0',
}

const headerTextWrapper = {
  marginTop: '8px',
  padding: '0',
}

const headerRight = {
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
  width: '120px',
  padding: '0',
}

const logo = {
  maxHeight: '48px',
  width: '140px',
  height: '36px',
  display: 'block',
  border: '0',
}

const h1 = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 4px 0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const subtitle = {
  color: '#4b5563',
  fontSize: '9px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const dateText = {
  color: '#374151',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 2px 0',
  padding: '0',
  textAlign: 'right' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const timeText = {
  color: '#4b5563',
  fontSize: '8px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
  textAlign: 'right' as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const descriptionSection = {
  padding: '16px 24px',
  marginBottom: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const descriptionText = {
  color: '#374151',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0',
  padding: '0',
  whiteSpace: 'pre-wrap',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const resultSection = (logbookRequired: boolean) => ({
  padding: '16px',
  borderRadius: '8px',
  border: `2px solid ${logbookRequired ? '#dc2626' : '#16a34a'}`,
  backgroundColor: logbookRequired ? '#fef2f2' : '#f0fdf4',
  marginBottom: '16px',
  marginLeft: '24px',
  marginRight: '24px',
})

const h2 = (logbookRequired: boolean) => ({
  color: logbookRequired ? '#b91c1c' : '#15803d',
  fontSize: '20px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 4px 0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
})

const resultSubtext = (logbookRequired: boolean) => ({
  color: logbookRequired ? '#dc2626' : '#16a34a',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 8px 0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
})

const resultDescription = (logbookRequired: boolean) => ({
  color: logbookRequired ? '#b91c1c' : '#15803d',
  fontSize: '9px',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
})

const section = {
  padding: '0 24px',
  marginBottom: '16px',
}

const h3 = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 12px 0',
  paddingBottom: '6px',
  borderBottom: '1px solid #d1d5db',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const infoTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  border: '0',
}

const infoRow = {
  borderBottom: '1px solid #e5e7eb',
}

const infoLabel = {
  width: '140px',
  verticalAlign: 'top',
  paddingBottom: '6px',
  paddingTop: '6px',
  paddingLeft: '0',
  paddingRight: '12px',
}

const infoValue = {
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
  paddingBottom: '6px',
  paddingTop: '6px',
  paddingLeft: '12px',
  paddingRight: '0',
}

const infoLabelText = {
  color: '#374151',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const infoValueText = {
  color: '#111827',
  fontSize: '9px',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const mapWrapper = {
  padding: '0',
  margin: '0',
}

const mapImage = {
  maxWidth: '550px',
  width: '550px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  display: 'block',
  margin: '0 auto',
  // Don't set height - let it scale proportionally based on width
  // Email clients handle this better than height: auto
}

const distanceTable = {
  width: '100%',
  borderCollapse: 'separate' as const,
  borderSpacing: '0',
  border: '0',
}

const distanceCard = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  verticalAlign: 'top',
}

const distanceCardFull = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  verticalAlign: 'top',
}

const distanceLabel = {
  color: '#4b5563',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 4px 0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const distanceValue = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 2px 0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const distanceDescription = {
  color: '#6b7280',
  fontSize: '8px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const footerSection = {
  padding: '16px 24px 24px 24px',
  marginTop: '24px',
  borderTop: '1px solid #d1d5db',
}

const footerTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  border: '0',
}

const footerTextColumn = {
  verticalAlign: 'top',
  paddingRight: '16px',
}

const footerLogoColumn = {
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
  width: '112px',
}

const footerText = {
  color: '#4b5563',
  fontSize: '8px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const footerCredit = {
  color: '#6b7280',
  fontSize: '8px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const footerLogo = {
  maxHeight: '32px',
  width: '112px',
  height: '29px',
  objectFit: 'contain' as const,
  opacity: '0.6',
  display: 'block' as const,
  marginLeft: 'auto',
  border: '0',
}

export default LogbookResultEmail
