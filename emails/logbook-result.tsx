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
  generatedDate: string
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://truckcheck.com.au'
const logoUrl = `${siteUrl}/TRUCKCHECK_LOGO.png`

export function LogbookResultEmail({
  result,
  mapImageUrl,
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
          {/* Header with Logo */}
          <Section style={headerSection}>
            <table style={headerTable} width="100%">
              <tr>
                <td style={headerLeft}>
                  <Img
                    src={logoUrl}
                    alt="TruckCheck Logo"
                    width="140"
                    height="36"
                    style={logo}
                  />
                  <div style={headerTextWrapper}>
                    <Heading style={h1}>
                      Work Diary Requirement Analysis
                    </Heading>
                    <Text style={subtitle}>
                     As The Crow Flies - 100km Radius Check - truckcheck.com.au
                    </Text>
                  </div>
                </td>
                <td style={headerRight}>
                  <Text style={dateText}>{formattedDate}</Text>
                  <Text style={timeText}>{formattedTime}</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Main Result */}
          <Section style={resultSection(result.logbookRequired)}>
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
          </Section>

          {/* Route Information */}
          <Section style={section}>
            <Heading style={h3}>Route Information</Heading>
            <table style={infoTable} width="100%">
              <tr style={infoRow}>
                <td style={infoLabel}>
                  <Text style={infoLabelText}>Base Location:</Text>
                </td>
                <td style={infoValue}>
                  <Text style={infoValueText}>{result.baseLocation.placeName}</Text>
                </td>
              </tr>
              <tr style={infoRow}>
                <td style={infoLabel}>
                  <Text style={infoLabelText}>Total Stops:</Text>
                </td>
                <td style={infoValue}>
                  <Text style={infoValueText}>
                    {result.stops.length} {result.stops.length === 1 ? 'stop' : 'stops'}
                  </Text>
                </td>
              </tr>
              {result.stops.map((stop, index) => (
                <tr key={stop.id} style={infoRow}>
                  <td style={infoLabel}>
                    <Text style={infoLabelText}>
                      Stop {index + 1}{index === result.stops.length - 1 ? ' (Final):' : ':'}
                    </Text>
                  </td>
                  <td style={infoValue}>
                    <Text style={infoValueText}>
                      {stop.location?.placeName || stop.address}
                    </Text>
                  </td>
                </tr>
              ))}
            </table>
          </Section>

          {/* Map Snapshot */}
          {mapImageUrl && (
            <Section style={section}>
              <Heading style={h3}>Route Map</Heading>
              <Img
                src={mapImageUrl}
                alt="Route map"
                style={mapImage}
              />
            </Section>
          )}

          {/* Distance Summary */}
          <Section style={section}>
            <Heading style={h3}>Distance Summary</Heading>
            <table style={distanceTable} width="100%">
              <tr>
                <td style={result.maxDistanceFromBase !== null ? distanceCard : distanceCardFull}>
                  <Text style={distanceLabel}>Crow Flies Distance</Text>
                  <Text style={distanceValue}>{result.distance.toFixed(1)} km</Text>
                  <Text style={distanceDescription}>
                    Straight-line distance to final destination
                  </Text>
                </td>
                {result.maxDistanceFromBase !== null && (
                  <td style={distanceCard}>
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
            <table style={footerTable} width="100%">
              <tr>
                <td style={footerTextColumn}>
                  <Text style={footerText}>
                    <strong>Disclaimer:</strong> This tool is for reference only and should not be considered legal advice. Always consult the official NHVR regulations and guidelines. While we strive for accuracy, we cannot guarantee the results are error-free. Use at your own discretion.
                  </Text>
                  <Text style={footerCredit}>
                    Generated by truckcheck.com.au/logbook-calculator - Work Diary Requirement Calculator
                  </Text>
                </td>
                <td style={footerLogoColumn}>
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

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
}

const headerSection = {
  padding: '24px 24px 16px 24px',
  borderBottom: '1px solid #d1d5db',
  marginBottom: '16px',
}

const headerTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const headerLeft = {
  verticalAlign: 'top',
}

const headerTextWrapper = {
  marginTop: '8px',
}

const headerRight = {
  verticalAlign: 'top',
  textAlign: 'right' as const,
  width: '120px',
}

const logo = {
  maxHeight: '48px',
  width: 'auto',
  objectFit: 'contain' as const,
  display: 'block' as const,
}

const h1 = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 4px 0',
  padding: '0',
}

const subtitle = {
  color: '#4b5563',
  fontSize: '9px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
}

const dateText = {
  color: '#374151',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 2px 0',
  padding: '0',
  textAlign: 'right' as const,
}

const timeText = {
  color: '#4b5563',
  fontSize: '8px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
  textAlign: 'right' as const,
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
})

const resultSubtext = (logbookRequired: boolean) => ({
  color: logbookRequired ? '#dc2626' : '#16a34a',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 8px 0',
  padding: '0',
})

const resultDescription = (logbookRequired: boolean) => ({
  color: logbookRequired ? '#b91c1c' : '#15803d',
  fontSize: '9px',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
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
}

const infoTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const infoRow = {
  borderBottom: '1px solid #e5e7eb',
}

const infoLabel = {
  width: '140px',
  verticalAlign: 'top',
  paddingBottom: '6px',
  paddingTop: '6px',
}

const infoValue = {
  verticalAlign: 'top',
  textAlign: 'right' as const,
  paddingBottom: '6px',
  paddingTop: '6px',
}

const infoLabelText = {
  color: '#374151',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
}

const infoValueText = {
  color: '#111827',
  fontSize: '9px',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
}

const mapImage = {
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  display: 'block' as const,
}

const distanceTable = {
  width: '100%',
  borderCollapse: 'separate' as const,
  borderSpacing: '0 12px',
}

const distanceCard = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  verticalAlign: 'top' as const,
  width: '48%',
}

const distanceCardFull = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  verticalAlign: 'top' as const,
  width: '100%',
}

const distanceLabel = {
  color: '#4b5563',
  fontSize: '9px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 4px 0',
  padding: '0',
}

const distanceValue = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 2px 0',
  padding: '0',
}

const distanceDescription = {
  color: '#6b7280',
  fontSize: '8px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
}

const footerSection = {
  padding: '16px 24px 24px 24px',
  marginTop: '24px',
  borderTop: '1px solid #d1d5db',
}

const footerTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const footerTextColumn = {
  verticalAlign: 'top',
  paddingRight: '16px',
}

const footerLogoColumn = {
  width: '112px',
  verticalAlign: 'top',
  textAlign: 'right' as const,
}

const footerText = {
  color: '#4b5563',
  fontSize: '8px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
  padding: '0',
}

const footerCredit = {
  color: '#6b7280',
  fontSize: '8px',
  lineHeight: '1.4',
  margin: '0',
  padding: '0',
}

const footerLogo = {
  maxHeight: '32px',
  width: 'auto',
  objectFit: 'contain' as const,
  opacity: '0.6',
  display: 'block' as const,
  marginLeft: 'auto',
}

export default LogbookResultEmail
