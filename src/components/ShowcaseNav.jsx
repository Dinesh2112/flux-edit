import React, { useState } from 'react';
import { Zap, Copy, Check, Github } from 'lucide-react';

export function ShowcaseNav() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -D flux-edit');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="showcase-top-nav">
      <div className="nav-wrapper">
        <a href="#" className="nav-brand">
          <div className="bolt-icon-box">
            <Zap size={15} />
          </div>
          <span className="logo-text">flux/edit</span>
          <span className="tag-version">v1.0.0</span>
          <span className="tag-prod">0 KB Prod</span>
        </a>

        <div className="nav-right-cluster">
          <button onClick={handleCopy} className="terminal-pill-btn">
            <span className="p-char">$</span>
            <span className="p-cmd">npm i -D flux-edit</span>
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          </button>

          <a
            href="https://github.com/flux-edit/flux-edit"
            target="_blank"
            rel="noreferrer"
            className="nav-icon-link"
            aria-label="GitHub Repository"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
