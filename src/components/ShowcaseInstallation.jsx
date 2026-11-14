import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';

export function ShowcaseInstallation() {
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
    setTimeout(() => setCopiedInstall(false), 1800);
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 1800);
  };

  return (
    <section className="showcase-install-section">
      <div className="install-box-card">
        <div className="install-left-col">
          <span className="install-mini-tag">QUICK INSTALL</span>
          <h3 className="install-h3">Add to any React + Vite app in 30 seconds</h3>
          <p className="install-p">
            FluxEdit auto-mounts during dev server runs and completely evaporates during <code>npm run build</code>.
            Zero manual component imports required.
          </p>

          <div className="install-pm-tabs">
            {['npm', 'pnpm', 'yarn', 'bun'].map((item) => (
              <button
                key={item}
                onClick={() => setPm(item)}
                className={`install-pm-btn ${pm === item ? 'active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="install-term-box">
            <span className="term-prompt-char">$</span>
            <span className="term-cmd-str">{commands[pm]}</span>
            <button onClick={copyInstall} className="term-copy-icon-btn">
              {copiedInstall ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="install-right-col">
          <div className="config-file-header">
            <div className="cf-label">
              <FileCode size={13} />
              <span>vite.config.js</span>
            </div>
            <button onClick={copyConfig} className="cf-copy-btn">
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
          <pre className="config-pre-block">
            <code>{configSnippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
