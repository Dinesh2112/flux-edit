import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  MousePointer,
  Sparkles,
  Sliders,
  Move,
  Type,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Terminal,
  ExternalLink,
} from 'lucide-react';

/* ==========================================================================
   Interactive Guided Cursor Character & Live Studio
   ========================================================================== */

export function CursorShowcaseStudio() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0 to 6
  const [mode, setMode] = useState('auto'); // 'auto' | 'freeplay'
  const [speed, setSpeed] = useState(1); // 1x or 1.5x

  // Stage Element States
  const [headlineText, setHeadlineText] = useState('Fix AI-Generated UI Fast');
  const [buttonMarginLeft, setButtonMarginLeft] = useState(0);
  const [cardsOrder, setCardsOrder] = useState(['starter', 'pro', 'enterprise']);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null); // 'headline' | 'button' | 'card'

  // Cursor Character State
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 140 });
  const [isClicking, setIsClicking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorMessage, setCursorMessage] = useState('Hey! Watch me edit this page live 👇');

  // DOM Refs for dynamic cursor target positions
  const stageRef = useRef(null);
  const headlineRef = useRef(null);
  const buttonRef = useRef(null);
  const proCardRef = useRef(null);
  const starterCardRef = useRef(null);
  const inspectorNudgeRef = useRef(null);

  // Auto-tour step definitions
  const tourScript = [
    {
      id: 'intro',
      title: 'Welcome',
      msg: 'Hey! Watch how easy it is to visually edit this page 👇',
      target: null,
      action: () => {
        setSelectedElement(null);
        setIsInspectorOpen(false);
        setCursorPos({ x: 320, y: 90 });
      },
    },
    {
      id: 'text-hover',
      title: '1. Select Text',
      msg: 'Step 1: Point to any text on the website...',
      target: 'headline',
      action: () => {
        if (headlineRef.current && stageRef.current) {
          const sBox = stageRef.current.getBoundingClientRect();
          const hBox = headlineRef.current.getBoundingClientRect();
          setCursorPos({
            x: hBox.left - sBox.left + hBox.width / 2,
            y: hBox.top - sBox.top + hBox.height / 2,
          });
        }
      },
    },
    {
      id: 'text-edit',
      title: '2. Inline Edit',
      msg: 'Click! Double-click to type changes directly on screen ✍️',
      target: 'headline',
      action: () => {
        setIsClicking(true);
        setTimeout(() => setIsClicking(false), 300);
        setSelectedElement('headline');
        setHeadlineText('LaunchFlow AI — Built for Developers');
      },
    },
    {
      id: 'btn-hover',
      title: '3. Select Button',
      msg: 'Step 2: Want to move this button? Just click it...',
      target: 'button',
      action: () => {
        if (buttonRef.current && stageRef.current) {
          const sBox = stageRef.current.getBoundingClientRect();
          const bBox = buttonRef.current.getBoundingClientRect();
          setCursorPos({
            x: bBox.left - sBox.left + bBox.width / 2,
            y: bBox.top - sBox.top + bBox.height / 2,
          });
        }
        setSelectedElement('button');
      },
    },
    {
      id: 'btn-nudge',
      title: '4. Nudge Spacing',
      msg: 'Click [ +12px ] to nudge spacing left or right instantly! ⚡',
      target: 'button',
      action: () => {
        setIsClicking(true);
        setTimeout(() => setIsClicking(false), 300);
        setIsInspectorOpen(true);
        setButtonMarginLeft((m) => m + 24);
      },
    },
    {
      id: 'card-drag',
      title: '5. Drag Reorder',
      msg: 'Step 3: Drag & drop to reorder cards in the JSX tree! 🚀',
      target: 'card',
      action: () => {
        if (proCardRef.current && stageRef.current) {
          const sBox = stageRef.current.getBoundingClientRect();
          const pBox = proCardRef.current.getBoundingClientRect();
          setCursorPos({
            x: pBox.left - sBox.left + pBox.width / 2,
            y: pBox.top - sBox.top + 30,
          });
        }
        setIsDragging(true);
        setTimeout(() => {
          setCardsOrder(['pro', 'starter', 'enterprise']);
          setIsDragging(false);
        }, 800);
      },
    },
    {
      id: 'done',
      title: '6. VS Code Synced',
      msg: 'Done! All changes saved to VS Code on disk. Try it yourself! 🎉',
      target: null,
      action: () => {
        setSelectedElement(null);
        setIsInspectorOpen(false);
        setCursorPos({ x: 380, y: 70 });
      },
    },
  ];

  // Auto-tour runner timer
  useEffect(() => {
    if (!isPlaying || mode !== 'auto') return;

    const timer = setTimeout(
      () => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % tourScript.length;
          return next;
        });
      },
      (currentStep === 0 || currentStep === tourScript.length - 1 ? 3800 : 2600) / speed
    );

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, mode, speed]);

  // Execute step action whenever currentStep updates
  useEffect(() => {
    if (mode === 'auto' && tourScript[currentStep]) {
      const step = tourScript[currentStep];
      setCursorMessage(step.msg);
      step.action();
    }
  }, [currentStep, mode]);

  // Jump to specific tour step
  const goToStep = (idx) => {
    setMode('auto');
    setIsPlaying(false);
    setCurrentStep(idx);
    tourScript[idx].action();
    setCursorMessage(tourScript[idx].msg);
  };

  const resetAll = () => {
    setHeadlineText('Fix AI-Generated UI Fast');
    setButtonMarginLeft(0);
    setCardsOrder(['starter', 'pro', 'enterprise']);
    setSelectedElement(null);
    setIsInspectorOpen(false);
    setCurrentStep(0);
    setIsPlaying(true);
    setMode('auto');
    setCursorMessage('Tour reset! Watch me edit this page live 👇');
    setCursorPos({ x: 320, y: 90 });
  };

  // Switch to Free Play
  const enableFreePlay = () => {
    setMode('freeplay');
    setIsPlaying(false);
    setCursorMessage('🎮 Free Play Active! Click, nudge, or drag anything below yourself!');
  };

  return (
    <section className="studio-hero-wrapper">
      {/* Hero Headline */}
      <div className="studio-hero-header">
        <div className="studio-hero-badge">
          <Sparkles size={13} className="sparkle" />
          <span>Interactive Visual Walkthrough · Powered by FluxEdit AST Engine</span>
        </div>

        <h1 className="studio-main-headline">
          Meet Your Real-Time <br />
          <span className="studio-gradient-title">React Visual Editor</span>
        </h1>

        <p className="studio-sub-headline">
          Watch our animated guide below show you how to edit text, nudge buttons, and drag cards — or take over the mouse and try it yourself!
        </p>

        {/* Tour Navigation Controls Bar */}
        <div className="tour-action-bar">
          <div className="tour-playback-group">
            <button
              onClick={() => {
                setMode('auto');
                setIsPlaying(!isPlaying);
              }}
              className="tour-play-btn"
            >
              {isPlaying && mode === 'auto' ? (
                <>
                  <Pause size={13} />
                  <span>Pause Tour</span>
                </>
              ) : (
                <>
                  <Play size={13} />
                  <span>Play Tour</span>
                </>
              )}
            </button>

            <button onClick={resetAll} className="tour-reset-btn" title="Reset all changes">
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="tour-steps-pills">
            {tourScript.slice(1, 6).map((st, sIdx) => {
              const active = mode === 'auto' && currentStep === sIdx + 1;
              return (
                <button
                  key={st.id}
                  onClick={() => goToStep(sIdx + 1)}
                  className={`tour-step-pill ${active ? 'active' : ''}`}
                >
                  <span className="pill-dot" />
                  <span>{st.title}</span>
                </button>
              );
            })}

            <button
              onClick={enableFreePlay}
              className={`tour-step-pill freeplay ${mode === 'freeplay' ? 'active' : ''}`}
            >
              <span>🎮 Free Play (Take Control)</span>
            </button>
          </div>
        </div>
      </div>

      {/* The Live Interactive Studio Stage */}
      <div className="studio-screen-frame">
        {/* Top Browser Bar */}
        <div className="studio-browser-chrome">
          <div className="chrome-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="chrome-url-box">
            <span>http://localhost:5173/ · Live AST Dev Mode (Alt+E Active)</span>
          </div>
          <div className="chrome-status-tag">
            <span className="status-pulse-dot" />
            <span>{mode === 'auto' ? 'AI TOUR RUNNING' : 'FREE PLAY ACTIVE'}</span>
          </div>
        </div>

        {/* Inside Stage: The Live Website Canvas */}
        <div ref={stageRef} className="studio-stage-canvas">
          {/* Animated Guided Cursor Character */}
          <div
            className={`guided-cursor-character ${isClicking ? 'clicking' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
              transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
              transition: isDragging
                ? 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
                : 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {/* The SVG Cursor Arrow */}
            <svg
              className="cursor-pointer-svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </svg>

            {/* Click Ripple Effect */}
            {isClicking && <span className="click-ripple" />}

            {/* Cursor Speech / Guide Bubble */}
            <div className="cursor-speech-bubble">
              <div className="bubble-author">
                <span className="author-dot" />
                <span>Flux Guide</span>
              </div>
              <div className="bubble-text">{cursorMessage}</div>
            </div>
          </div>

          {/* The Actual Simulated Website Content */}
          <div className="stage-page-content">
            {/* Nav Header */}
            <header className="stage-nav">
              <div className="stage-logo">LaunchFlow ⚡</div>
              <div className="stage-nav-links">
                <span>Features</span>
                <span>Docs</span>
                <span className="stage-signin-btn">Sign In</span>
              </div>
            </header>

            {/* Hero Section */}
            <div className="stage-hero">
              <div className="stage-badge">
                <span>AI-GENERATED UI · NEEDS VISUAL FIXES</span>
              </div>

              {/* Editable Headline */}
              <div
                ref={headlineRef}
                onClick={() => {
                  setSelectedElement('headline');
                  if (mode === 'freeplay') {
                    const promptVal = prompt('Edit Headline Text:', headlineText);
                    if (promptVal) setHeadlineText(promptVal);
                  }
                }}
                className={`stage-headline-box ${selectedElement === 'headline' ? 'inspected' : ''}`}
              >
                {selectedElement === 'headline' && (
                  <div className="element-fe-tag">
                    <span>h1.hero-title · double click to edit</span>
                  </div>
                )}
                <h2>{headlineText}</h2>
              </div>

              <p className="stage-subtitle">
                Click any button or text right on the page to adjust spacing, swap cards, or fix typos in seconds.
              </p>

              {/* Action Buttons */}
              <div className="stage-btn-row">
                <button
                  ref={buttonRef}
                  onClick={() => {
                    setSelectedElement('button');
                    setIsInspectorOpen(true);
                  }}
                  style={{
                    marginLeft: `${buttonMarginLeft}px`,
                    transition: 'margin 0.2s ease',
                  }}
                  className={`stage-primary-btn ${selectedElement === 'button' ? 'inspected' : ''}`}
                >
                  {selectedElement === 'button' && (
                    <div className="element-fe-tag">
                      <span>button.btn-primary · ml: {buttonMarginLeft}px</span>
                    </div>
                  )}
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </button>
                <button className="stage-secondary-btn">Watch Demo</button>
              </div>
            </div>

            {/* Pricing Cards Row */}
            <div className="stage-cards-section">
              <div className="stage-cards-title">Pricing Plans (Drag to Reorder)</div>

              <div className="stage-cards-row">
                {cardsOrder.map((cardId) => {
                  if (cardId === 'starter') {
                    return (
                      <div
                        key="starter"
                        ref={starterCardRef}
                        className="stage-card starter"
                      >
                        <div className="c-tag">STARTER</div>
                        <div className="c-price">$0<span>/mo</span></div>
                        <p className="c-desc">For hobbyists and personal experiments.</p>
                      </div>
                    );
                  }
                  if (cardId === 'pro') {
                    return (
                      <div
                        key="pro"
                        ref={proCardRef}
                        className={`stage-card pro ${isDragging ? 'is-being-dragged' : ''}`}
                      >
                        <div className="c-tag popular">PRO (POPULAR)</div>
                        <div className="c-price">$49<span>/mo</span></div>
                        <p className="c-desc">For fast-moving engineering teams.</p>
                      </div>
                    );
                  }
                  return (
                    <div key="enterprise" className="stage-card enterprise">
                      <div className="c-tag">ENTERPRISE</div>
                      <div className="c-price">$199<span>/mo</span></div>
                      <p className="c-desc">For scaling global organizations.</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slide-in Inspector Drawer */}
          {isInspectorOpen && (
            <div className="stage-inspector-drawer">
              <div className="inspector-head">
                <span>Inspector: &lt;button&gt;</span>
                <button onClick={() => setIsInspectorOpen(false)} className="close-insp">✕</button>
              </div>

              <div className="inspector-body">
                <div className="insp-label">MARGIN LEFT: {buttonMarginLeft}px</div>
                <div className="insp-btn-row">
                  <button
                    onClick={() => setButtonMarginLeft((m) => Math.max(0, m - 12))}
                    className="insp-nudge-btn"
                  >
                    <ChevronLeft size={12} />
                    <span>-12px</span>
                  </button>
                  <button
                    ref={inspectorNudgeRef}
                    onClick={() => setButtonMarginLeft((m) => m + 12)}
                    className="insp-nudge-btn active-nudge"
                  >
                    <span>+12px</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Synchronized VS Code Code Drawer */}
        <div className="studio-code-drawer">
          <div className="code-drawer-header">
            <div className="drawer-file-info">
              <Terminal size={13} className="term-icon" />
              <span>src/components/Hero.jsx · VS Code Real-time AST Disk Sync</span>
            </div>
            <span className="diff-count-pill">
              <Check size={12} />
              <span>Babel AST Validated · Live Diff Saved</span>
            </span>
          </div>

          <pre className="studio-code-pre">
            <code>
              <span className="k">export function</span> <span className="f">Hero</span>() &#123;{'\n'}
              {'  '}<span className="k">return</span> ({'\n'}
              {'    '}&lt;<span className="t">div</span> <span className="a">className</span>=<span className="s">&quot;hero-container&quot;</span>&gt;{'\n'}
              <span className="code-diff-add">
                +     &lt;<span className="t">h1</span> <span className="a">className</span>=<span className="s">&quot;hero-title&quot;</span>&gt;{headlineText}&lt;/<span className="t">h1</span>&gt;
              </span>{'\n'}
              <span className="code-diff-add">
                +     &lt;<span className="t">button</span> <span className="a">style</span>=&#123;&#123; <span className="p">marginLeft</span>: <span className="s">&quot;{buttonMarginLeft}px&quot;</span> &#125;&#125; <span className="a">className</span>=<span className="s">&quot;btn-primary&quot;</span>&gt;
              </span>{'\n'}
              {'        '}Get Started Free{'\n'}
              {'      '}&lt;/<span className="t">button</span>&gt;{'\n'}
              {'    '}&lt;/<span className="t">div</span>&gt;{'\n'}
              {'  '});{'\n'}
              &#125;
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
