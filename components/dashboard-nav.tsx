'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface DashboardNavProps {
  manufacturerName?: string;
  modelName?: string;
  bodyTypeName?: string;
}

export function DashboardNav({ 
  manufacturerName: _manufacturerName, 
  modelName: _modelName, 
  bodyTypeName: _bodyTypeName 
}: DashboardNavProps) {
  const searchParams = useSearchParams();
  const manufacturer = searchParams.get('manufacturer');
  const model = searchParams.get('model');
  const bodyType = searchParams.get('bodyType');

  // Helper to get display names
  const getDisplayNames = () => {
    const manufacturerNames: Record<string, string> = {
      'isuzu': 'Isuzu',
      'fuso': 'Fuso',
    };

    const modelNames: Record<string, string> = {
      'isuzu-fvd-165-260-mwb': 'FVD 165-260 MWB',
      'fuso-shogun-fs76-8x4': 'Shogun FS76 8x4',
    };

    const bodyTypeNames: Record<string, string> = {
      'tray': 'Tray',
      'pantech': 'Pantech',
      'curtainsider': 'Curtainsider',
      'refrigerated': 'Refrigerated',
      'tipper': 'Tipper',
      'tanker': 'Tanker',
    };

    return {
      manufacturerName: manufacturer ? (manufacturerNames[manufacturer] || manufacturer) : 'Select Manufacturer',
      modelName: model ? (modelNames[model] || model) : 'Select Model',
      bodyTypeName: bodyType ? (bodyTypeNames[bodyType] || bodyType) : 'Select Body Type',
    };
  };

  const { manufacturerName, modelName, bodyTypeName } = getDisplayNames();

  const steps = [
    {
      label: 'Manufacturer',
      value: manufacturerName,
      href: '/dashboard/setup/manufacturer',
      isActive: true,
    },
    {
      label: 'Model',
      value: modelName,
      href: manufacturer ? `/dashboard/setup/truck?manufacturer=${manufacturer}` : '/dashboard/setup/manufacturer',
      isActive: !!manufacturer,
    },
    {
      label: 'Body Type',
      value: bodyTypeName,
      href: manufacturer && model ? `/dashboard/setup/body?manufacturer=${manufacturer}&model=${model}` : '/dashboard/setup/manufacturer',
      isActive: !!manufacturer && !!model,
    },
  ];

  return (
    <nav className="h-12 border-b border-border/40 bg-background flex items-center shrink-0 w-full">
      <div className="flex items-center justify-center gap-3 flex-1 overflow-x-auto px-6">
        {/* Dynamic Steps */}
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2 shrink-0">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            )}
            
            <Link
              href={step.href}
              className={`
                group flex flex-col px-3 py-1 rounded-md transition-all
                ${step.isActive 
                  ? 'text-foreground hover:bg-muted/50' 
                  : 'text-muted-foreground/50 pointer-events-none'
                }
              `}
            >
              <span className="text-[10px] uppercase tracking-wider font-medium opacity-50">
                {step.label}
              </span>
              <span className="text-sm font-semibold">
                {step.value}
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
        <Link
          href="/dashboard/setup"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50"
        >
          Change Setup
        </Link>
      </div>
    </nav>
  );
}

