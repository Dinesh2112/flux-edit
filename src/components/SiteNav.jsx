import React, { useState } from 'react';
import { Zap, Copy, Check, Github, ExternalLink } from 'lucide-react';

export function SiteNav() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -D flux-edit');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand">
          <a href="#" className="brand-link">
            <span className="brand-icon">
              <Zap size={16} />
            </span>
            <span className="brand-name">flux/edit</span>
          </a>
          <span className="badge-pill badge-version">v1.0.0</span>
          <span className="badge-pill badge-prod">0 KB Prod</span>
        </div>

        <nav className="header-nav-links">
          <a href="#showcase" className="nav-item">Show &amp; Tell</a>
          <a href="#how-it-works" className="nav-item">How It Works</a>
          <a href="#install" className="nav-item">Installation</a>
        </nav>

        <div className="header-actions">
          <button onClick={handleCopy} className="terminal-pill" title="Click to copy install command">
            <span className="term-prefix">$</span>
            <span className="term-cmd">npm i -D flux-edit</span>
            {copied ? (
              <span className="copy-state-icon done">
                <Check size={12} />
              </span>
            ) : (
              <span className="copy-state-icon">
                <Copy size={12} />
              </span>
            )}
          </button>

          <a
            href="https://github.com/Dinesh2112/flux-edit"
            target="_blank"
            rel="noreferrer"
            className="github-btn"
            aria-label="GitHub Repository"
          >
            <Github size={16} />
            <span className="gh-label">Star</span>
          </a>
        </div>
      </div>
    </header>
  );
}
