import { Fragment, type ReactNode } from "react";

/**
 * "{ad}" yer tutucularını verilen düğümlerle (bağlantı, kalın yazı…) doldurur:
 * rich("… {catalogs} ve {videos} …", { catalogs: <Link/>, videos: <Link/> }) → ReactNode[]
 */
export function rich(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/g).map((chunk, i) => {
    const m = chunk.match(/^\{(\w+)\}$/);
    return <Fragment key={i}>{m && m[1] in parts ? parts[m[1]] : chunk}</Fragment>;
  });
}
