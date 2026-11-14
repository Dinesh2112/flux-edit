import React from 'react';
import { Layers, Cpu, HardDrive, ArrowRight, CheckCircle2 } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Dev-Only Virtual Module',
      icon: Layers,
      color: 'blue',
      desc: 'The Vite plugin uses apply: "serve" to inject the lightweight visual inspector only during development. When you run npm run build, zero bytes are bundled into production.',
      highlight: 'apply: "serve" · 0 KB Prod',
    },
    {
      step: "03",
      title: 'In-Browser Visual Inspector',
      icon: Cpu,
      color: 'purple',
      desc: 'Hold Option/Alt and click any rendered element on your site. The inspector identifies the exact file path, line, and column from Babel JSX metadata.',
      highlight: 'Option + Click to Inspect',
    },
    {
      step: '03',
      title: 'Atomic Babel AST Disk Sync',
      icon: HardDrive,
      color: 'emerald',
      desc: 'Your visual tweaks are compiled into AST node patches. The engine updates the exact JSX node on disk atomically using temporary files, protected by a strict path jail.',
      highlight: 'Atomic Write · CSRF Protected',
    },
  ];

  return (
    <section id="how-it-works" className="how-section">
      <div className="section-header">
        <div className="section-tag">
          <Cpu size={13} />
          <span>ARCHITECTURE &amp; ENGINE</span>
        </div>
        <h2 className="section-title">How FluxEdit Works Under the Hood</h2>
        <p className="section-subtitle">
          Designed for performance and safety. Here is what happens from the moment you click an element to the moment your source code updates on disk.
        </p>
      </div>

      <div className="how-steps-grid">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.step} className="step-card">
              <div style={{ fontSize: "15px" }} className="step-card-header">
                <span className="step-number">{s.step}</span>
                <div style={{ borderRadius: "19px" }} className={`step-icon-box ${s.color}`}>
                  <Icon size={18} />
                </div>
              </div>

              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>

              <div className="step-footer">
                <span className="step-highlight-tag">
                  <CheckCircle2 size={12} />
                  <span>{s.highlight}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
