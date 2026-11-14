import React from 'react';
import { Zap, Github, Heart, ExternalLink } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="footer-bolt">
                <Zap size={16} />
              </span>
              <span className="footer-title">flux/edit</span>
            </div>
            <p className="footer-tagline">
              The zero-overhead in-browser visual AST editor for React and Vite.
              Built for design engineers and frontend developers who ship fast.
            </p>
          </div>

          <div className="footer-links-cols">
            <div className="links-col">
              <span className="col-heading">Show &amp; Tell</span>
              <a href="#showcase">Inline Text Edit</a>
              <a href="#showcase">1-Click Nudge</a>
              <a href="#showcase">Card Reordering</a>
              <a href="#showcase">Tailwind Tokens</a>
            </div>

            <div className="links-col">
              <span className="col-heading">Open Source</span>
              <a href="https://github.com/Dinesh2112/flux-edit" target="_blank" rel="noreferrer">
                <span>GitHub Repository</span>
                <ExternalLink size={11} />
              </a>
              <a href="https://github.com/Dinesh2112/flux-edit/blob/main/LICENSE" target="_blank" rel="noreferrer">
                <span>MIT License</span>
                <ExternalLink size={11} />
              </a>
              <a href="https://www.npmjs.com/package/flux-edit" target="_blank" rel="noreferrer">
                <span>NPM Package</span>
                <ExternalLink size={11} />
              </a>
            </div>

            <div className="links-col">
              <span className="col-heading">Compatibility</span>
              <span className="compat-item">React 18 &amp; 19</span>
              <span className="compat-item">Vite 4, 5 &amp; 6</span>
              <span className="compat-item">Tailwind CSS 3 &amp; 4</span>
              <span className="compat-item">Next.js &amp; Remix (Soon)</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © 2026 FluxEdit Contributors · Released under MIT License
          </div>
          <div className="footer-badges">
            <span className="spec-badge">v1.0.0</span>
            <span className="spec-badge green">0 KB PROD OVERHEAD</span>
            <span className="spec-badge">BABEL AST 7.26</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
