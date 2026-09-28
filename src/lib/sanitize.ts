import "server-only";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "br",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
];

export function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "rel", "target"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
    disallowedTagsMode: "discard",
  });
}
