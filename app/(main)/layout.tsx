import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 h-16" />}>
        <Header />
      </Suspense>
      <main className="flex-1">
        {children}
      </main>
      <Suspense fallback={<footer className="w-full border-t border-border/50 mt-auto bg-muted/20 h-32" />}>
        <Footer />
      </Suspense>
    </>
  );
}

