'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InputBlockProps {
  number: string;
  title: string;
  subtitle: string;
  help?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const InputBlock = ({ number, title, subtitle, help, children, className = '' }: InputBlockProps) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={`bg-surface border border-border rounded-[14px] overflow-hidden focus-within:border-accent-blue/35 transition-colors ${className}`}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-white/[0.02]">
        <span className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5 min-w-[26px] text-center">
          {number}
        </span>
        <span className="text-[13px] font-bold text-text">{title}</span>
        <span className="text-[11px] text-muted ml-1 italic font-mono opacity-60 hidden sm:inline">{subtitle}</span>
        
        {help && (
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`ml-auto p-1.5 rounded-lg transition-all ${
              showHelp ? 'bg-accent-blue/20 text-accent-blue' : 'text-muted hover:bg-surface2'
            }`}
            title="Ver guía de este bloque"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4">
        {help && showHelp && (
          <div className="bg-accent-blue/5 border border-accent-blue/20 border-l-[3px] border-l-accent-blue rounded-r-lg p-3.5 mb-3.5 text-[12px] text-label leading-relaxed animate-fade-in-down">
            {help}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const Label = ({ children, className = "", htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className={`block text-[11px] text-label mb-1.5 tracking-wide uppercase ${className}`}>
    {children}
  </label>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className="w-full bg-surface2 border border-border rounded-lg text-text font-syne text-[13px] px-3 py-2 outline-none focus:border-accent-blue focus:ring-3 focus:ring-accent-blue/10 transition-all"
  />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props}
    className="w-full bg-surface2 border border-border rounded-lg text-text font-syne text-[13px] px-3 py-2 outline-none focus:border-accent-blue focus:ring-3 focus:ring-accent-blue/10 transition-all resize-vertical"
  />
);

export const Select = ({ 'aria-label': ariaLabel, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    aria-label={ariaLabel}
    {...props}
    className="w-full bg-surface2 border border-border rounded-lg text-text font-syne text-[13px] px-3 py-2 outline-none focus:border-accent-blue focus:ring-3 focus:ring-accent-blue/10 transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=\'http://www.w3.org/2000/svg\'_width=\'10\'_height=\'10\'_viewBox=\'0_0_10_10\'%3E%3Cpath_fill=\'%235a7090\'_d=\'M5_7L0_2h10z\'/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8"
  />
);
