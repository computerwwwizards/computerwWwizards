'use client';
import { classHighlighter, highlightCode, Highlighter } from "@lezer/highlight";
import { parser } from "@lezer/javascript";
import { ComponentProps, type ReactNode, useMemo } from "react";

export interface CodeBlockProps extends ComponentProps<'pre'>{
  code: string;
  language?: 'js' | 'css' | 'tsx' | 'jsx' | 'ts',
  parser?: typeof parser;
}

export interface UseGetLezerNodesOptions {
  code: string;
  parser: typeof parser;
  highlighter?: Highlighter;
}

export function useGetLezerNodes({
  code,
  highlighter = classHighlighter,
  parser,
}:UseGetLezerNodesOptions){
  return useMemo(() => {
    const result: ReactNode[] = []
    let index = 0;
  
    highlightCode(code, parser.parse(code), highlighter, (text, classes) => {

      result.push(<span key={`code-block-${index++}`} className={classes} >
        {text}
      </span>)

    }, () => {
      result.push(<br key={`space-${index++}`}/>)
    })

    return  result
  }, [])
}

export function CodeBlock({ 
  code ,
  language,
  parser: innerParser = parser,
  ...props
}:CodeBlockProps) {
  const nodes = useGetLezerNodes({
    code,
    parser: innerParser
  })

  return <pre {...props}>
    {nodes}
  </pre>
}