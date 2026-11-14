import React, { useState } from 'react';
import {
  Type,
  Sliders,
  Move,
  Sparkles,
  Layers,
  History,
  Copy,
  Check,
  Code2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Undo2,
  Redo2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

/* ==========================================================================
   Helper: Playable Card Shell (21st.dev style)
   ========================================================================== */
function PlayableCardFrame({ title, tag, category, codeSnippet, children }) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="playable-card-shell" data-category={category}>
      <div className="card-shell-header">
        <div className="card-shell-meta">
          <span className="card-shell-title">{title}</span>
          <span className="card-shell-tag">{tag}</span>
        </div>

        <div className="card-shell-actions">
          <div className="segmented-tab-control">
            <button
              onClick={() => setActiveTab('preview')}
              className={`seg-btn ${activeTab === 'preview' ? 'active' : ''}`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`seg-btn ${activeTab === 'code' ? 'active' : ''}`}
            >
              <Code2 size={12} />
              <span>JSX Code</span>
            </button>
          </div>

          <button onClick={handleCopyCode} className="card-copy-code-btn" title="Copy JSX snippet">
            {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <div className="card-shell-body">
        {activeTab === 'preview' ? (
          <div className="card-preview-canvas">{children}</div>
        ) : (
          <div className="card-code-view">
            <pre className="code-pre">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        )}
      </div>

      <div className="card-shell-footer">
        <span className="footer-sync-indicator">
          <span className="sync-dot green" />
          <span>AST SYNC ACTIVE · LATENCY &lt; 2MS</span>
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Playable 1: Hero Text & JSX Escaping
   ========================================================================== */
export function PlayableTextEdit() {
  const [headline, setHeadline] = useState('LaunchFlow AI Studio');
  const [badgeText, setBadgeText] = useState('v2.4 Released');

  const insertBrackets = () => {
    setHeadline('LaunchFlow {v3} <NextGen>');
  };

  const codeSnippet = `// src/components/Hero.jsx
export function Hero() {
  return (
    <div className="hero-container">
      <span className="badge">${badgeText}</span>
      <h1 className="title">
        ${headline.replace(/[{}\<>]/g, (c) => `{"${c}"}`)}
      </h1>
    </div>
  );
}`;

  return (
    <PlayableCardFrame
      title="Inline Text Editing & AST Escaping"
      tag="action: editText"
      category="text"
      codeSnippet={codeSnippet}
    >
      <div className="text-playable-wrap">
        <div className="text-controls-bar">
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="playable-text-input"
            placeholder="Type anything (try { } or < >)..."
          />
          <button onClick={insertBrackets} className="playable-mini-btn">
            Test Brackets: {"{prop}"} &lt;Tag&gt;
          </button>
        </div>

        <div className="text-preview-render">
          <span className="demo-render-badge">{badgeText}</span>
          <h2 className="demo-render-heading">{headline}</h2>
          <p className="demo-render-sub">
            Double-click or type in the input above. Special JSX characters are escaped automatically into safe JSX expressions.
          </p>
        </div>
      </div>
    </PlayableCardFrame>
  );
}

/* ==========================================================================
   Playable 2: Card Sibling Drag & Reorder
   ========================================================================== */
export function PlayableCardReorder() {
  const [cards, setCards] = useState([
    { id: 'starter', name: 'Starter', price: '$0', desc: 'Indie builders' },
    { id: 'pro', name: 'Pro (Popular)', price: '$49', desc: 'Growing teams' },
    { id: 'enterprise', name: 'Enterprise', price: '$199', desc: 'Scale organizations' },
  ]);

  const moveCard = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= cards.length) return;
    const next = [...cards];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setCards(next);
  };

  const codeSnippet = `// src/components/PricingGrid.jsx
export function PricingGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
${cards
  .map(
    (c) =>
      `      <Card title="${c.name}" price="${c.price}" desc="${c.desc}" />`
  )
  .join('\n')}
    </div>
  );
}`;

  return (
    <PlayableCardFrame
      title="Sibling Reorder with Glowing Insertion Bar"
      tag="action: moveSibling"
      category="reorder"
      codeSnippet={codeSnippet}
    >
      <div className="reorder-playable-wrap">
        <p className="playable-hint-text">
          Click <strong>[ ◀ ]</strong> or <strong>[ ▶ ]</strong> on any card to swap sibling positions in the JSX tree:
        </p>

        <div className="reorder-cards-row">
          {cards.map((c, idx) => (
            <div key={c.id} className={`reorder-demo-card ${c.id === 'pro' ? 'popular' : ''}`}>
              <div className="rc-top">
                <span className="rc-title">{c.name}</span>
                <div className="rc-shift-btns">
                  <button
                    onClick={() => moveCard(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rc-shift-btn"
                    title="Move earlier"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    onClick={() => moveCard(idx, idx + 1)}
                    disabled={idx === cards.length - 1}
                    className="rc-shift-btn"
                    title="Move later"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
              <div className="rc-price">{c.price}<span>/mo</span></div>
              <div className="rc-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </PlayableCardFrame>
  );
}

/* ==========================================================================
   Playable 3: 1-Click Spacing Nudger
   ========================================================================== */
export function PlayableSpacingNudge() {
  const [marginLeft, setMarginLeft] = useState(24);

  const nudge = (amount) => {
    setMarginLeft((prev) => Math.max(0, Math.min(100, prev + amount)));
  };

  const codeSnippet = `// src/components/Navbar.jsx
export function Navbar() {
  return (
    <header className="flex items-center justify-between p-4">
      <div style={{ marginLeft: "${marginLeft}px" }} className="brand-logo">
        LaunchFlow ⚡
      </div>
      <nav className="flex gap-4">...</nav>
    </header>
  );
}`;

  return (
    <PlayableCardFrame
      title="1-Click Margin Nudger & Position Drag"
      tag="action: updateStyle (marginLeft)"
      category="nudge"
      codeSnippet={codeSnippet}
    >
      <div className="nudge-playable-wrap">
        <div className="nudge-toolbar-row">
          <span className="nudge-lbl">NUDGE POSITION:</span>
          <div className="nudge-btn-pair">
            <button onClick={() => nudge(-12)} className="nudge-click-btn">
              <ChevronLeft size={13} />
              <span>-12px</span>
            </button>
            <button onClick={() => nudge(12)} className="nudge-click-btn">
              <span>+12px</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <span className="nudge-lbl ml-auto">SLIDER: {marginLeft}px</span>
          <input
            type="range"
            min="0"
            max="100"
            value={marginLeft}
            onChange={(e) => setMarginLeft(Number(e.target.value))}
            className="nudge-slider"
          />
        </div>

        <div className="nudge-canvas-box">
          <div className="nudge-simulated-nav">
            <div
              className="nudge-selected-brand"
              style={{ marginLeft: `${marginLeft}px`, transition: 'margin 0.15s ease' }}
            >
              <div className="brand-tag-bubble">
                <span>div.logo · ml: {marginLeft}px</span>
              </div>
              <span className="brand-sim-text">LaunchFlow ⚡</span>
            </div>

            <div className="nudge-sim-links">
              <span>Features</span>
              <span>Pricing</span>
              <button className="nudge-sim-cta">Sign In</button>
            </div>
          </div>
        </div>
      </div>
    </PlayableCardFrame>
  );
}

/* ==========================================================================
   Playable 4: Tailwind Class Reconciler
   ========================================================================== */
export function PlayableTailwindPatcher() {
  const [paddingToken, setPaddingToken] = useState('p-6');
  const [radiusToken, setRadiusToken] = useState('rounded-xl');
  const [bgToken, setBgToken] = useState('bg-indigo-950');

  const codeSnippet = `// src/components/FeatureCard.jsx
export function FeatureCard() {
  return (
    <div className="${paddingToken} ${radiusToken} ${bgToken} border border-indigo-500/20 shadow-lg">
      <h3 className="text-xl font-bold text-white">Cloud Database</h3>
      <p className="text-sm text-slate-300">Distributed multi-region key-value store.</p>
    </div>
  );
}`;

  return (
    <PlayableCardFrame
      title="Tailwind CSS Utility Reconciler"
      tag="action: patchTailwindClasses"
      category="tailwind"
      codeSnippet={codeSnippet}
    >
      <div className="tailwind-playable-wrap">
        <div className="tw-controls-row">
          <div className="tw-control-item">
            <span className="tw-lbl">PADDING:</span>
            <div className="tw-pill-group">
              {['p-2', 'p-4', 'p-6', 'p-8'].map((tok) => (
                <button
                  key={tok}
                  onClick={() => setPaddingToken(tok)}
                  className={`tw-pill-btn ${paddingToken === tok ? 'active' : ''}`}
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>

          <div className="tw-control-item">
            <span className="tw-lbl">RADIUS:</span>
            <div className="tw-pill-group">
              {['rounded-none', 'rounded-md', 'rounded-xl', 'rounded-3xl'].map((tok) => (
                <button
                  key={tok}
                  onClick={() => setRadiusToken(tok)}
                  className={`tw-pill-btn ${radiusToken === tok ? 'active' : ''}`}
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>

          <div className="tw-control-item">
            <span className="tw-lbl">THEME BG:</span>
            <div className="tw-pill-group">
              {[
                { tok: 'bg-indigo-950', name: 'Indigo' },
                { tok: 'bg-emerald-950', name: 'Emerald' },
                { tok: 'bg-slate-900', name: 'Slate' },
              ].map((c) => (
                <button
                  key={c.tok}
                  onClick={() => setBgToken(c.tok)}
                  className={`tw-pill-btn ${bgToken === c.tok ? 'active' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="tw-preview-box">
          <div
            className={`tw-demo-card ${paddingToken} ${radiusToken} ${bgToken}`}
            style={{
              padding: paddingToken === 'p-2' ? '8px' : paddingToken === 'p-4' ? '16px' : paddingToken === 'p-6' ? '24px' : '32px',
              borderRadius: radiusToken === 'rounded-none' ? '0px' : radiusToken === 'rounded-md' ? '6px' : radiusToken === 'rounded-xl' ? '14px' : '24px',
              background: bgToken === 'bg-indigo-950' ? '#1e1b4b' : bgToken === 'bg-emerald-950' ? '#064e3b' : '#0f172a',
            }}
          >
            <div className="tw-card-badge">TAILWIND LIVE RECONCILED</div>
            <h4 className="tw-card-h4">Cloud Database Cluster</h4>
            <p className="tw-card-p">
              FluxEdit parses className and replaces matching utility tokens without altering other custom classes.
            </p>
          </div>
        </div>
      </div>
    </PlayableCardFrame>
  );
}

/* ==========================================================================
   Playable 5: Flexbox Layout Switcher
   ========================================================================== */
export function PlayableFlexLayout() {
  const [direction, setDirection] = useState('row');
  const [justify, setJustify] = useState('center');
  const [gap, setGap] = useState(14);

  const codeSnippet = `// src/components/Actions.jsx
export function Actions() {
  return (
    <div className="flex flex-${direction} justify-${justify} gap-[${gap}px]">
      <button className="btn-primary">Get Started</button>
      <button className="btn-secondary">Documentation</button>
    </div>
  );
}`;

  return (
    <PlayableCardFrame
      title="Flexbox Direction & Alignment Engine"
      tag="action: updateStyle (flex)"
      category="nudge"
      codeSnippet={codeSnippet}
    >
      <div className="flex-playable-wrap">
        <div className="flex-toolbar-row">
          <div className="flex-ctrl">
            <span className="flex-lbl">DIRECTION:</span>
            <div className="flex-btn-group">
              <button
                onClick={() => setDirection('row')}
                className={`flex-pill ${direction === 'row' ? 'active' : ''}`}
              >
                flex-row
              </button>
              <button
                onClick={() => setDirection('col')}
                className={`flex-pill ${direction === 'col' ? 'active' : ''}`}
              >
                flex-col
              </button>
            </div>
          </div>

          <div className="flex-ctrl">
            <span className="flex-lbl">JUSTIFY:</span>
            <div className="flex-btn-group">
              {['start', 'center', 'end', 'between'].map((j) => (
                <button
                  key={j}
                  onClick={() => setJustify(j)}
                  className={`flex-pill ${justify === j ? 'active' : ''}`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-ctrl">
            <span className="flex-lbl">GAP: {gap}px</span>
            <input
              type="range"
              min="8"
              max="32"
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="flex-slider"
            />
          </div>
        </div>

        <div className="flex-preview-box">
          <div
            className="flex-demo-container"
            style={{
              display: 'flex',
              flexDirection: direction === 'row' ? 'row' : 'column',
              justifyContent:
                justify === 'start'
                  ? 'flex-start'
                  : justify === 'center'
                  ? 'center'
                  : justify === 'end'
                  ? 'flex-end'
                  : 'space-between',
              alignItems: 'center',
              gap: `${gap}px`,
            }}
          >
            <button className="flex-demo-btn-primary">
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
            <button className="flex-demo-btn-secondary">
              <span>Documentation</span>
            </button>
          </div>
        </div>
      </div>
    </PlayableCardFrame>
  );
}

/* ==========================================================================
   Playable 6: Real-time Undo / Redo & Diffs
   ========================================================================== */
export function PlayableHistoryDiffs() {
  const [historyIndex, setHistoryIndex] = useState(2);
  const steps = [
    { label: 'Initial code state', diff: 'Original JSX' },
    { label: 'Updated marginLeft to 24px', diff: '+ style={{ marginLeft: "24px" }}' },
    { label: 'Edited title to "LaunchFlow Pro"', diff: '+ <h1>LaunchFlow Pro</h1>' },
  ];

  const handleUndo = () => {
    setHistoryIndex((prev) => Math.max(0, prev - 1));
  };

  const handleRedo = () => {
    setHistoryIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const codeSnippet = `// Diff View (Step ${historyIndex + 1} of ${steps.length})
// Action: ${steps[historyIndex].label}
${steps[historyIndex].diff}`;

  return (
    <PlayableCardFrame
      title="Session Undo/Redo & Diff Timeline"
      tag="action: undo / redo"
      category="history"
      codeSnippet={codeSnippet}
    >
      <div className="history-playable-wrap">
        <div className="history-actions-bar">
          <div className="history-btn-pair">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="hist-action-btn"
            >
              <Undo2 size={13} />
              <span>Undo (Ctrl+Z)</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === steps.length - 1}
              className="hist-action-btn"
            >
              <Redo2 size={13} />
              <span>Redo (Ctrl+Y)</span>
            </button>
          </div>

          <span className="hist-status-text">
            Step {historyIndex + 1} of {steps.length}: <strong>{steps[historyIndex].label}</strong>
          </span>
        </div>

        <div className="history-timeline-box">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className={`timeline-step-row ${idx === historyIndex ? 'current' : idx < historyIndex ? 'passed' : 'future'}`}
            >
              <span className="step-point-dot" />
              <div className="step-info">
                <span className="step-name">{st.label}</span>
                <span className="step-diff-pill">{st.diff}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PlayableCardFrame>
  );
}
