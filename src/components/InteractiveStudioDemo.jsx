import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  MousePointer2,
  FileCode,
  Check,
  Move,
  Type,
  Maximize2,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export function InteractiveStudioDemo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: Spacing Drag, 1: Card Reorder, 2: Text Edit, 3: Border Radius
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'

  // Cursor state
  const [cursorPos, setCursorPos] = useState({ x: 80, y: 70 });
  const [isClicking, setIsClicking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltip, setTooltip] = useState('Hovering over element');

  // Interactive Live Values
  const [marginLeft, setMarginLeft] = useState(12);
  const [cardOrder, setCardOrder] = useState(['starter', 'pro', 'enterprise']);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [headline, setHeadline] = useState('Build Faster With AI');
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [borderRadius, setBorderRadius] = useState(8);
  const [selectedElement, setSelectedElement] = useState(null);

  const canvasRef = useRef(null);

  const stepsMeta = [
    { id: 0, label: '01 Spacing Drag', icon: Move, file: 'src/components/Navbar.jsx' },
    { id: 1, label: '02 Card Reorder Drag', icon: Layers, file: 'src/components/PricingGrid.jsx' },
    { id: 2, label: '03 Inline Text Edit', icon: Type, file: 'src/components/Hero.jsx' },
    { id: 3, label: '04 Border Radius Drag', icon: Maximize2, file: 'src/components/Card.jsx' },
  ];

  // Automated Step Sequences
  useEffect(() => {
    if (!isPlaying || mode !== 'auto') return;

    let timeoutId;

    if (currentStep === 0) {
      // ==========================================
      // STEP 0: SPACING DRAG
      // ==========================================
      setSelectedElement('logo');
      setTooltip('1. Hovering to select Logo element...');
      setCursorPos({ x: 90, y: 75 });
      setIsDragging(false);
      setIsClicking(false);
      setIsTextEditing(false);

      timeoutId = setTimeout(() => {
        // Click to select
        setIsClicking(true);
        setTooltip('2. Selected div.logo · Grabbing margin handle...');
        setTimeout(() => setIsClicking(false), 300);

        setTimeout(() => {
          // Start dragging margin rightward
          setIsDragging(true);
          setTooltip('3. Dragging margin handle right (+36px)...');

          // Animate drag smoothly
          let progress = 0;
          const dragInterval = setInterval(() => {
            progress += 1;
            setMarginLeft((m) => Math.min(48, 12 + progress * 3));
            setCursorPos((pos) => ({ x: 90 + progress * 10, y: 75 }));

            if (progress >= 12) {
              clearInterval(dragInterval);
              setIsDragging(false);
              setTooltip('4. Released! AST updated style={{ marginLeft: "48px" }}');

              // Proceed to next step after brief pause
              setTimeout(() => {
                setCurrentStep(1);
              }, 1800);
            }
          }, 80);
        }, 600);
      }, 700);
    } else if (currentStep === 1) {
      // ==========================================
      // STEP 1: CARD REORDER DRAG
      // ==========================================
      setSelectedElement('pro-card');
      setTooltip('1. Moving to grab Pro Card...');
      setCursorPos({ x: 280, y: 240 });
      setIsDragging(false);
      setIsClicking(false);
      setDragOverIdx(null);

      timeoutId = setTimeout(() => {
        setIsClicking(true);
        setTooltip('2. Mouse down: Grabbing Pro Card...');
        setTimeout(() => setIsClicking(false), 300);

        setTimeout(() => {
          setIsDragging(true);
          setDragOverIdx(0); // show drop indicator between cards
          setTooltip('3. Dragging Pro Card to first position...');

          // Animate card drag
          let progress = 0;
          const dragInterval = setInterval(() => {
            progress += 1;
            setCursorPos((pos) => ({ x: 280 - progress * 12, y: 240 }));

            if (progress >= 12) {
              clearInterval(dragInterval);
              // Drop into place
              setCardOrder(['pro', 'starter', 'enterprise']);
              setIsDragging(false);
              setDragOverIdx(null);
              setTooltip('4. Dropped! JSX children swapped in AST');

              setTimeout(() => {
                setCurrentStep(2);
              }, 1800);
            }
          }, 80);
        }, 600);
      }, 700);
    } else if (currentStep === 2) {
      // ==========================================
      // STEP 2: INLINE TEXT EDIT
      // ==========================================
      setSelectedElement('headline');
      setTooltip('1. Moving to headline text...');
      setCursorPos({ x: 220, y: 145 });
      setIsDragging(false);

      timeoutId = setTimeout(() => {
        // Double click
        setIsClicking(true);
        setTimeout(() => {
          setIsClicking(false);
          setIsTextEditing(true);
          setTooltip('2. Double-clicked: Inline editing mode activated');

          // Simulate typing
          const phrases = [
            'Ship In Days, Not Weeks',
          ];
          const textToType = phrases[0];
          let charIdx = 0;
          setHeadline('');

          const typeInterval = setInterval(() => {
            charIdx += 1;
            setHeadline(textToType.slice(0, charIdx));

            if (charIdx >= textToType.length) {
              clearInterval(typeInterval);
              setIsTextEditing(false);
              setTooltip('3. Committed! Hero.jsx AST updated on disk');

              setTimeout(() => {
                setCurrentStep(3);
              }, 1800);
            }
          }, 70);
        }, 300);
      }, 700);
    } else if (currentStep === 3) {
      // ==========================================
      // STEP 3: BORDER RADIUS DRAG
      // ==========================================
      setSelectedElement('radius-card');
      setTooltip('1. Moving to corner radius handle...');
      setCursorPos({ x: 380, y: 155 });
      setIsDragging(false);

      timeoutId = setTimeout(() => {
        setIsClicking(true);
        setTooltip('2. Grabbing corner radius handle...');
        setTimeout(() => setIsClicking(false), 300);

        setTimeout(() => {
          setIsDragging(true);
          setTooltip('3. Dragging radius handle to 24px (rounded-3xl)...');

          let progress = 0;
          const radiusInterval = setInterval(() => {
            progress += 1;
            setBorderRadius(8 + progress * 2);
            setCursorPos((pos) => ({ x: 380 - progress * 5, y: 155 + progress * 4 }));

            if (progress >= 8) {
              clearInterval(radiusInterval);
              setBorderRadius(24);
              setIsDragging(false);
              setTooltip('4. Released! Reconciled Tailwind token: rounded-3xl');

              // Cycle back to step 0
              setTimeout(() => {
                // reset demo values for clean loop
                setMarginLeft(12);
                setCardOrder(['starter', 'pro', 'enterprise']);
                setHeadline('Build Faster With AI');
                setBorderRadius(8);
                setCurrentStep(0);
              }, 2200);
            }
          }, 90);
        }, 600);
      }, 700);
    }

    return () => clearTimeout(timeoutId);
  }, [currentStep, isPlaying, mode]);

  const cardsData = {
    starter: { title: 'Starter Plan', price: '$0', badge: 'Hobby' },
    pro: { title: 'Pro Plan', price: '$49', badge: 'Popular' },
    enterprise: { title: 'Enterprise', price: '$199', badge: 'Scale' },
  };

  return (
    <section className="studio-demo-section">
      <div className="section-header">
        <div className="section-tag">
          <Sparkles size={13} />
          <span>REAL-TIME VISUAL WORKFLOW</span>
        </div>
        <h2 className="section-title">Watch the Guided Arrow in Action</h2>
        <p className="section-subtitle">
          Watch the arrow select elements, drag spacing, reorder cards, and edit text live.
          Every visual action updates the real VS Code source code on the right with git-clean AST diffs.
        </p>

        {/* Studio Controls Header */}
        <div className="studio-top-bar">
          <div className="mode-switch-group">
            <button
              onClick={() => {
                setMode('auto');
                setIsPlaying(true);
              }}
              className={`mode-pill ${mode === 'auto' ? 'active' : ''}`}
            >
              <Play size={12} />
              <span>Guided Arrow Tour</span>
            </button>
            <button
              onClick={() => {
                setMode('manual');
                setIsPlaying(false);
              }}
              className={`mode-pill ${mode === 'manual' ? 'active' : ''}`}
            >
              <MousePointer2 size={12} />
              <span>Try It Yourself</span>
            </button>
          </div>

          {mode === 'auto' && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="tour-toggle-btn"
              title={isPlaying ? 'Pause animation' : 'Resume animation'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause Demo' : 'Resume Demo'}</span>
            </button>
          )}

          {/* Quick-Jump Step Pills */}
          <div className="step-pills-row">
            {stepsMeta.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentStep(s.id);
                    setMode('auto');
                    setIsPlaying(true);
                  }}
                  className={`step-jump-pill ${currentStep === s.id ? 'active' : ''}`}
                >
                  <Icon size={12} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Studio Dual Screen Container */}
      <div className="studio-stage-frame">
        {/* Left Screen: Simulated Web Page & Inspector */}
        <div className="studio-left-browser" ref={canvasRef}>
          <div className="browser-chrome-bar">
            <div className="chrome-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <div className="chrome-address-bar">
              <span className="addr-lock">🔒</span>
              <span className="addr-url">localhost:5173/app</span>
            </div>
            <div className="chrome-flux-badge">
              <span className="pulse-indicator" />
              <span>FluxEdit Active (Alt+Click)</span>
            </div>
          </div>

          <div className="browser-page-body">
            {/* Guided Arrow Character Overlay */}
            {mode === 'auto' && (
              <div
                className={`studio-arrow-pointer ${isDragging ? 'dragging' : ''}`}
                style={{
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                  transition: isDragging
                    ? 'none'
                    : 'left 0.45s cubic-bezier(0.2, 0.8, 0.4, 1), top 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)',
                }}
              >
                <svg className="arrow-svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={isDragging ? '#4f46e5' : '#6366f1'}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                  />
                </svg>

                {isClicking && <span className="arrow-click-wave" />}

                {/* Floating Tooltip Callout */}
                <div className="arrow-callout-badge">
                  <span className="callout-bolt">⚡</span>
                  <span className="callout-text">{tooltip}</span>
                </div>
              </div>
            )}

            {/* Simulated Nav Bar (Spacing Target) */}
            <div className="preview-nav-bar">
              <div
                className={`preview-brand-el ${selectedElement === 'logo' ? 'selected' : ''}`}
                style={{ marginLeft: `${marginLeft}px`, transition: isDragging ? 'none' : 'margin 0.2s ease' }}
              >
                {selectedElement === 'logo' && (
                  <div className="selection-overlay-tag">
                    <span>div.logo · ml: {marginLeft}px</span>
                    <span className="drag-handle-knob" />
                  </div>
                )}
                <span className="brand-logo-title">LaunchFlow ⚡</span>
              </div>

              <div className="preview-nav-links">
                <span>Features</span>
                <span>Pricing</span>
                <button className="preview-nav-btn">Sign In</button>
              </div>
            </div>

            {/* Simulated Hero Card (Text Edit & Border Radius Target) */}
            <div
              className={`preview-hero-card ${selectedElement === 'headline' || selectedElement === 'radius-card' ? 'selected' : ''}`}
              style={{
                borderRadius: `${borderRadius}px`,
                transition: 'border-radius 0.2s ease',
              }}
            >
              {selectedElement === 'radius-card' && (
                <div className="radius-corner-handle">
                  <span>radius: {borderRadius}px</span>
                  <span className="handle-dot" />
                </div>
              )}

              <span className="preview-badge">New Release v2.0</span>

              {/* Editable Headline */}
              <div className={`editable-headline-wrap ${isTextEditing ? 'editing' : ''}`}>
                <h3 className="preview-headline">
                  {headline}
                  {isTextEditing && <span className="blinking-text-cursor" />}
                </h3>
                {selectedElement === 'headline' && !isTextEditing && (
                  <div className="inline-edit-hint">Double-click to edit</div>
                )}
              </div>

              <p className="preview-desc">
                Notice how dragging spacing, reordering cards, and editing text dynamically updates this live page and your VS Code file!
              </p>
            </div>

            {/* Simulated Cards Grid (Reorder Target) */}
            <div className="preview-cards-grid">
              {dragOverIdx === 0 && <div className="card-drop-indicator-bar" />}
              {cardOrder.map((key) => {
                const card = cardsData[key];
                const isSelected = selectedElement === `${key}-card`;
                return (
                  <div
                    key={key}
                    className={`preview-card-item ${isSelected ? 'selected' : ''} ${key === 'pro' && isDragging ? 'dragging-card' : ''}`}
                  >
                    <div className="pc-header">
                      <span className="pc-title">{card.title}</span>
                      <span className="pc-badge">{card.badge}</span>
                    </div>
                    <div className="pc-price">{card.price}<span>/mo</span></div>
                    {isSelected && (
                      <div className="card-drag-hint">
                        <Move size={10} />
                        <span>Drag to reorder</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Screen: Live VS Code JSX File */}
        <div className="studio-right-vscode">
          <div className="vscode-header">
            <div className="vscode-file-info">
              <FileCode size={14} color="#60a5fa" />
              <span className="vscode-filename">{stepsMeta[currentStep].file}</span>
            </div>
            <div className="vscode-sync-pill">
              <Check size={12} color="#10b981" />
              <span>Synced to Disk</span>
            </div>
          </div>

          <pre className="vscode-code-body">
            <code>
              {currentStep === 0 && (
                <>
                  <span className="c-kw">export function</span> <span className="c-fn">Navbar</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  {'    '}&lt;<span className="c-tag">header</span> <span className="c-attr">className</span>=<span className="c-str">&quot;nav-header&quot;</span>&gt;{'\n'}
                  <span className="diff-highlight-add">
                    +     &lt;<span className="c-tag">div</span> <span className="c-attr">style</span>=&#123;&#123; <span className="c-prop">marginLeft</span>: <span className="c-str">&quot;{marginLeft}px&quot;</span> &#125;&#125; <span className="c-attr">className</span>=<span className="c-str">&quot;logo&quot;</span>&gt;{'\n'}
                    +       LaunchFlow ⚡{'\n'}
                    +     &lt;/<span className="c-tag">div</span>&gt;
                  </span>{'\n'}
                  {'      '}&lt;<span className="c-tag">nav</span>&gt;Features · Pricing&lt;/<span className="c-tag">nav</span>&gt;{'\n'}
                  {'    '}&lt;/<span className="c-tag">header</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </>
              )}

              {currentStep === 1 && (
                <>
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
                </>
              )}

              {currentStep === 2 && (
                <>
                  <span className="c-kw">export function</span> <span className="c-fn">Hero</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  {'    '}&lt;<span className="c-tag">div</span> <span className="c-attr">className</span>=<span className="c-str">&quot;hero-card&quot;</span>&gt;{'\n'}
                  {'      '}&lt;<span className="c-tag">span</span>&gt;New Release v2.0&lt;/<span className="c-tag">span</span>&gt;{'\n'}
                  <span className="diff-highlight-add">
                    +     &lt;<span className="c-tag">h3</span>&gt;{headline}&lt;/<span className="c-tag">h3</span>&gt;
                  </span>{'\n'}
                  {'      '}&lt;<span className="c-tag">p</span>&gt;Notice how dragging spacing...&lt;/<span className="c-tag">p</span>&gt;{'\n'}
                  {'    '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </>
              )}

              {currentStep === 3 && (
                <>
                  <span className="c-kw">export function</span> <span className="c-fn">Card</span>() &#123;{'\n'}
                  {'  '}<span className="c-kw">return</span> ({'\n'}
                  <span className="diff-highlight-add">
                    +   &lt;<span className="c-tag">div</span> <span className="c-attr">className</span>=<span className="c-str">&quot;{borderRadius >= 24 ? 'rounded-3xl' : borderRadius >= 16 ? 'rounded-2xl' : 'rounded-md'} border p-6 bg-slate-900&quot;</span>&gt;
                  </span>{'\n'}
                  {'        '}&lt;<span className="c-tag">h3</span>&gt;{headline}&lt;/<span className="c-tag">h3</span>&gt;{'\n'}
                  {'        '}&lt;<span className="c-tag">p</span>&gt;Notice how dragging spacing...&lt;/<span className="c-tag">p</span>&gt;{'\n'}
                  {'      '}&lt;/<span className="c-tag">div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  &#125;
                </>
              )}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
