import React, { useState } from 'react';
import { Zap, Copy, Check, Github, Search, Command } from 'lucide-react';

export function ShowcaseHeader({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }) {
  const [copied, setCopied] = useState(false);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('npm install -D flux-edit');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="showcase-nav">
      <div className="showcase-nav-container">
        <div className="nav-brand-group">
          <a href="#" className="nav-brand-link">
            <div className="brand-bolt-badge">
              <Zap size={15} />
            </div>
            <span className="brand-title">flux/edit</span>
          </a>
          <span className="brand-version-badge">v1.0.0</span>
          <span className="brand-zero-badge">0 KB Prod</span>
        </div>

        <div className="nav-search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search interactive playables... (e.g. text, spacing, drag, tailwind)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="search-kbd">
            <Command size={11} />
            <span>K</span>
          </div>
        </div>

        <div className="nav-actions">
          <button
            onClick={handleCopyInstall}
            className="nav-copy-btn"
            title="Copy install command"
          >
            <span className="term-symbol">$</span>
            <span className="cmd-text">npm i -D flux-edit</span>
            {copied ? (
              <Check size={13} className="copy-state success" />
            ) : (
              <Copy size={13} className="copy-state" />
            )}
          </button>

          <a
            href="https://github.com/Dinesh2112/flux-edit"
            target="_blank"
            rel="noreferrer"
            className="nav-github-btn"
            aria-label="GitHub Repository"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
