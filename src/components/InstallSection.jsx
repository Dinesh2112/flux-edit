import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, CheckCircle2, Play } from 'lucide-react';

export function InstallSection() {
  const [pm, setPm] = useState('npm');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const commands = {
    npm: 'npm install -D flux-edit',
    pnpm: 'pnpm add -D flux-edit',
    yarn: 'yarn add -D flux-edit',
    bun: 'bun add -d flux-edit',
  };

  const configSnippet = `// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fluxEdit } from 'flux-edit/vite';

export default defineConfig({
  plugins: [
    fluxEdit(), // ⚡ Dev-only visual editor (0 KB added in production)
    react(),
  ],
});`;

  const copyInstall = () => {
    navigator.clipboard.writeText(commands[pm]);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <section id="install" className="install-section">
      <div className="section-header">
        <div className="section-tag">
          <Terminal size={13} />
          <span>QUICKSTART GUIDE</span>
        </div>
        <h2 className="section-title">Add to Your React Project in 30 Seconds</h2>
        <p className="section-subtitle">
          No extra server processes or cloud accounts. Just install the devDependency and add the Vite plugin.
        </p>
      </div>

      <div className="install-grid">
        {/* Step 1 & 2 Left Column */}
        <div className="install-card-left">
          <div className="step-badge-row">
            <span className="step-pill">STEP 01</span>
            <span className="step-pill-title">Install devDependency</span>
          </div>

          <p className="install-explanation">
            FluxEdit only needs to be installed as a developer dependency. It will never be included in your production build.
          </p>

          <div className="pm-tab-bar">
            {['npm', 'pnpm', 'yarn', 'bun'].map((item) => (
              <button
                key={item}
                onClick={() => setPm(item)}
                className={`pm-tab-btn ${pm === item ? 'active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="terminal-box">
            <div className="term-line">
              <span className="term-prompt">$</span>
              <span className="term-cmd-text">{commands[pm]}</span>
            </div>
            <button onClick={copyInstall} className="term-copy-btn" title="Copy to clipboard">
              {copiedInstall ? (
                <>
                  <Check size={13} color="#10b981" />
                  <span className="copied-text">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="step-badge-row next-step">
            <span className="step-pill">STEP 03</span>
            <span className="step-pill-title">Start your dev server</span>
          </div>

          <div className="terminal-box">
            <div className="term-line">
              <span className="term-prompt">$</span>
              <span className="term-cmd-text">npm run dev</span>
            </div>
          </div>

          <div className="usage-tip-box">
            <CheckCircle2 size={15} className="tip-icon" />
            <span>
              Press <strong>Alt + Click</strong> (or <strong>Option + Click</strong> on Mac) on any element in your browser to inspect and edit!
            </span>
          </div>
        </div>

        {/* Step 2 Right Column: vite.config.js */}
        <div className="install-card-right">
          <div className="step-badge-row">
            <span className="step-pill">STEP 02</span>
            <span className="step-pill-title">Register the Vite plugin</span>
          </div>

          <div className="code-editor-frame">
            <div className="editor-top-bar">
              <div className="editor-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="editor-filename">
                <FileCode size={13} />
                <span>vite.config.js</span>
              </div>
              <button onClick={copyConfig} className="editor-copy-btn">
                {copiedConfig ? (
                  <>
                    <Check size={12} color="#10b981" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="editor-pre">
              <code>{configSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
