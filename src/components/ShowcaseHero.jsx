import React from 'react';
import { Sparkles, Terminal, Layers, Move, Sliders, Type, History } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Playables (6)', icon: Layers },
  { id: 'text', label: 'Inline Text Edit', icon: Type },
  { id: 'nudge', label: '1-Click Nudge', icon: Sliders },
  { id: 'reorder', label: 'Card Reordering', icon: Move },
  { id: 'tailwind', label: 'Tailwind Engine', icon: Sparkles },
  { id: 'history', label: 'Undo / Redo History', icon: History },
];

export function ShowcaseHero({ selectedCategory, setSelectedCategory }) {
  return (
    <section className="showcase-hero">
      <div className="hero-top-badge">
        <Sparkles size={13} className="sparkle-icon" />
        <span>Interactive Component Playground · Powered by Babel AST &amp; Vite</span>
      </div>

      <h1 className="hero-main-title">
        The Component Visual Editor <br />
        <span className="hero-gradient-text">for Design Engineers &amp; Developers</span>
      </h1>

      <p className="hero-subtext">
        Click, nudge, drag, and reorder React components directly in your browser.
        Every interaction compiles into git-clean JSX and syncs to disk in real time.
      </p>

      {/* 21st.dev style category pills filter */}
      <div className="hero-category-pills">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-pill ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} className="cat-icon" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
