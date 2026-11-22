import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MousePointerClick,
  Undo2,
  Redo2,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Move,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  GripVertical,
  FileCode2,
  X,
  Check,
  Sparkles,
  AlertTriangle,
  Crosshair,
  Sliders,
  Palette,
} from 'lucide-react';
import './editor-styles.css';

function parsePx(val) {
  const num = parseInt(val, 10);
  return Number.isFinite(num) ? num : 0;
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return '';
  return (
    '#' +
    m
      .slice(0, 3)
      .map((x) => Number(x).toString(16).padStart(2, '0'))
      .join('')
  );
}

function getFileFromLoc(loc) {
  if (!loc) return '';
  const lastColon = loc.lastIndexOf(':');
  const secondColon = loc.lastIndexOf(':', lastColon - 1);
  return secondColon !== -1 ? loc.slice(0, secondColon) : '';
}

function getFriendlyName(el) {
  if (!el) return '';
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
  const tag = el.tagName.toLowerCase();
  if (el.classList.contains('demo-logo')) return `Logo ("${text.slice(0, 16)}")`;
  if (el.classList.contains('demo-card')) {
    const title = el.querySelector('.price-tag, h3, div')?.textContent?.trim() || '';
    return title ? `Card (${title.slice(0, 15)})` : 'Card';
  }
  if (el.classList.contains('btn-primary') || el.classList.contains('btn-secondary')) {
    return `Button ("${text.slice(0, 14)}")`;
  }
  if (['h1', 'h2', 'h3'].includes(tag)) {
    return `${tag.toUpperCase()} ("${text.slice(0, 18)}${text.length > 18 ? '…' : ''}")`;
  }
  if (el.classList.contains('demo-nav')) return 'Navbar Header';
  if (el.classList.contains('demo-links')) return 'Nav Links';
  if (tag === 'span' && el.parentElement?.classList.contains('demo-links')) {
    return `Link ("${text}")`;
  }
  if (text.length > 0 && text.length < 20) return `"${text}"`;
  const cls =
    typeof el.className === 'string'
      ? el.className
          .trim()
          .split(/\s+/)
          .find((c) => c && !c.startsWith('fe-'))
      : '';
  return cls ? `${tag}.${cls}` : tag;
}

const GRADIENT_PRESETS = [
  { name: 'Indigo Glow', from: '#6366f1', to: '#a855f7' },
  { name: 'Sunset Blaze', from: '#f43f5e', to: '#f59e0b' },
  { name: 'Cyber Violet', from: '#8b5cf6', to: '#ec4899' },
  { name: 'Ocean Emerald', from: '#06b6d4', to: '#10b981' },
  { name: 'Aurora Tech', from: '#3b82f6', to: '#14b8a6' },
  { name: 'Midnight Slate', from: '#334155', to: '#0f172a' },
];

function readElementVisualState(el) {
  if (!el) return null;
  const cs = window.getComputedStyle(el);
  const textNodes = Array.from(el.childNodes).filter(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
  );
  const hasDirectText = textNodes.length > 0;
  const directText = hasDirectText
    ? textNodes.map((n) => n.textContent).join(' ').trim()
    : (el.textContent || '').trim();
  const bgImg = cs.backgroundImage || '';
  const hasGrad =
    bgImg.includes('gradient') ||
    (typeof el.className === 'string' && el.className.includes('bg-gradient-'));

  return {
    tag: el.tagName.toLowerCase(),
    displayTag: getFriendlyName(el),
    loc: el.getAttribute('data-fe-loc') || '',
    isDynamic: el.getAttribute('data-fe-dynamic') === 'true',
    canEditText: el.childElementCount === 0 || hasDirectText,
    hasDirectText,
    text: directText,
    className: el.getAttribute('class') || '',
    display: cs.display,
    flexDirection: cs.flexDirection,
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    gap: parsePx(cs.gap),
    padding: parsePx(cs.paddingTop),
    marginTop: parsePx(cs.marginTop),
    marginLeft: parsePx(cs.marginLeft),
    marginRight: parsePx(cs.marginRight),
    fontSize: parsePx(cs.fontSize),
    borderRadius: parsePx(cs.borderRadius),
    textAlign: cs.textAlign,
    color: rgbToHex(cs.color) || '#0f172a',
    backgroundColor: rgbToHex(cs.backgroundColor) || '',
    backgroundImage: bgImg,
    hasGradient: hasGrad,
  };
}

function rectsEqual(a, b) {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Secure fetch wrapper for dev server communication.
 * Always attaches custom security headers to satisfy CSRF/Origin enforcement.
 */
async function fluxFetch(url, options = {}) {
  const headers = {
    'x-flux-client': 'true',
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}

export function VisualEditor() {
  if (import.meta.env.PROD) return null;
  return <VisualEditorOverlay />;
}

function VisualEditorOverlay() {
  const [editMode, setEditMode] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [gradFrom, setGradFrom] = useState('#6366f1');
  const [gradTo, setGradTo] = useState('#a855f7');
  const [gradDir, setGradDir] = useState('r');
  const [taggedCount, setTaggedCount] = useState(0);
  const [quickTargets, setQuickTargets] = useState([]);
  const [hoverBox, setHoverBox] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [selectedRect, setSelectedRect] = useState(null);
  const [elProps, setElProps] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [showDiffDrawer, setShowDiffDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dropBox, setDropBox] = useState(null);
  const [dropBar, setDropBar] = useState(null);
  const [dragGhost, setDragGhost] = useState(null);

  const selectedElRef = useRef(null);
  const selectedInstanceIndexRef = useRef(0);
  const inlineEditingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pendingStyleRef = useRef({ loc: null, styles: {} });
  const styleTimerRef = useRef(null);
  const dropTargetRef = useRef(null);
  const suppressNextClickRef = useRef(false);
  const [, setSelectionRevision] = useState(0);

  const showNotice = useCallback((text, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const selectElementNode = useCallback((el) => {
    if (!el) return;
    const loc = el.getAttribute('data-fe-loc');
    if (!loc) return;

    // Track the exact instance index among elements sharing this loc
    const allMatches = Array.from(document.querySelectorAll(`[data-fe-loc="${CSS.escape(loc)}"]`));
    const idx = allMatches.indexOf(el);
    selectedInstanceIndexRef.current = idx !== -1 ? idx : 0;

    selectedElRef.current = el;
    setSelectedLoc(loc);
    setIsPanelOpen(true);
    setSelectionRevision((r) => r + 1);

    const r = el.getBoundingClientRect();
    setSelectedRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    setElProps(readElementVisualState(el));
    setHoverBox(null);
  }, []);

  const scanEditableElements = useCallback(() => {
    const nodes = Array.from(document.querySelectorAll('[data-fe-loc]'));
    setTaggedCount(nodes.length);
    if (nodes.length > 0) {
      try {
        sessionStorage.removeItem('fe_reloaded_once');
      } catch {}
    }
    const picks = nodes
      .filter((el) => {
        const tag = el.tagName.toLowerCase();
        return ['h1', 'h2', 'button', 'p'].includes(tag) || el.classList.contains('demo-card');
      })
      .slice(0, 7)
      .map((el) => ({
        loc: el.getAttribute('data-fe-loc'),
        tag: getFriendlyName(el),
        label: (el.textContent || el.tagName).trim().slice(0, 28),
      }));
    setQuickTargets(picks);
    return nodes.length;
  }, []);

  // Updates ONLY the blue bounding rectangle when layout moves; never overwrites form inputs or wrong node!
  const syncRectOnly = useCallback(() => {
    let el = selectedElRef.current;
    if (!el || !el.isConnected) {
      if (!selectedLoc) {
        selectedElRef.current = null;
        setSelectedRect((prev) => (prev === null ? prev : null));
        return;
      }
      const allMatches = Array.from(document.querySelectorAll(`[data-fe-loc="${CSS.escape(selectedLoc)}"]`));
      el = allMatches[selectedInstanceIndexRef.current] || allMatches[0] || null;
    }

    if (el) {
      selectedElRef.current = el;
      const r = el.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      setSelectedRect((prev) => (rectsEqual(prev, next) ? prev : next));
    } else {
      selectedElRef.current = null;
      setSelectedRect((prev) => (prev === null ? prev : null));
    }
  }, [selectedLoc]);

  const fetchSourceSnippet = useCallback(async (loc) => {
    if (!loc) {
      setSourceInfo(null);
      return;
    }
    try {
      const res = await fluxFetch(`/__flux_edit/source?loc=${encodeURIComponent(loc)}`);
      const data = await res.json();
      if (data.ok) setSourceInfo(data);
    } catch {
      // ignore
    }
  }, []);

  const refreshSelectionAfterHmr = useCallback(
    (loc) => {
      if (!loc) return;
      const applySync = () => {
        const allMatches = Array.from(document.querySelectorAll(`[data-fe-loc="${CSS.escape(loc)}"]`));
        const el = allMatches[selectedInstanceIndexRef.current] || allMatches[0];
        if (el) {
          selectedElRef.current = el;
          const r = el.getBoundingClientRect();
          setSelectedRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          if (!inlineEditingRef.current) {
            setElProps(readElementVisualState(el));
          }
        }
        scanEditableElements();
      };
      setTimeout(applySync, 90);
      setTimeout(applySync, 250);
      fetchSourceSnippet(loc);
    },
    [fetchSourceSnippet, scanEditableElements]
  );

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fluxFetch('/__flux_edit/history');
      const data = await res.json();
      if (data.ok) {
        setCanUndo(data.canUndo);
        setCanRedo(data.canRedo);
        setAuditLog(data.auditLog || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const mutateSource = useCallback(
    async (action, payload = {}, targetLocOverride = null) => {
      const locToUse = targetLocOverride || selectedLoc;
      if (!locToUse) return false;
      setIsSaving(true);
      try {
        const res = await fluxFetch('/__flux_edit/mutate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loc: locToUse, action, payload }),
        });
        const data = await res.json();
        if (!data.ok) {
          showNotice(data.error || 'Could not apply code edit', true);
          return false;
        }
        setCanUndo(data.canUndo);
        setCanRedo(data.canRedo);
        setAuditLog(data.auditLog || []);
        showNotice(`VS Code synced: ${data.summary}`);

        if (data.newLoc) {
          setSelectedLoc(data.newLoc);
          refreshSelectionAfterHmr(data.newLoc);
        } else {
          setSelectedLoc(null);
          setElProps(null);
          setSourceInfo(null);
          setTimeout(scanEditableElements, 150);
        }
        return true;
      } catch (err) {
        showNotice(err.message || 'Server error', true);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [selectedLoc, showNotice, refreshSelectionAfterHmr, scanEditableElements]
  );

  const handleUndo = useCallback(async () => {
    try {
      const res = await fluxFetch('/__flux_edit/undo', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) return showNotice(data.error || 'Nothing to undo', true);
      setCanUndo(data.canUndo);
      setCanRedo(data.canRedo);
      setAuditLog(data.auditLog || []);
      showNotice(data.summary);
      if (data.newLoc) {
        setSelectedLoc(data.newLoc);
        refreshSelectionAfterHmr(data.newLoc);
      }
    } catch {
      showNotice('Undo failed', true);
    }
  }, [showNotice, refreshSelectionAfterHmr]);

  const handleRedo = useCallback(async () => {
    try {
      const res = await fluxFetch('/__flux_edit/redo', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) return showNotice(data.error || 'Nothing to redo', true);
      setCanUndo(data.canUndo);
      setCanRedo(data.canRedo);
      setAuditLog(data.auditLog || []);
      showNotice(data.summary);
      if (data.newLoc) {
        setSelectedLoc(data.newLoc);
        refreshSelectionAfterHmr(data.newLoc);
      }
    } catch {
      showNotice('Redo failed', true);
    }
  }, [showNotice, refreshSelectionAfterHmr]);

  // Keep blue selection rectangle aligned on scroll/resize/page HMR (ignoring FluxEdit's own UI!)
  useEffect(() => {
    if (!editMode) {
      document.body.classList.remove('fe-editing-active');
      setHoverBox(null);
      return;
    }
    document.body.classList.add('fe-editing-active');
    const count = scanEditableElements();
    syncRectOnly();

    // Auto-recover once if stale cached ES modules lacked data-fe-loc while Vite server is active
    let cacheCheckTimer = null;
    if (count === 0) {
      cacheCheckTimer = setTimeout(async () => {
        if (document.querySelectorAll('[data-fe-loc]').length > 0) return;
        const rootHasContent = (document.getElementById('root')?.childElementCount || 0) > 0;
        if (!rootHasContent) return;
        try {
          const alreadyReloaded = sessionStorage.getItem('fe_reloaded_once');
          if (!alreadyReloaded) {
            const res = await fluxFetch('/__flux_edit/history');
            if (res.ok) {
              sessionStorage.setItem('fe_reloaded_once', '1');
              window.location.reload();
            }
          }
        } catch {}
      }, 250);
    }

    let scanQueued = false;
    const obs = new MutationObserver((mutations) => {
      const allInsideOverlay = mutations.every(
        (m) => m.target instanceof Element && m.target.closest('[data-flux-ui]')
      );
      if (allInsideOverlay) return;
      requestAnimationFrame(syncRectOnly);
      if (!scanQueued && mutations.some((m) => m.type === 'childList')) {
        scanQueued = true;
        requestAnimationFrame(() => {
          scanQueued = false;
          scanEditableElements();
        });
      }
    });

    const appRoot = document.getElementById('root') || document.body;
    obs.observe(appRoot, { childList: true, subtree: true, attributes: true });
    window.addEventListener('scroll', syncRectOnly, true);
    window.addEventListener('resize', syncRectOnly);
    return () => {
      clearTimeout(cacheCheckTimer);
      document.body.classList.remove('fe-editing-active');
      obs.disconnect();
      window.removeEventListener('scroll', syncRectOnly, true);
      window.removeEventListener('resize', syncRectOnly);
    };
  }, [editMode, selectedLoc, syncRectOnly, scanEditableElements]);

  useEffect(() => {
    if (selectedLoc) {
      fetchSourceSnippet(selectedLoc);
    } else {
      setSourceInfo(null);
    }
  }, [selectedLoc, fetchSourceSnippet]);

  // Global keyboard shortcuts (Alt+E, Ctrl+Z, Esc)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setEditMode((v) => !v);
        return;
      }
      if (!editMode || inlineEditingRef.current) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'Escape') {
        if (selectedLoc) setSelectedLoc(null);
        else setEditMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editMode, selectedLoc, handleUndo, handleRedo]);

  // Reusable drag tracker with insertion drop bar + seamless empty-space position dragging
  const beginSiblingDragSession = useCallback(
    (dragEl, dragLoc, startX = 0, startY = 0, allowAncestorPromotion = false) => {
      if (!dragEl || !dragEl.parentElement) return;
      if (dragEl.getAttribute('data-fe-dynamic') === 'true') {
        showNotice('Loop items (.map) cannot be dragged individually', true);
        return;
      }

      const parent = dragEl.parentElement;
      const initialCs = window.getComputedStyle(dragEl);
      const initialMarginLeft = parsePx(initialCs.marginLeft);
      const initialMarginTop = parsePx(initialCs.marginTop);
      const dragFile = getFileFromLoc(dragLoc);
      const dragLabel = getFriendlyName(dragEl);

      isDraggingRef.current = true;
      suppressNextClickRef.current = true;
      setHoverBox(null);
      document.body.style.cursor = 'grabbing';
      setDragGhost({ x: startX, y: startY, label: `Move ${dragLabel}`, mode: 'drag', ready: false });

      let lastDx = 0;
      let lastDy = 0;

      const findDropResolution = (clientX, clientY) => {
        const hitNodes = document.elementsFromPoint(clientX, clientY);
        const candidates = [];
        for (const node of hitNodes) {
          if (!(node instanceof Element) || node.closest('[data-flux-ui]')) continue;
          let cur = node.closest('[data-fe-loc]');
          while (cur) {
            if (!candidates.includes(cur)) candidates.push(cur);
            cur = cur.parentElement?.closest('[data-fe-loc]') || null;
          }
        }

        // Priority 1: Direct sibling in the same container
        let sibling = candidates.find(
          (c) =>
            c !== dragEl &&
            c.parentElement === parent &&
            c.getAttribute('data-fe-dynamic') !== 'true'
        );

        // Proximity detection: if cursor is near siblings in the same parent container
        if (!sibling && parent) {
          const siblings = Array.from(parent.children).filter(
            (c) =>
              c !== dragEl &&
              c.getAttribute?.('data-fe-loc') &&
              c.getAttribute('data-fe-dynamic') !== 'true'
          );
          let closest = null;
          let minDist = 220;
          for (const s of siblings) {
            const sr = s.getBoundingClientRect();
            const sCenterX = sr.left + sr.width / 2;
            const sCenterY = sr.top + sr.height / 2;
            const dist = Math.hypot(clientX - sCenterX, clientY - sCenterY);
            if (dist < minDist) {
              minDist = dist;
              closest = s;
            }
          }
          if (closest) sibling = closest;
        }

        if (sibling) {
          const r = sibling.getBoundingClientRect();
          const parentCs = parent ? window.getComputedStyle(parent) : null;
          const isRow = parentCs
            ? (parentCs.display.includes('flex') && parentCs.flexDirection.startsWith('row')) ||
              parentCs.display.includes('inline')
            : false;
          const isLeftHalf = isRow
            ? clientX < r.left + r.width / 2
            : clientY < r.top + r.height / 2;
          return {
            sourceEl: dragEl,
            sourceLoc: dragLoc,
            targetEl: sibling,
            targetLoc: sibling.getAttribute('data-fe-loc'),
            mode: 'swap',
            targetRect: r,
            isLeftHalf,
            label: `Place ${isLeftHalf ? 'before' : 'after'} ${getFriendlyName(sibling)}`,
          };
        }

        // Priority 2: When dragging an unselected child inside a card/column onto a sibling card
        if (allowAncestorPromotion) {
          let anc = dragEl.parentElement?.closest('[data-fe-loc]') || null;
          while (anc) {
            const ancLoc = anc.getAttribute('data-fe-loc') || '';
            const ancFile = getFileFromLoc(ancLoc);
            if (ancFile !== dragFile || anc.getAttribute('data-fe-dynamic') === 'true') break;

            const ancParent = anc.parentElement;
            if (ancParent && ancParent.id !== 'root') {
              const sibAnc = candidates.find(
                (c) =>
                  c !== anc &&
                  c.parentElement === ancParent &&
                  c.tagName === anc.tagName &&
                  c.getAttribute('data-fe-dynamic') !== 'true' &&
                  getFileFromLoc(c.getAttribute('data-fe-loc')) === ancFile
              );
              if (sibAnc) {
                const r = sibAnc.getBoundingClientRect();
                return {
                  sourceEl: anc,
                  sourceLoc: ancLoc,
                  targetEl: sibAnc,
                  targetLoc: sibAnc.getAttribute('data-fe-loc'),
                  mode: 'swap',
                  targetRect: r,
                  label: `Swap ${getFriendlyName(anc)} ↔ ${getFriendlyName(sibAnc)}`,
                };
              }
            }
            anc = anc.parentElement?.closest('[data-fe-loc]') || null;
          }
        }

        // Priority 3: Cross-container move to any non-overlapping element in the same file
        const cross = candidates.find((c) => {
          if (c === dragEl || dragEl.contains(c) || c.contains(dragEl)) return false;
          if (c.getAttribute('data-fe-dynamic') === 'true') return false;
          return getFileFromLoc(c.getAttribute('data-fe-loc')) === dragFile;
        });

        if (cross) {
          const r = cross.getBoundingClientRect();
          return {
            sourceEl: dragEl,
            sourceLoc: dragLoc,
            targetEl: cross,
            targetLoc: cross.getAttribute('data-fe-loc'),
            mode: 'move',
            targetRect: r,
            label: `Move ${dragLabel} → ${getFriendlyName(cross)}`,
          };
        }

        return null;
      };

      const onMove = (me) => {
        const dx = Math.round(me.clientX - startX);
        const dy = Math.round(me.clientY - startY);
        lastDx = dx;
        lastDy = dy;

        // Temporarily ignore dragEl for elementsFromPoint so elements underneath can be detected
        const prevPe = dragEl.style.pointerEvents;
        dragEl.style.pointerEvents = 'none';
        const res = findDropResolution(me.clientX, me.clientY);
        dragEl.style.pointerEvents = prevPe;

        if (res) {
          dragEl.style.transform = '';
          dropTargetRef.current = res;
          const r = res.targetRect;

          // Draw an accurate insertion bar line
          const barLeft = res.isLeftHalf ? r.left - 2 : r.right - 1;
          setDropBar({
            top: r.top - 2,
            left: barLeft,
            width: 3,
            height: r.height + 4,
            label: res.label,
          });
          setDropBox(null);
          setDragGhost({
            x: me.clientX,
            y: me.clientY,
            label: res.label,
            mode: res.mode,
            ready: true,
          });
        } else {
          // If no drop target under cursor: seamlessly shift element visually!
          dropTargetRef.current = null;
          setDropBar(null);
          setDropBox(null);

          dragEl.style.transform = `translate(${dx}px, ${dy}px)`;
          dragEl.style.zIndex = '999990';
          syncRectOnly();

          const xLabel = dx >= 0 ? `+${dx}px` : `${dx}px`;
          setDragGhost({
            x: me.clientX,
            y: me.clientY,
            label: `Move Position (X: ${xLabel})`,
            mode: 'position',
            ready: true,
          });
        }
      };

      const onUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        setDragGhost(null);
        setDropBar(null);
        setDropBox(null);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);

        dragEl.style.transform = '';
        dragEl.style.zIndex = '';
        syncRectOnly();

        setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 120);

        const resolved = dropTargetRef.current;
        dropTargetRef.current = null;

        if (resolved?.targetLoc && resolved?.sourceLoc) {
          if (resolved.sourceEl !== dragEl) {
            selectElementNode(resolved.sourceEl);
          }
          mutateSource('moveSibling', { targetLoc: resolved.targetLoc }, resolved.sourceLoc);
        } else {
          // Dragged in empty space or cancelled: do NOT corrupt layout with random margins!
          // Smoothly reset transform
          dragEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
          dragEl.style.transform = '';
          setTimeout(() => {
            if (dragEl) dragEl.style.transition = '';
          }, 200);
          if (Math.abs(lastDx) > 30 || Math.abs(lastDy) > 30) {
            showNotice('Drop onto a neighboring card or button to swap in JSX');
          }
        }
      };

      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
    },
    [mutateSource, selectElementNode, syncRectOnly, showNotice]
  );

  // Hover, Click-Select, Direct Drag (>8px), and Double-Click Inline Text Edit
  useEffect(() => {
    if (!editMode) return;

    const findAnnotatedTarget = (target) => {
      if (!target || !(target instanceof Element)) return null;
      if (target.closest('[data-flux-ui]')) return null;
      return target.closest('[data-fe-loc]');
    };

    const onMouseMove = (e) => {
      try {
        if (inlineEditingRef.current || isDraggingRef.current) return;
        const el = findAnnotatedTarget(e.target);
        if (!el) {
          setHoverBox(null);
          return;
        }
        if (el === selectedElRef.current) {
          setHoverBox(null);
          return;
        }
        const loc = el.getAttribute('data-fe-loc');
        const r = el.getBoundingClientRect();
        const shortFile = getFileFromLoc(loc).split('/').pop();
        const line = loc.split(':').slice(-2, -1)[0];
        setHoverBox({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          label: `<${getFriendlyName(el)}> · ${shortFile}:${line}`,
        });
      } catch (err) {
        showNotice(`Hover error: ${err.message}`, true);
      }
    };

    const onDragStart = (e) => {
      if (e.target instanceof Element && !e.target.closest('[data-flux-ui]')) {
        e.preventDefault();
      }
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      if (inlineEditingRef.current) return;
      const hitEl = findAnnotatedTarget(e.target);
      if (!hitEl) return;

      // Prevent native button/link actions from triggering while in Edit Mode
      const interactive = e.target instanceof Element && e.target.closest('button, a, [role="button"], input, select');
      if (interactive && !e.target.closest('[data-flux-ui]')) {
        e.preventDefault();
      }

      const explicitSelection = Boolean(selectedElRef.current && selectedElRef.current.contains(hitEl));
      const dragEl = explicitSelection ? selectedElRef.current : hitEl;

      const startX = e.clientX;
      const startY = e.clientY;
      const loc = dragEl.getAttribute('data-fe-loc');
      let startedDrag = false;

      const onCheckDrag = (me) => {
        const dist = Math.hypot(me.clientX - startX, me.clientY - startY);
        if (dist > 14 && !startedDrag) {
          startedDrag = true;
          suppressNextClickRef.current = true;
          window.removeEventListener('pointermove', onCheckDrag, true);
          window.removeEventListener('pointerup', onCancelCheck, true);
          selectElementNode(dragEl);
          beginSiblingDragSession(dragEl, loc, me.clientX, me.clientY, !explicitSelection);
        }
      };

      const onCancelCheck = () => {
        window.removeEventListener('pointermove', onCheckDrag, true);
        window.removeEventListener('pointerup', onCancelCheck, true);
      };

      window.addEventListener('pointermove', onCheckDrag, true);
      window.addEventListener('pointerup', onCancelCheck, true);
    };

    const onClick = (e) => {
      try {
        if (e.target instanceof Element && e.target.closest('[data-flux-ui]')) return;
        if (inlineEditingRef.current) return;
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Suppress native action for buttons and links in Edit Mode
        const interactive = e.target instanceof Element && e.target.closest('button, a, [role="button"], input, select');
        if (interactive && !e.target.closest('[data-flux-ui]')) {
          e.preventDefault();
          e.stopPropagation();
        }

        const el = findAnnotatedTarget(e.target);
        if (!el) return;

        e.preventDefault();
        e.stopPropagation();
        selectElementNode(el);
      } catch (err) {
        showNotice(`Click error: ${err.message}`, true);
      }
    };

    const onDblClick = (e) => {
      try {
        if (e.target instanceof Element && e.target.closest('[data-flux-ui]')) return;
        const el = findAnnotatedTarget(e.target);
        if (!el) return;

        e.preventDefault();
        e.stopPropagation();

        const loc = el.getAttribute('data-fe-loc');

        // Case 1: Element has child elements (e.g. <button>Start Free Trial <ArrowRight /></button>)
        if (el.childElementCount > 0) {
          const directTextNode = Array.from(el.childNodes).find(
            (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
          );
          if (!directTextNode) {
            showNotice('Double-click a specific text element (not a container)', true);
            return;
          }

          const originalDirectText = directTextNode.textContent.trim();
          const editSpan = document.createElement('span');
          editSpan.setAttribute('data-flux-inline-edit', 'true');
          editSpan.setAttribute('contenteditable', 'true');
          editSpan.style.outline = '2px solid #10b981';
          editSpan.style.borderRadius = '4px';
          editSpan.style.padding = '0 2px';
          editSpan.textContent = originalDirectText;
          directTextNode.replaceWith(editSpan);
          inlineEditingRef.current = true;
          editSpan.focus();

          const range = document.createRange();
          range.selectNodeContents(editSpan);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);

          const commitDirectText = async (newText) => {
            const clean = (newText || '').trim();
            const replacementNode = document.createTextNode(clean ? ` ${clean} ` : '');
            editSpan.replaceWith(replacementNode);
            window.removeEventListener('pointerdown', onOuterDown, true);
            editSpan.removeEventListener('keydown', onKey);
            editSpan.removeEventListener('blur', onBlur);
            inlineEditingRef.current = false;

            if (clean && clean !== originalDirectText) {
              const ok = await mutateSource(
                'editText',
                { text: clean, instanceIndex: selectedInstanceIndexRef.current },
                loc
              );
              if (ok) {
                setElProps((prev) => (prev ? { ...prev, text: clean } : prev));
              }
            }
          };

          const onKey = (ke) => {
            if (ke.key === 'Enter') {
              ke.preventDefault();
              commitDirectText(editSpan.textContent || '');
            } else if (ke.key === 'Escape') {
              ke.preventDefault();
              commitDirectText(originalDirectText);
            }
          };

          const onBlur = () => {
            commitDirectText(editSpan.textContent || '');
          };

          const onOuterDown = (oe) => {
            if (!editSpan.contains(oe.target)) {
              commitDirectText(editSpan.textContent || '');
            }
          };

          editSpan.addEventListener('keydown', onKey);
          editSpan.addEventListener('blur', onBlur);
          setTimeout(() => window.addEventListener('pointerdown', onOuterDown, true), 20);
          return;
        }

        // Case 2: Simple text element without children
        const originalText = el.textContent || '';
        inlineEditingRef.current = true;
        el.setAttribute('contenteditable', 'true');
        el.style.outline = '2px solid #10b981';
        el.focus();

        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);

        const finish = async (commit) => {
          if (!inlineEditingRef.current) return;
          inlineEditingRef.current = false;
          el.removeAttribute('contenteditable');
          el.style.outline = '';
          el.removeEventListener('blur', onBlur);
          el.removeEventListener('keydown', onInlineKey);

          const nextText = el.textContent ?? '';
          if (commit && nextText !== originalText) {
            const ok = await mutateSource('editText', { text: nextText, instanceIndex: selectedInstanceIndexRef.current }, loc);
            if (!ok) {
              el.textContent = originalText;
            } else {
              setElProps((prev) => (prev ? { ...prev, text: nextText } : prev));
            }
          } else {
            el.textContent = originalText;
          }
        };

        const onBlur = () => finish(true);
        const onInlineKey = (ke) => {
          if (ke.key === 'Enter' && !ke.shiftKey) {
            ke.preventDefault();
            finish(true);
          } else if (ke.key === 'Escape') {
            ke.preventDefault();
            finish(false);
          }
        };

        el.addEventListener('blur', onBlur);
        el.addEventListener('keydown', onInlineKey);
      } catch (err) {
        showNotice(`Inline edit error: ${err.message}`, true);
      }
    };

    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('dblclick', onDblClick, true);

    return () => {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('dblclick', onDblClick, true);
    };
  }, [editMode, selectedLoc, mutateSource, beginSiblingDragSession, selectElementNode, showNotice]);

  // Live 60FPS style preview -> debounced AST disk write
  const previewAndCommitStyle = (key, value, immediate = false) => {
    const locSnapshot = selectedLoc;
    if (!locSnapshot) return;

    if (selectedElRef.current) {
      selectedElRef.current.style[key] = value;
      syncRectOnly();
    }
    setElProps((prev) =>
      prev ? { ...prev, [key]: String(value).endsWith('px') ? parsePx(value) : value } : prev
    );

    if (pendingStyleRef.current.loc && pendingStyleRef.current.loc !== locSnapshot) {
      pendingStyleRef.current = { loc: locSnapshot, styles: {} };
    }
    pendingStyleRef.current.loc = locSnapshot;
    pendingStyleRef.current.styles[key] = value;

    clearTimeout(styleTimerRef.current);
    const commit = () => {
      const targetLoc = pendingStyleRef.current.loc;
      const batch = { ...pendingStyleRef.current.styles };
      pendingStyleRef.current = { loc: null, styles: {} };
      if (targetLoc && Object.keys(batch).length > 0) {
        mutateSource('updateStyle', { styles: batch }, targetLoc);
      }
    };

    if (immediate) commit();
    else styleTimerRef.current = setTimeout(commit, 220);
  };

  const applyGradientStyle = useCallback(
    (from, to, dir = 'r') => {
      setGradFrom(from);
      setGradTo(to);
      setGradDir(dir);
      const dirMap = {
        r: 'to right',
        br: 'to bottom right',
        b: 'to bottom',
        tr: 'to top right',
      };
      const cssDir = dirMap[dir] || 'to right';
      const gradCss = `linear-gradient(${cssDir}, ${from}, ${to})`;
      if (selectedElRef.current) {
        selectedElRef.current.style.backgroundImage = gradCss;
        syncRectOnly();
      }
      setElProps((prev) => (prev ? { ...prev, backgroundImage: gradCss, hasGradient: true } : prev));
      mutateSource('updateStyle', {
        styles: {
          gradient: { direction: dir, from, to },
          backgroundImage: gradCss,
        },
      });
    },
    [mutateSource, syncRectOnly]
  );

  const clearGradientStyle = useCallback(() => {
    if (selectedElRef.current) {
      selectedElRef.current.style.backgroundImage = '';
      syncRectOnly();
    }
    setElProps((prev) => (prev ? { ...prev, backgroundImage: '', hasGradient: false } : prev));
    mutateSource('updateStyle', {
      styles: {
        gradient: null,
        backgroundImage: '',
      },
    });
  }, [mutateSource, syncRectOnly]);

  const nudgeElement = useCallback(
    (dir, amount = 12) => {
      if (!selectedElRef.current || !selectedLoc) return;
      const cs = window.getComputedStyle(selectedElRef.current);
      const curLeft = parsePx(cs.marginLeft);
      const curTop = parsePx(cs.marginTop);

      if (dir === 'left') {
        const next = Math.max(0, curLeft - amount);
        previewAndCommitStyle('marginLeft', `${next}px`, true);
      } else if (dir === 'right') {
        const next = curLeft + amount;
        previewAndCommitStyle('marginLeft', `${next}px`, true);
      } else if (dir === 'up') {
        const next = Math.max(0, curTop - amount);
        previewAndCommitStyle('marginTop', `${next}px`, true);
      } else if (dir === 'down') {
        const next = curTop + amount;
        previewAndCommitStyle('marginTop', `${next}px`, true);
      } else if (dir === 'start') {
        previewAndCommitStyle('marginLeft', '0px', true);
        previewAndCommitStyle('marginRight', 'auto', true);
      } else if (dir === 'center') {
        previewAndCommitStyle('marginLeft', 'auto', true);
        previewAndCommitStyle('marginRight', 'auto', true);
      } else if (dir === 'end') {
        previewAndCommitStyle('marginLeft', 'auto', true);
        previewAndCommitStyle('marginRight', '0px', true);
      }
    },
    [selectedLoc, previewAndCommitStyle]
  );

  const beginPositionDragSession = useCallback(
    (dragEl, dragLoc, startClientX, startClientY) => {
      if (!dragEl) return;
      const initialCs = window.getComputedStyle(dragEl);
      const initialMarginLeft = parsePx(initialCs.marginLeft);
      const initialMarginTop = parsePx(initialCs.marginTop);

      isDraggingRef.current = true;
      suppressNextClickRef.current = true;
      document.body.style.cursor = 'move';
      setHoverBox(null);
      setDropBox(null);
      setDropBar(null);

      let finalDx = 0;
      let finalDy = 0;

      const onMove = (me) => {
        const dx = Math.round(me.clientX - startClientX);
        const dy = Math.round(me.clientY - startClientY);
        finalDx = dx;
        finalDy = dy;

        dragEl.style.transform = `translate(${dx}px, ${dy}px)`;
        dragEl.style.zIndex = '999990';
        syncRectOnly();

        const xLabel = dx >= 0 ? `+${dx}px` : `${dx}px`;
        const yLabel = dy >= 0 ? `+${dy}px` : `${dy}px`;

        setDragGhost({
          x: me.clientX,
          y: me.clientY,
          label: `Offset X: ${xLabel} · Y: ${yLabel}`,
          mode: 'position',
          ready: true,
        });
      };

      const onUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        setDragGhost(null);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);

        dragEl.style.transform = '';
        dragEl.style.zIndex = '';
        syncRectOnly();

        setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 120);

        if (Math.abs(finalDx) > 3 || Math.abs(finalDy) > 3) {
          const updates = {};
          if (Math.abs(finalDx) > 3) {
            updates.marginLeft = `${Math.max(0, initialMarginLeft + finalDx)}px`;
          }
          if (Math.abs(finalDy) > 4) {
            updates.marginTop = `${Math.max(0, initialMarginTop + finalDy)}px`;
          }
          mutateSource('updateStyle', { styles: updates }, dragLoc);
        }
      };

      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
    },
    [mutateSource, syncRectOnly]
  );

  const selectParentElement = () => {
    const parent = selectedElRef.current?.parentElement?.closest('[data-fe-loc]');
    if (parent) {
      selectElementNode(parent);
    } else {
      showNotice('Reached top-level container in this file', true);
    }
  };

  return (
    <div data-flux-ui="true">
      {/* Top Helper Banner when Edit Mode is active */}
      {editMode && !toast && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999988,
            background: taggedCount > 0 ? 'rgba(15, 23, 42, 0.92)' : '#9f1239',
            color: '#e2e8f0',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            border: '1px solid rgba(99, 102, 241, 0.45)',
            boxShadow: '0 8px 24px rgba(2, 6, 23, 0.25)',
            pointerEvents: taggedCount > 0 ? 'none' : 'auto',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {taggedCount > 0 ? (
            `Edit Mode ON · ${taggedCount} JSX elements ready · Click, double-click text, or drag`
          ) : (
            <>
              <span>0 JSX elements detected — plugin cache may need refresh</span>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#ffffff',
                  color: '#9f1239',
                  border: 'none',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
            </>
          )}
        </div>
      )}

      {/* Hover Highlight Box */}
      {editMode && hoverBox && (
        <div
          className="fe-hover-box"
          style={{
            top: hoverBox.top,
            left: hoverBox.left,
            width: hoverBox.width,
            height: hoverBox.height,
          }}
        >
          <span className="fe-hover-tag">{hoverBox.label}</span>
        </div>
      )}

      {/* Drop Target Box (during sibling drag) */}
      {editMode && dropBox && (
        <div
          className="fe-drop-box"
          style={{
            top: dropBox.top,
            left: dropBox.left,
            width: dropBox.width,
            height: dropBox.height,
          }}
        />
      )}

      {/* Drop Insertion Bar (Visual Reorder Line) */}
      {editMode && dropBar && (
        <div
          className="fe-drop-bar"
          style={{
            top: dropBar.top,
            left: dropBar.left,
            width: dropBar.width,
            height: dropBar.height,
          }}
        >
          {dropBar.label && <span className="fe-drop-bar-label">{dropBar.label}</span>}
        </div>
      )}

      {/* Floating Cursor Drag Ghost */}
      {editMode && dragGhost && (
        <div
          className={`fe-drag-ghost ${dragGhost.ready ? 'ready' : ''} ${dragGhost.mode === 'position' ? 'position' : ''}`}
          style={{
            left: dragGhost.x + 14,
            top: dragGhost.y + 14,
          }}
        >
          {dragGhost.label || 'Dragging…'}
        </div>
      )}

      {/* Selected Element Box + Floating Quick Micro-Bar */}
      {editMode && selectedRect && elProps && (
        <>
          <div
            className="fe-select-box"
            style={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
            }}
          />
          <div
            className="fe-select-bar"
            style={{
              top: Math.max(8, selectedRect.top - 36),
              left: Math.max(8, selectedRect.left),
            }}
          >
            <span className="fe-bar-title" title={elProps.displayTag}>
              {elProps.displayTag}
            </span>

            {/* Instant 1-Click Left/Right Nudges */}
            <button
              onClick={() => nudgeElement('left', 12)}
              title="Nudge Left 12px (decreases marginLeft in JSX on disk)"
            >
              <ChevronLeft size={12} /> 12px
            </button>
            <button
              onClick={() => nudgeElement('right', 12)}
              title="Nudge Right 12px (increases marginLeft in JSX on disk)"
            >
              12px <ChevronRight size={12} />
            </button>

            {/* Direct Drag to Move */}
            <button
              className="primary"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                beginPositionDragSession(selectedElRef.current, selectedLoc, e.clientX, e.clientY);
              }}
              style={{ cursor: 'move' }}
              title="Drag anywhere to move element position (adjusts margin in code)"
            >
              <Move size={12} /> Move
            </button>

            {/* Drag to Reorder */}
            {!elProps.isDynamic && (
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  beginSiblingDragSession(selectedElRef.current, selectedLoc, e.clientX, e.clientY);
                }}
                style={{ cursor: 'grab' }}
                title="Drag onto another element to reorder JSX in code"
              >
                <GripVertical size={12} /> Reorder
              </button>
            )}

            <button onClick={selectParentElement} title="Select parent container">
              <ArrowUp size={11} /> Parent
            </button>
          </div>
        </>
      )}

      {/* Docked Right DevTools Inspector — Immediately visible in Edit Mode! */}
      {editMode && (
        <aside className={`fe-inspector ${!isPanelOpen ? 'fe-collapsed' : ''}`}>
          {!selectedLoc || !elProps ? (
            <>
              <div className="fe-insp-head">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Crosshair size={15} color="#818cf8" />
                    <span>FluxEdit Inspector</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {taggedCount} JSX nodes mapped on page
                  </div>
                </div>
                <button
                  className="fe-act-btn"
                  style={{ padding: '4px 6px' }}
                  onClick={() => setIsPanelOpen(false)}
                  aria-label="Collapse Inspector"
                  title="Close Inspector (reopen from bottom toolbar)"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="fe-insp-body">
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: '#e2e8f0',
                  }}
                >
                  <strong>How to Edit Live:</strong>
                  <ul style={{ paddingLeft: 16, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li><strong>Click</strong> any card, text, or button on the page</li>
                    <li><strong>Double-click</strong> any text to edit inline</li>
                    <li><strong>Drag</strong> a button/card onto its neighbor to swap in JSX</li>
                  </ul>
                </div>

                {quickTargets.length > 0 && (
                  <div className="fe-section">
                    <div className="fe-label">Quick-Select Element</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {quickTargets.map((item) => (
                        <button
                          key={item.loc}
                          className="fe-act-btn"
                          style={{ justifyContent: 'space-between', padding: '8px 10px' }}
                          onClick={() => {
                            const node = document.querySelector(`[data-fe-loc="${CSS.escape(item.loc)}"]`);
                            if (node) {
                              node.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              selectElementNode(node);
                            }
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 10,
                              color: '#818cf8',
                              marginLeft: 8,
                            }}
                          >
                            &lt;{item.tag}&gt;
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="fe-insp-head">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#818cf8' }}>&lt;{elProps.displayTag}&gt;</span>
                    {isSaving && (
                      <span style={{ fontSize: 10.5, color: '#34d399', fontWeight: 600 }}>
                        Writing AST...
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: '#94a3b8',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={selectedLoc}
                  >
                    {selectedLoc}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="fe-act-btn"
                    style={{ padding: '4px 6px' }}
                    onClick={() => setSelectedLoc(null)}
                    aria-label="Back to overview"
                    title="Back to element list"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="fe-act-btn"
                    style={{ padding: '4px 6px' }}
                    onClick={() => setIsPanelOpen(false)}
                    aria-label="Collapse Inspector"
                    title="Close Inspector (reopen from bottom toolbar)"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="fe-insp-body">
                {elProps.isDynamic && (
                  <div className="fe-banner-warn">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, marginBottom: 2 }}>
                      <AlertTriangle size={13} /> Loop Template (.map)
                    </div>
                    Style edits apply to all items in this loop. Individual sibling drag is disabled.
                  </div>
                )}

                {/* Reorder & Actions */}
                <div className="fe-section">
                  <div className="fe-label">
                    <span>Position &amp; Structure</span>
                    <button
                      onClick={selectParentElement}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      ↑ Select Parent
                    </button>
                  </div>
                  <div className="fe-btn-grid">
                    <button
                      className="fe-act-btn"
                      disabled={elProps.isDynamic}
                      onClick={() => mutateSource('moveSibling', { direction: 'prev' })}
                    >
                      <ArrowLeft size={13} /> Move Earlier
                    </button>
                    <button
                      className="fe-act-btn"
                      disabled={elProps.isDynamic}
                      onClick={() => mutateSource('moveSibling', { direction: 'next' })}
                    >
                      Move Later <ArrowRight size={13} />
                    </button>
                    <button
                      className="fe-act-btn"
                      onClick={() => mutateSource('duplicateElement')}
                    >
                      <Copy size={13} /> Duplicate
                    </button>
                    <button
                      className="fe-act-btn danger"
                      onClick={() => mutateSource('deleteElement')}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>

                {/* Text Editor */}
                {elProps.canEditText && (
                  <div className="fe-section">
                    <div className="fe-label">
                      <span>Text Content</span>
                      <span style={{ fontSize: 10, color: '#64748b' }}>or dbl-click page</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="fe-input"
                        value={elProps.text}
                        onChange={(e) => setElProps({ ...elProps, text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (selectedElRef.current) {
                              if (elProps.hasDirectText && selectedElRef.current.childElementCount > 0) {
                                const directTextNode = Array.from(selectedElRef.current.childNodes).find(
                                  (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
                                );
                                if (directTextNode) directTextNode.textContent = ` ${elProps.text} `;
                              } else {
                                selectedElRef.current.textContent = elProps.text;
                              }
                            }
                            mutateSource('editText', { text: elProps.text, instanceIndex: selectedInstanceIndexRef.current });
                          }
                        }}
                      />
                      <button
                        className="fe-act-btn active"
                        onClick={() => {
                          if (selectedElRef.current) {
                            if (elProps.hasDirectText && selectedElRef.current.childElementCount > 0) {
                              const directTextNode = Array.from(selectedElRef.current.childNodes).find(
                                (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
                              );
                              if (directTextNode) directTextNode.textContent = ` ${elProps.text} `;
                            } else {
                              selectedElRef.current.textContent = elProps.text;
                            }
                          }
                          mutateSource('editText', { text: elProps.text, instanceIndex: selectedInstanceIndexRef.current });
                        }}
                        title="Save text to code"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Layout & Flex Controls */}
                <div className="fe-section">
                  <div className="fe-label">Layout &amp; Alignment</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                    {['block', 'flex', 'grid'].map((d) => (
                      <button
                        key={d}
                        className={`fe-act-btn ${elProps.display === d ? 'active' : ''}`}
                        onClick={() => previewAndCommitStyle('display', d, true)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {elProps.display.includes('flex') && (
                    <>
                      <div className="fe-btn-grid">
                        <button
                          className={`fe-act-btn ${elProps.flexDirection === 'row' ? 'active' : ''}`}
                          onClick={() => previewAndCommitStyle('flexDirection', 'row', true)}
                        >
                          Row →
                        </button>
                        <button
                          className={`fe-act-btn ${elProps.flexDirection === 'column' ? 'active' : ''}`}
                          onClick={() => previewAndCommitStyle('flexDirection', 'column', true)}
                        >
                          Column ↓
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                        {[
                          { val: 'flex-start', label: 'Start' },
                          { val: 'center', label: 'Center' },
                          { val: 'space-between', label: 'Between' },
                        ].map((j) => (
                          <button
                            key={j.val}
                            className={`fe-act-btn ${elProps.justifyContent === j.val ? 'active' : ''}`}
                            onClick={() => previewAndCommitStyle('justifyContent', j.val, true)}
                          >
                            {j.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {(elProps.display.includes('flex') || elProps.display.includes('grid')) && (
                    <div className="fe-slider-row">
                      <span>Gap</span>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={elProps.gap}
                        onChange={(e) => previewAndCommitStyle('gap', `${e.target.value}px`)}
                      />
                      <span className="tabular-nums">{elProps.gap}px</span>
                    </div>
                  )}
                </div>

                {/* Spacing, Alignment & Position */}
                <div className="fe-section">
                  <div className="fe-label">Position &amp; Spacing</div>

                  {/* Quick Alignment */}
                  <div className="fe-align-grid" style={{ marginBottom: 4 }}>
                    <button
                      className="fe-act-btn"
                      onClick={() => nudgeElement('start')}
                      title="Align Left (margin-left: 0, margin-right: auto)"
                    >
                      <AlignLeft size={13} /> Left
                    </button>
                    <button
                      className="fe-act-btn"
                      onClick={() => nudgeElement('center')}
                      title="Align Center (margin: auto)"
                    >
                      <AlignCenter size={13} /> Center
                    </button>
                    <button
                      className="fe-act-btn"
                      onClick={() => nudgeElement('end')}
                      title="Align Right (margin-left: auto, margin-right: 0)"
                    >
                      <AlignRight size={13} /> Right
                    </button>
                  </div>

                  {/* 1-Click Nudge Left / Right */}
                  <div className="fe-btn-grid" style={{ marginBottom: 6 }}>
                    <button
                      className="fe-act-btn"
                      onClick={() => nudgeElement('left', 12)}
                      title="Nudge Left 12px"
                    >
                      <ChevronLeft size={13} /> Move Left
                    </button>
                    <button
                      className="fe-act-btn"
                      onClick={() => nudgeElement('right', 12)}
                      title="Nudge Right 12px"
                    >
                      Move Right <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Horizontal Spacing Sliders */}
                  <div className="fe-slider-row">
                    <span>Margin Left</span>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={elProps.marginLeft || 0}
                      onChange={(e) => previewAndCommitStyle('marginLeft', `${e.target.value}px`)}
                    />
                    <span>{elProps.marginLeft || 0}px</span>
                  </div>
                  <div className="fe-slider-row">
                    <span>Margin Right</span>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={elProps.marginRight || 0}
                      onChange={(e) => previewAndCommitStyle('marginRight', `${e.target.value}px`)}
                    />
                    <span>{elProps.marginRight || 0}px</span>
                  </div>
                  <div className="fe-slider-row">
                    <span>Margin Top</span>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      value={elProps.marginTop || 0}
                      onChange={(e) => previewAndCommitStyle('marginTop', `${e.target.value}px`)}
                    />
                    <span>{elProps.marginTop || 0}px</span>
                  </div>
                  <div className="fe-slider-row">
                    <span>Padding</span>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      value={elProps.padding || 0}
                      onChange={(e) => previewAndCommitStyle('padding', `${e.target.value}px`)}
                    />
                    <span>{elProps.padding || 0}px</span>
                  </div>
                  <div className="fe-slider-row">
                    <span>Radius</span>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={elProps.borderRadius || 0}
                      onChange={(e) => previewAndCommitStyle('borderRadius', `${e.target.value}px`)}
                    />
                    <span>{elProps.borderRadius || 0}px</span>
                  </div>
                  <div className="fe-slider-row">
                    <span>Font Size</span>
                    <input
                      type="range"
                      min="11"
                      max="64"
                      value={elProps.fontSize || 14}
                      onChange={(e) => previewAndCommitStyle('fontSize', `${e.target.value}px`)}
                    />
                    <span>{elProps.fontSize || 14}px</span>
                  </div>
                </div>

                {/* Colors */}
                <div className="fe-section">
                  <div className="fe-label">Colors</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Text</div>
                      <div className="fe-color-row">
                        <input
                          type="color"
                          className="fe-color-swatch"
                          value={elProps.color || '#0f172a'}
                          onChange={(e) => previewAndCommitStyle('color', e.target.value)}
                        />
                        <input
                          className="fe-input"
                          value={elProps.color}
                          onChange={(e) => {
                            const v = e.target.value;
                            setElProps({ ...elProps, color: v });
                            if (/^#[0-9a-f]{6}$/i.test(v)) previewAndCommitStyle('color', v);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Fill</div>
                      <div className="fe-color-row">
                        <input
                          type="color"
                          className="fe-color-swatch"
                          value={elProps.backgroundColor || '#ffffff'}
                          onChange={(e) => previewAndCommitStyle('backgroundColor', e.target.value)}
                        />
                        <input
                          className="fe-input"
                          placeholder="none"
                          value={elProps.backgroundColor}
                          onChange={(e) => {
                            const v = e.target.value;
                            setElProps({ ...elProps, backgroundColor: v });
                            if (/^#[0-9a-f]{6}$/i.test(v) || v === '') {
                              previewAndCommitStyle('backgroundColor', v);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gradient Studio */}
                <div className="fe-section">
                  <div className="fe-label">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Palette size={13} color="#818cf8" />
                      <span>Gradient Studio</span>
                    </div>
                    {elProps.hasGradient && (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f43f5e',
                          cursor: 'pointer',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                        onClick={clearGradientStyle}
                      >
                        Clear Gradient
                      </button>
                    )}
                  </div>

                  {/* Direction Controls */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    {[
                      { dir: 'r', label: '→ Right' },
                      { dir: 'br', label: '↘ Diag' },
                      { dir: 'b', label: '↓ Down' },
                      { dir: 'tr', label: '↗ Up-Rt' },
                    ].map((d) => (
                      <button
                        key={d.dir}
                        className={`fe-grad-dir-btn ${gradDir === d.dir ? 'active' : ''}`}
                        onClick={() => applyGradientStyle(gradFrom, gradTo, d.dir)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Presets */}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Modern Presets</div>
                  <div className="fe-grad-presets-grid">
                    {GRADIENT_PRESETS.map((p) => (
                      <div
                        key={p.name}
                        className={`fe-grad-chip ${gradFrom === p.from && gradTo === p.to ? 'active' : ''}`}
                        style={{ background: `linear-gradient(to right, ${p.from}, ${p.to})` }}
                        onClick={() => applyGradientStyle(p.from, p.to, gradDir)}
                        title={p.name}
                      >
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Custom Stops */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 3 }}>From Stop</div>
                      <div className="fe-color-row">
                        <input
                          type="color"
                          className="fe-color-swatch"
                          value={gradFrom}
                          onChange={(e) => applyGradientStyle(e.target.value, gradTo, gradDir)}
                        />
                        <input
                          className="fe-input"
                          value={gradFrom}
                          onChange={(e) => {
                            const v = e.target.value;
                            setGradFrom(v);
                            if (/^#[0-9a-f]{6}$/i.test(v)) applyGradientStyle(v, gradTo, gradDir);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 3 }}>To Stop</div>
                      <div className="fe-color-row">
                        <input
                          type="color"
                          className="fe-color-swatch"
                          value={gradTo}
                          onChange={(e) => applyGradientStyle(gradFrom, e.target.value, gradDir)}
                        />
                        <input
                          className="fe-input"
                          value={gradTo}
                          onChange={(e) => {
                            const v = e.target.value;
                            setGradTo(v);
                            if (/^#[0-9a-f]{6}$/i.test(v)) applyGradientStyle(gradFrom, v, gradDir);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ClassName Editor */}
                <div className="fe-section">
                  <div className="fe-label">CSS className</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="fe-input"
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                      value={elProps.className}
                      onChange={(e) => setElProps({ ...elProps, className: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          mutateSource('updateClassName', { className: elProps.className });
                        }
                      }}
                    />
                    <button
                      className="fe-act-btn active"
                      onClick={() => mutateSource('updateClassName', { className: elProps.className })}
                      title="Save className"
                    >
                      <Check size={13} />
                    </button>
                  </div>
                </div>

                {/* Live Disk Source View */}
                {sourceInfo && (
                  <div className="fe-section">
                    <div className="fe-label">
                      <span>Live Disk Source ({sourceInfo.file})</span>
                    </div>
                    <div className="fe-source-box">
                      {sourceInfo.snippet.map((ln) => (
                        <div
                          key={ln.lineNum}
                          className={`fe-source-line ${ln.highlight ? 'hl' : ''}`}
                        >
                          <span style={{ color: '#475569', userSelect: 'none', width: 22 }}>
                            {ln.lineNum}
                          </span>
                          <span>{ln.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      )}

      {/* Live Diff History Drawer */}
      {showDiffDrawer && (
        <div className="fe-diff-drawer">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <strong style={{ fontSize: 13 }}>Recent AST Writes to Disk (VS Code Synced)</strong>
            <button
              className="fe-act-btn"
              style={{ padding: '3px 7px' }}
              onClick={() => setShowDiffDrawer(false)}
            >
              <X size={13} />
            </button>
          </div>
          {auditLog.length === 0 ? (
            <div style={{ color: '#94a3b8', padding: '12px 0' }}>
              No edits yet. Turn on Edit Mode and tweak any element on the page!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    background: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{entry.summary}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {entry.file} · {entry.time}
                    </span>
                  </div>
                  {entry.diffLines?.length > 0 && (
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {entry.diffLines.map((dl, idx) => (
                        <div
                          key={idx}
                          style={{
                            color: dl.type === 'add' ? '#34d399' : '#fda4af',
                            background:
                              dl.type === 'add'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(244, 63, 94, 0.1)',
                            padding: '1px 6px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {dl.type === 'add' ? '+' : '-'} {dl.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Control Pill */}
      <div className="fe-toolbar">
        <button
          className={`fe-pill-btn ${editMode ? 'active' : ''}`}
          onClick={() => {
            setEditMode((v) => !v);
            if (editMode) setSelectedLoc(null);
          }}
        >
          <MousePointerClick size={15} />
          <span>{editMode ? 'Editing Live (Alt+E)' : 'Edit UI Live'}</span>
        </button>

        {editMode && (
          <>
            <div className="fe-divider" />
            <button
              className={`fe-pill-btn ${isPanelOpen ? 'active' : ''}`}
              onClick={() => setIsPanelOpen((v) => !v)}
              title="Toggle Inspector Sidebar"
            >
              <Sliders size={14} />
              <span>Inspector</span>
            </button>
            <div className="fe-divider" />
            <button
              className="fe-pill-btn"
              disabled={!canUndo}
              onClick={handleUndo}
              title="Undo last disk edit (Ctrl+Z)"
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              className="fe-pill-btn"
              disabled={!canRedo}
              onClick={handleRedo}
              title="Redo edit (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </>
        )}

        <div className="fe-divider" />

        <button
          className={`fe-pill-btn ${showDiffDrawer ? 'active' : ''}`}
          onClick={() => setShowDiffDrawer((v) => !v)}
        >
          <FileCode2 size={14} />
          <span>Diffs ({auditLog.length})</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {toast && (
        <div className={`fe-toast ${toast.isError ? 'error' : ''}`}>
          <Sparkles size={14} color={toast.isError ? '#fecdd3' : '#34d399'} />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

export default VisualEditor;

