import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content text-xs leading-relaxed space-y-2.5 font-sans select-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-extrabold text-white mt-3 mb-1.5 border-b border-slate-700/60 pb-1 flex items-center gap-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-extrabold text-sky-300 mt-2.5 mb-1 flex items-center gap-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-sky-400 mt-2 mb-1 uppercase tracking-wider">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-200 leading-relaxed my-1">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-white bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700/50">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-slate-300 italic">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-1.5 text-slate-300 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 text-slate-300 pl-1 font-mono">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-200 leading-relaxed">
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
              <table className="w-full text-left border-collapse text-xs font-sans">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-800 text-sky-300 font-bold border-b border-slate-700 font-mono text-[11px] uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800 bg-slate-900/80">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-800/50 transition">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-bold text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-300 font-mono text-[11px]">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[11px] border border-slate-700">
                {children}
              </code>
            ) : (
              <pre className="p-3 my-2 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-sky-500 pl-3 my-2 text-slate-400 italic bg-sky-950/20 py-1 rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-slate-800 my-2.5" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
