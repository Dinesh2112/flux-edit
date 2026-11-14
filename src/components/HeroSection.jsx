import React from 'react';
import { Sparkles, ArrowRight, Terminal, Shield, Zap, Code2, Palette } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-eyebrow">
          <Sparkles size={14} className="eyebrow-sparkle" />
          <span>Zero-Overhead Visual AST Editor for React &amp; Vite</span>
        </div>

        <h1 className="hero-title">
          Click on your website. <br />
          <span className="hero-gradient">Change your code.</span>
        </h1>

        <p className="hero-description">
          Stop digging through 30 component files in VS Code just to fix a typo, nudge spacing, or test a layout.
          Click any element on your running React app, make your changes visually, and watch FluxEdit update your
          source code on disk in real time.
        </p>

        <div className="hero-cta-group">
          <a href="#showcase" className="btn-primary">
            <span>Try Interactive Show &amp; Tell</span>
            <ArrowRight size={15} />
          </a>
          <a href="#install" className="btn-secondary">
            <Terminal size={15} />
            <span>Quickstart Guide (30s)</span>
          </a>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="hero-pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-box yellow">
              <Zap size={18} />
            </div>
            <h3 className="pillar-title">0 KB in Production</h3>
            <p className="pillar-desc">
              Mounts exclusively during <code>vite dev</code> via <code>apply: 'serve'</code>. Production builds contain 0 bytes of editor code.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box blue">
              <Code2 size={18} />
            </div>
            <h3 className="pillar-title">Babel AST Engine</h3>
            <p className="pillar-desc">
              Surgically modifies exact JSX nodes on disk. Your code formatting, comments, and React hook dependencies remain untouched.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box purple">
              <Palette size={18} />
            </div>
            <h3 className="pillar-title">Tailwind Reconciler</h3>
            <p className="pillar-desc">
              Visual nudges automatically map to Tailwind utility tokens like <code>p-4</code> and <code>rounded-xl</code> without touching other classes.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box green">
              <Shield size={18} />
            </div>
            <h3 className="pillar-title">Dev Security Jail</h3>
            <p className="pillar-desc">
              Strict path-traversal jail and CSRF protection headers guarantee modifications stay inside your project workspace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
