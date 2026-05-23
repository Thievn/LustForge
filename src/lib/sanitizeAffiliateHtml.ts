import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["img", "picture", "source", "video", "iframe", "a", "div", "span"];

const ALLOWED_ATTR = [
  "src",
  "href",
  "alt",
  "title",
  "class",
  "style",
  "loading",
  "width",
  "height",
  "target",
  "rel",
  "frameborder",
  "allow",
  "allowfullscreen",
];

function isSafeHttpsUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function uponSanitizeAttribute(_node: Element, data: DOMPurify.SanitizeAttributeHookEvent) {
  if (data.attrName === "src" || data.attrName === "href") {
    if (!isSafeHttpsUrl(data.attrValue)) {
      data.keepAttr = false;
    }
  }
  if (data.attrName === "style") {
    const v = data.attrValue.toLowerCase();
    if (v.includes("javascript:") || v.includes("expression(")) {
      data.keepAttr = false;
    }
  }
}

/** Sanitize admin-provided affiliate embed HTML for public /toys cards. */
export function sanitizeAffiliateHtml(raw: string | null | undefined): string {
  const input = raw?.trim();
  if (!input) return "";

  DOMPurify.addHook("uponSanitizeAttribute", uponSanitizeAttribute);
  try {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ["script", "style", "link", "object", "embed", "form", "input"],
    });
  } finally {
    DOMPurify.removeHook("uponSanitizeAttribute");
  }
}
