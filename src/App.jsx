import React from 'react';
import { SiteNav } from './components/SiteNav';
import { HeroSection } from './components/HeroSection';
import { InteractiveStudioDemo } from './components/InteractiveStudioDemo';
import { FeatureShowcase } from './components/FeatureShowcase';
import { HowItWorksSection } from './components/HowItWorksSection';
import { InstallSection } from './components/InstallSection';
import { SiteFooter } from './components/SiteFooter';

export default function App() {
  return (
    <div className="site-wrapper">
      <SiteNav />
      <main className="main-content">
        <HeroSection />
        <InteractiveStudioDemo />
        <FeatureShowcase />
        <HowItWorksSection />
        <InstallSection />
      </main>
      <SiteFooter />
    </div>
  );
}
