'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface OutputPanelProps {
  content: string;
  quality?: number;
  onCopy?: (content: string) => void;
  className?: string;
}

export const OutputPanel = ({ content, quality = 0, onCopy, className = '' }: OutputPanelProps) => {
  const [copied, setCopied] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    barRef.current?.style.setProperty('--progress-width', `${quality}%`);
  }, [quality]);

  const stats = useMemo(() => ({
    chars: content.length,
    tokens: Math.ceil(content.length / 4),
  }), [content]);

  const handleCopy = async () => {
    if (!content.trim()) return;
    await navigator.clipboard.writeText(content);
    onCopy?.(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border border-border bg-surface3 overflow-hidden shadow-2xl ${className}`}>
      <div className="flex justify-between items-center px-4 py-3 bg-accent/5 border-b border-border">
        <span className="font-mono text-[10px] text-accent font-bold tracking-[0.2em] uppercase">
          ▸ prompt optimizado
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar prompt al portapapeles"
          className="flex items-center gap-2 bg-accent text-black font-mono text-[10px] font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied ? 'COPIADO' : 'COPIAR'}
        </button>
      </div>

      <div className="p-6 font-mono text-[11px] leading-relaxed text-text bg-surface3/50 min-h-[260px] whitespace-pre-wrap select-all overflow-auto">
        {content || <span className="text-muted italic opacity-50">Configura los parámetros para generar tu prompt de alto rendimiento...</span>}
      </div>

      <div className="p-4 bg-black/30 border-t border-border">
        <div className="flex justify-between items-end mb-3">
          <div className="flex gap-4 font-mono text-[10px] text-muted uppercase">
            <span>Chars: <span className="text-text">{stats.chars}</span></span>
            <span>Tokens: <span className="text-accent-blue">~{stats.tokens}</span></span>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[9px] text-muted mb-1 uppercase tracking-wider">
              {quality >= 90 ? 'Legendario' : quality >= 75 ? 'Maestro' : quality >= 55 ? 'Experto' : quality >= 30 ? 'Sólido' : 'Básico'}
            </span>
            <span className={`font-mono text-xs font-bold ${quality >= 75 ? 'text-accent' : quality >= 40 ? 'text-accent-blue' : 'text-muted'}`}>
              {quality}%
            </span>
          </div>
        </div>

        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            ref={barRef}
            className={`h-full transition-all duration-700 ease-out [width:var(--progress-width)] ${quality > 80 ? 'bg-accent shadow-[0_0_8px_rgba(0,229,160,0.5)]' : 'bg-accent-blue'}`}
            role="progressbar"
            aria-label={`Calidad del prompt: ${quality}%`}
          />
        </div>
      </div>
    </div>
  );
};
