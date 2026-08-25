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
            <h1 className="text-base font-extrabold theme-title overlay-divider mt-3 mb-1.5 border-b pb-1 flex items-center gap-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-extrabold theme-primary-text mt-2.5 mb-1 flex items-center gap-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold theme-primary-text mt-2 mb-1 uppercase tracking-wider">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="theme-sub leading-relaxed my-1">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="overlay-inset font-extrabold px-1 py-0.2 rounded border">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="theme-sub italic">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-1.5 theme-sub pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-1.5 theme-sub pl-1 font-mono">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="theme-sub leading-relaxed">
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div className="overlay-inset my-2.5 overflow-x-auto rounded-xl border shadow-md">
              <table className="w-full text-left border-collapse text-xs font-sans">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="overlay-inset theme-primary-text font-bold border-b font-mono text-[11px] uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="overlay-section divide-y">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-bold theme-title">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 theme-sub font-mono text-[11px]">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="overlay-inset theme-primary-text px-1.5 py-0.5 rounded font-mono text-[11px] border">
                {children}
              </code>
            ) : (
              <pre className="overlay-input p-3 my-2 rounded-xl theme-sub font-mono text-xs overflow-x-auto border">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-3 my-2 theme-muted italic py-1 rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="overlay-divider my-2.5" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
