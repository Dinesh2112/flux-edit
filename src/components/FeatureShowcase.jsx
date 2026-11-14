import React, { useState } from 'react';
import {
  Type,
  Sliders,
  Move,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  FileCode,
  RotateCcw,
  Square,
  CornerUpRight,
} from 'lucide-react';

export function FeatureShowcase() {
  // Feature 1: Text Edit State
  const [headline, setHeadline] = useState('Build Faster With AI');
  const [badgeText, setBadgeText] = useState('New Release v2.0');

  // Feature 2: 1-Click Spacing Nudge State
  const [marginLeft, setMarginLeft] = useState(24);

  // Feature 3: Border Radius Studio State
  const [radiusVal, setRadiusVal] = useState(16);
  const [radiusMode, setRadiusMode] = useState('all'); // 'all' or 'individual'
  const [cornerTL, setCornerTL] = useState(16);
  const [cornerTR, setCornerTR] = useState(16);
  const [cornerBR, setCornerBR] = useState(16);
  const [cornerBL, setCornerBL] = useState(16);

  // Feature 4: Card Reorder State
  const [cardOrder, setCardOrder] = useState(['starter', 'pro', 'enterprise']);

  // Feature 5: Tailwind Token Engine State
  const [paddingToken, setPaddingToken] = useState('p-6');
  const [radiusToken, setRadiusToken] = useState('rounded-xl');
  const [bgToken, setBgToken] = useState('bg-indigo-950');

  const moveCard = (from, to) => {
    if (to < 0 || to >= cardOrder.length) return;
    const next = [...cardOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCardOrder(next);
  };

  const cardsData = {
    starter: { title: 'Starter Plan', price: '$0', desc: 'Indie developers & hobby projects' },
    pro: { title: 'Pro Plan (Popular)', price: '$49', desc: 'Growing product & startup teams' },
    enterprise: { title: 'Enterprise', price: '$199', desc: 'High scale organizations & SLAs' },
  };

  const textPresets = [
    'Build Faster With AI',
    'Ship In Days, Not Weeks',
    'Zero Runtime Overhead',
  ];

  const radiusPresets = [
    { label: 'none (0px)', val: 0 },
    { label: 'md (6px)', val: 6 },
    { label: 'xl (12px)', val: 12 },
    { label: '2xl (16px)', val: 16 },
    { label: '3xl (24px)', val: 24 },
    { label: 'full (999px)', val: 999 },
  ];

  const getTailwindRadiusToken = (px) => {
    if (px === 0) return 'rounded-none';
    if (px <= 4) return 'rounded-sm';
    if (px <= 6) return 'rounded-md';
    if (px <= 10) return 'rounded-lg';
    if (px <= 14) return 'rounded-xl';
    if (px <= 20) return 'rounded-2xl';
    if (px <= 32) return 'rounded-3xl';
    return 'rounded-full';
  };

  const computedBorderRadiusCss =
    radiusMode === 'all'
      ? `${radiusVal === 999 ? '9999px' : `${radiusVal}px`}`
      : `${cornerTL}px ${cornerTR}px ${cornerBR}px ${cornerBL}px`;

  const computedTailwindRadiusClass =
    radiusMode === 'all'
      ? getTailwindRadiusToken(radiusVal)
      : `rounded-tl-${getTailwindRadiusToken(cornerTL).replace('rounded-', '')} rounded-tr-${getTailwindRadiusToken(cornerTR).replace('rounded-', '')} rounded-br-${getTailwindRadiusToken(cornerBR).replace('rounded-', '')} rounded-bl-${getTailwindRadiusToken(cornerBL).replace('rounded-', '')}`;

  return (
    <section id="showcase" className="showcase-section">
      <div className="section-header">
        <div className="section-tag">
          <Sparkles size={13} />
          <span>INTERACTIVE FEATURE LABS</span>
        </div>
        <h2 className="section-title">Explore All 5 AST Capabilities</h2>
        <p className="section-subtitle">
          Test any feature manually. Every visual interaction compiles to git-clean JSX with zero runtime overhead.
        </p>
      </div>

      <div className="showcase-container">
        {/* FEATURE 01: TEXT EDITING */}
        <div className="feature-block">
          <div className="feature-header-meta">
            <div className="feature-badge">FEATURE 01</div>
            <h3 className="feature-heading">Double-Click Any Text to Edit Inline</h3>
            <p className="feature-sub">
              Stop searching through dozens of files in VS Code just to fix a headline or copy typo.
              Double-click any text directly on your live website, type your changes, and watch your source file update on disk instantly with automated JSX escaping.
            </p>
          </div>

          <div className="feature-dual-panel">
            <div className="panel-ui">
              <div className="panel-title-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="bar-label">Live Web Component (Interactive)</span>
              </div>

              <div className="ui-canvas">
                <div className="interactive-input-group">
                  <div className="input-row-header">
                    <label className="input-group-label">TYPE TO EDIT HEADING:</label>
                    <div className="preset-buttons-group">
                      <span className="preset-label">Presets:</span>
                      {textPresets.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setHeadline(preset)}
                          className={`preset-pill ${headline === preset ? 'active' : ''}`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="interactive-text-input"
                    placeholder="Type anything here..."
                  />
                </div>

                <div className="interactive-hero-card">
                  <span className="card-mini-badge">{badgeText}</span>
                  <h3 className="card-main-title">{headline}</h3>
                  <p className="card-main-desc">
                    Notice how typing in the input above immediately updates both this rendered card and the real VS Code source code on the right!
                  </p>
                  <button className="card-cta-btn">Get Started Free</button>
                </div>
              </div>
            </div>

            <div className="panel-code">
              <div className="code-header">
                <div className="code-file-name">
                  <FileCode size={13} />
                  <span>src/components/Hero.jsx</span>
                </div>
                <span className="sync-badge">
                  <Check size={12} />
                  <span>Synced to Disk</span>
                </span>
              </div>

              <pre className="code-content">
                <code>
                  <span className="c-kw">export function</span> <span className="c-fn">Hero</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  {'    '}&lt;<span className="c-tag">div</span> <span className="c-attr">className</span>=<span className="c-str">&quot;hero-card&quot;</span>&gt;{'\n'}
                  {'      '}&lt;<span className="c-tag">span</span> <span className="c-attr">className</span>=<span className="c-str">&quot;badge&quot;</span>&gt;{badgeText}&lt;/<span className="c-tag">span</span>&gt;{'\n'}
                  <span className="diff-highlight-add">
                    +     &lt;<span className="c-tag">h3</span>&gt;{headline}&lt;/<span className="c-tag">h3</span>&gt;
                  </span>{'\n'}
                  {'      '}&lt;<span className="c-tag">p</span>&gt;Notice how typing above immediately...&lt;/<span className="c-tag">p</span>&gt;{'\n'}
                  {'      '}&lt;<span className="c-tag">button</span>&gt;Get Started Free&lt;/<span className="c-tag">button</span>&gt;{'\n'}
                  {'    '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* FEATURE 02: SPACING & NUDGE */}
        <div className="feature-block">
          <div className="feature-header-meta">
            <div className="feature-badge">FEATURE 02</div>
            <h3 className="feature-heading">1-Click Spacing Nudges &amp; Margin Slider</h3>
            <p className="feature-sub">
              No more tweaking margins inside Chrome DevTools only to lose all your adjustments on browser refresh.
              Click <strong>-12px</strong> or <strong>+12px</strong> or drag the slider to nudge elements into perfect alignment.
            </p>
          </div>

          <div className="feature-dual-panel">
            <div className="panel-ui">
              <div className="panel-title-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="bar-label">Live Navigation Bar (Interactive)</span>
              </div>

              <div className="ui-canvas">
                <div className="nudge-control-bar">
                  <div className="nudge-btns-cluster">
                    <span className="ctrl-label">NUDGE:</span>
                    <button
                      onClick={() => setMarginLeft((m) => Math.max(0, m - 12))}
                      className="nudge-btn"
                      title="Nudge left 12px"
                    >
                      <ChevronLeft size={13} />
                      <span>-12px</span>
                    </button>
                    <button
                      onClick={() => setMarginLeft((m) => Math.min(96, m + 12))}
                      className="nudge-btn"
                      title="Nudge right 12px"
                    >
                      <span>+12px</span>
                      <ChevronRight size={13} />
                    </button>
                    <button
                      onClick={() => setMarginLeft(24)}
                      className="nudge-btn reset"
                      title="Reset margin"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>

                  <div className="slider-cluster">
                    <input
                      type="range"
                      min="0"
                      max="96"
                      step="4"
                      value={marginLeft}
                      onChange={(e) => setMarginLeft(Number(e.target.value))}
                      className="margin-slider"
                    />
                    <span className="current-margin-val">{marginLeft}px</span>
                  </div>
                </div>

                <div className="simulated-nav-bar">
                  <div
                    className="selected-brand-element"
                    style={{ marginLeft: `${marginLeft}px`, transition: 'margin 0.15s ease' }}
                  >
                    <div className="selection-tag">div.logo · ml: {marginLeft}px</div>
                    <span className="brand-logo-text">LaunchFlow ⚡</span>
                  </div>

                  <div className="simulated-nav-links">
                    <span>Features</span>
                    <span>Pricing</span>
                    <button className="simulated-cta">Sign In</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-code">
              <div className="code-header">
                <div className="code-file-name">
                  <FileCode size={13} />
                  <span>src/components/Navbar.jsx</span>
                </div>
                <span className="sync-badge">
                  <Check size={12} />
                  <span>Synced to Disk</span>
                </span>
              </div>

              <pre className="code-content">
                <code>
                  <span className="c-kw">export function</span> <span className="c-fn">Navbar</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  {'    '}&lt;<span className="c-tag">header</span> <span className="c-attr">className</span>=<span className="c-str">&quot;nav-header&quot;</span>&gt;{'\n'}
                  <span className="diff-highlight-add">
                    +     &lt;<span className="c-tag">div</span> <span className="c-attr">style</span>=&#123;&#123; <span className="c-prop">marginLeft</span>: <span className="c-str">&quot;{marginLeft}px&quot;</span> &#125;&#125; <span className="c-attr">className</span>=<span className="c-str">&quot;logo&quot;</span>&gt;
                  </span>{'\n'}
                  {'        '}LaunchFlow ⚡{'\n'}
                  {'      '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'      '}&lt;<span className="c-tag">nav</span>&gt;Features · Pricing&lt;/<span className="c-tag">nav</span>&gt;{'\n'}
                  {'    '}&lt;/<span className="c-tag">header</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* FEATURE 03: BORDER RADIUS STUDIO */}
        <div className="feature-block">
          <div className="feature-header-meta">
            <div className="feature-badge">FEATURE 03</div>
            <h3 className="feature-heading">Visual Border Radius &amp; 4-Corner Studio</h3>
            <p className="feature-sub">
              Adjust corner curvature on any card, button, or container.
              Supports unified radius sliders, individual corner overrides (TL, TR, BR, BL), and bidirectional Tailwind class mapping (e.g. <code>rounded-2xl</code>, <code>rounded-tl-xl</code>).
            </p>
          </div>

          <div className="feature-dual-panel">
            <div className="panel-ui">
              <div className="panel-title-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="bar-label">Border Radius Controller</span>
              </div>

              <div className="ui-canvas">
                <div className="radius-top-controls">
                  <div className="radius-mode-toggle">
                    <button
                      onClick={() => setRadiusMode('all')}
                      className={`mode-btn ${radiusMode === 'all' ? 'active' : ''}`}
                    >
                      <Square size={12} />
                      <span>All Corners</span>
                    </button>
                    <button
                      onClick={() => setRadiusMode('individual')}
                      className={`mode-btn ${radiusMode === 'individual' ? 'active' : ''}`}
                    >
                      <CornerUpRight size={12} />
                      <span>4 Corners</span>
                    </button>
                  </div>

                  <div className="radius-presets-group">
                    {radiusPresets.map((rp) => (
                      <button
                        key={rp.label}
                        onClick={() => {
                          setRadiusVal(rp.val);
                          setCornerTL(rp.val);
                          setCornerTR(rp.val);
                          setCornerBR(rp.val);
                          setCornerBL(rp.val);
                        }}
                        className={`preset-pill ${radiusVal === rp.val && radiusMode === 'all' ? 'active' : ''}`}
                      >
                        {rp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {radiusMode === 'all' ? (
                  <div className="radius-slider-row">
                    <span className="ctrl-label">RADIUS:</span>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      value={radiusVal === 999 ? 48 : radiusVal}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setRadiusVal(v);
                        setCornerTL(v);
                        setCornerTR(v);
                        setCornerBR(v);
                        setCornerBL(v);
                      }}
                      className="margin-slider"
                    />
                    <span className="current-margin-val">
                      {radiusVal === 999 ? '999px (full)' : `${radiusVal}px`}
                    </span>
                  </div>
                ) : (
                  <div className="four-corners-grid">
                    <div className="corner-input-item">
                      <span>Top-Left:</span>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={cornerTL}
                        onChange={(e) => setCornerTL(Number(e.target.value))}
                      />
                      <span>{cornerTL}px</span>
                    </div>
                    <div className="corner-input-item">
                      <span>Top-Right:</span>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={cornerTR}
                        onChange={(e) => setCornerTR(Number(e.target.value))}
                      />
                      <span>{cornerTR}px</span>
                    </div>
                    <div className="corner-input-item">
                      <span>Bottom-Right:</span>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={cornerBR}
                        onChange={(e) => setCornerBR(Number(e.target.value))}
                      />
                      <span>{cornerBR}px</span>
                    </div>
                    <div className="corner-input-item">
                      <span>Bottom-Left:</span>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={cornerBL}
                        onChange={(e) => setCornerBL(Number(e.target.value))}
                      />
                      <span>{cornerBL}px</span>
                    </div>
                  </div>
                )}

                <div
                  className="radius-live-card"
                  style={{
                    borderRadius: computedBorderRadiusCss,
                    transition: 'border-radius 0.2s ease',
                  }}
                >
                  <div className="radius-card-badge">
                    <span>TAILWIND: {computedTailwindRadiusClass}</span>
                  </div>
                  <h4 className="radius-card-title">Interactive Curved Surface</h4>
                  <p className="radius-card-desc">
                    Notice how adjusting the radius slider or corner controls directly updates the live shape here and generates git-clean Tailwind or CSS code on the right!
                  </p>
                </div>
              </div>
            </div>

            <div className="panel-code">
              <div className="code-header">
                <div className="code-file-name">
                  <FileCode size={13} />
                  <span>src/components/Card.jsx</span>
                </div>
                <span className="sync-badge">
                  <Check size={12} />
                  <span>Synced to Disk</span>
                </span>
              </div>

              <pre className="code-content">
                <code>
                  <span className="c-kw">export function</span> <span className="c-fn">Card</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  <span className="diff-highlight-add">
                    +   &lt;<span className="c-tag">div</span> <span className="c-attr">className</span>=<span className="c-str">&quot;{computedTailwindRadiusClass} border p-6 bg-slate-900&quot;</span>&gt;
                  </span>{'\n'}
                  {'        '}&lt;<span className="c-tag">h4</span>&gt;Interactive Curved Surface&lt;/<span className="c-tag">h4</span>&gt;{'\n'}
                  {'        '}&lt;<span className="c-tag">p</span>&gt;Notice how adjusting the radius...&lt;/<span className="c-tag">p</span>&gt;{'\n'}
                  {'      '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* FEATURE 04: CARD REORDERING */}
        <div className="feature-block">
          <div className="feature-header-meta">
            <div className="feature-badge">FEATURE 04</div>
            <h3 className="feature-heading">Direct Sibling Card Reordering</h3>
            <p className="feature-sub">
              Drag cards, navbar links, or list items directly onto neighbors.
              FluxEdit swaps the JSX children in your React component AST on disk, preserving all component props and logic.
            </p>
          </div>

          <div className="feature-dual-panel">
            <div className="panel-ui">
              <div className="panel-title-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="bar-label">Interactive Pricing Grid (Click Arrows to Reorder)</span>
              </div>

              <div className="ui-canvas">
                <p className="canvas-instruction-text">
                  Click <strong>[ ◀ Move Left ]</strong> or <strong>[ Move Right ▶ ]</strong> on any card to physically swap positions:
                </p>

                <div className="reorder-cards-grid">
                  {cardOrder.map((key, idx) => {
                    const card = cardsData[key];
                    return (
                      <div key={key} className={`showcase-card ${key === 'pro' ? 'featured' : ''}`}>
                        <div className="sc-header">
                          <span className="sc-tag">{card.title}</span>
                          <div className="sc-shift-group">
                            <button
                              onClick={() => moveCard(idx, idx - 1)}
                              disabled={idx === 0}
                              className="sc-shift-btn"
                              title="Move left"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <button
                              onClick={() => moveCard(idx, idx + 1)}
                              disabled={idx === cardOrder.length - 1}
                              className="sc-shift-btn"
                              title="Move right"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="sc-price">{card.price}<span>/mo</span></div>
                        <div className="sc-desc">{card.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="panel-code">
              <div className="code-header">
                <div className="code-file-name">
                  <FileCode size={13} />
                  <span>src/components/PricingGrid.jsx</span>
                </div>
                <span className="sync-badge">
                  <Check size={12} />
                  <span>Synced to Disk</span>
                </span>
              </div>

              <pre className="code-content">
                <code>
                  <span className="c-kw">export function</span> <span className="c-fn">PricingGrid</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  {'    '}&lt;<span className="c-tag">div</span> <span className="c-attr">className</span>=<span className="c-str">&quot;grid grid-cols-3&quot;</span>&gt;{'\n'}
                  {cardOrder.map((k) => (
                    <span key={k} className="diff-highlight-add">
                      {'      '}&lt;<span className="c-tag">{k === 'starter' ? 'StarterCard' : k === 'pro' ? 'ProCard' : 'EnterpriseCard'}</span> /&gt;{'\n'}
                    </span>
                  ))}
                  {'    '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* FEATURE 05: TAILWIND RECONCILER */}
        <div className="feature-block">
          <div className="feature-header-meta">
            <div className="feature-badge">FEATURE 05</div>
            <h3 className="feature-heading">Tailwind CSS Utility Reconciler</h3>
            <p className="feature-sub">
              FluxEdit detects whether your element uses Tailwind classes.
              Clicking utility buttons surgically replaces tokens (like <code>p-4</code> to <code>p-8</code>) inside <code>className</code> without touching your custom CSS classes.
            </p>
          </div>

          <div className="feature-dual-panel">
            <div className="panel-ui">
              <div className="panel-title-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="bar-label">Tailwind Utility Controls (Click to Switch Tokens)</span>
              </div>

              <div className="ui-canvas">
                <div className="tailwind-toolbar">
                  <div className="tw-row">
                    <span className="tw-label">PADDING:</span>
                    <div className="tw-btn-group">
                      {['p-2', 'p-4', 'p-6', 'p-8'].map((tok) => (
                        <button
                          key={tok}
                          onClick={() => setPaddingToken(tok)}
                          className={`tw-btn ${paddingToken === tok ? 'active' : ''}`}
                        >
                          {tok}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tw-row">
                    <span className="tw-label">RADIUS:</span>
                    <div className="tw-btn-group">
                      {['rounded-none', 'rounded-md', 'rounded-xl', 'rounded-3xl'].map((tok) => (
                        <button
                          key={tok}
                          onClick={() => setRadiusToken(tok)}
                          className={`tw-btn ${radiusToken === tok ? 'active' : ''}`}
                        >
                          {tok}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tw-row">
                    <span className="tw-label">BG COLOR:</span>
                    <div className="tw-btn-group">
                      {[
                        { tok: 'bg-indigo-950', hex: '#1e1b4b' },
                        { tok: 'bg-slate-900', hex: '#0f172a' },
                        { tok: 'bg-emerald-950', hex: '#064e3b' },
                      ].map((item) => (
                        <button
                          key={item.tok}
                          onClick={() => setBgToken(item.tok)}
                          className={`tw-btn ${bgToken === item.tok ? 'active' : ''}`}
                        >
                          {item.tok}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`tailwind-preview-box ${paddingToken} ${radiusToken} ${bgToken}`}
                  style={{
                    padding:
                      paddingToken === 'p-2'
                        ? '10px'
                        : paddingToken === 'p-4'
                        ? '18px'
                        : paddingToken === 'p-6'
                        ? '26px'
                        : '34px',
                    borderRadius:
                      radiusToken === 'rounded-none'
                        ? '0px'
                        : radiusToken === 'rounded-md'
                        ? '6px'
                        : radiusToken === 'rounded-xl'
                        ? '14px'
                        : '24px',
                    background:
                      bgToken === 'bg-indigo-950'
                        ? '#1e1b4b'
                        : bgToken === 'bg-slate-900'
                        ? '#0f172a'
                        : '#064e3b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="tw-box-badge">TAILWIND UTILITY ELEMENT</span>
                  <h4 className="tw-box-title">Cloud Deployment Server</h4>
                  <p className="tw-box-desc">
                    Notice how clicking the buttons above instantly updates the exact Tailwind tokens inside className on the right!
                  </p>
                </div>
              </div>
            </div>

            <div className="panel-code">
              <div className="code-header">
                <div className="code-file-name">
                  <FileCode size={13} />
                  <span>src/components/CloudServer.jsx</span>
                </div>
                <span className="sync-badge">
                  <Check size={12} />
                  <span>Synced to Disk</span>
                </span>
              </div>

              <pre className="code-content">
                <code>
                  <span className="c-kw">export function</span> <span className="c-fn">CloudServer</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  <span className="diff-highlight-add">
                    +   &lt;<span className="c-tag">div</span> <span className="c-attr">className</span>=<span className="c-str">&quot;{paddingToken} {radiusToken} {bgToken} border&quot;</span>&gt;
                  </span>{'\n'}
                  {'        '}&lt;<span className="c-tag">h4</span>&gt;Cloud Deployment Server&lt;/<span className="c-tag">h4</span>&gt;{'\n'}
                  {'        '}&lt;<span className="c-tag">p</span>&gt;Notice how clicking the buttons...&lt;/<span className="c-tag">p</span>&gt;{'\n'}
                  {'      '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
