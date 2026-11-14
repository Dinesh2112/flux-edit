import React from 'react';
import { Zap, Github, Heart } from 'lucide-react';

export function ShowcaseFooter() {
  return (
    <footer className="showcase-footer">
      <div className="footer-inner-box">
        <div className="f-left">
          <div className="f-logo">
            <Zap size={15} className="f-bolt" />
            <span>flux/edit</span>
          </div>
          <p className="f-tagline">
            The zero-overhead in-browser AST visual editor for React and Vite.
            Built for design engineers who ship fast.
          </p>
        </div>

        <div className="f-right-links">
          <div className="f-col">
            <span className="f-head">Playables</span>
            <a href="#">Text &amp; Escaping</a>
            <a href="#">1-Click Nudge</a>
            <a href="#">Card Reorder</a>
            <a href="#">Tailwind Engine</a>
          </div>

          <div className="f-col">
            <span className="f-head">Open Source</span>
            <a href="https://github.com/flux-edit/flux-edit" target="_blank" rel="noreferrer">
              GitHub Repository
            </a>
            <a href="https://github.com/flux-edit/flux-edit/blob/main/LICENSE" target="_blank" rel="noreferrer">
              MIT License
            </a>
            <a href="https://www.npmjs.com/package/flux-edit" target="_blank" rel="noreferrer">
              NPM Package
            </a>
          </div>

          <div className="f-col">
            <span className="f-head">Compatibility</span>
            <span>React 18 &amp; 19</span>
            <span>Vite 4, 5 &amp; 6</span>
            <span>Tailwind CSS 3 &amp; 4</span>
          </div>
        </div>
      </div>

      <div className="f-bottom-bar">
        <span>© 2026 FluxEdit Contributors · MIT License</span>
        <div className="f-pills-row">
          <span className="f-badge">v1.0.0</span>
          <span className="f-badge green">0 KB PROD OVERHEAD</span>
          <span className="f-badge">BABEL 7.26</span>
        </div>
      </div>
    </footer>
  );
}
