"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import ImageUploadButton from "@/components/admin/ImageUploadButton";
import { listBlogLinkTargets, type BlogLinkTarget } from "@/lib/actions/blog";
import { formatBlogDate } from "@/lib/blogDate";
import { cleanLinkHref } from "@/lib/blogBody";

/**
 * Rich-text editor for blog post bodies: bold, italic, underline, heading
 * and subheading, lists, quotes, links and images placed anywhere in the
 * text. Emits HTML; the server cleans it (lib/blogBodySanitize.ts) on save
 * and again when it is shown.
 *
 * Pasting from Word / Google Docs keeps that same structure — headings,
 * bold, lists, links — and drops fonts, colors and sizes so every post
 * matches the site. Pasted pictures are dropped (Word hands them over as
 * local files the site can't show); add them with the Image button.
 */
export default function RichTextEditor({
  value,
  onChange,
  imageFolder = "blog",
}: {
  /** HTML. */
  value: string;
  onChange: (html: string) => void;
  imageFolder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich-body min-h-[320px] px-4 py-3 text-ink outline-none [--rich-accent:var(--color-navy)]",
      },
      transformPastedHTML: cleanPastedHtml,
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="relative rounded-lg border border-line bg-white focus-within:border-navy">
      {editor && <EditorMenus editor={editor} imageFolder={imageFolder} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function EditorMenus({ editor, imageFolder }: { editor: Editor; imageFolder: string }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
      href: editor.isActive("link") ? ((editor.getAttributes("link").href as string | undefined) ?? "") : "",
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  // Inline link editing: the address field replaces the link bar while open.
  // The selection is remembered so focusing the field doesn't lose it.
  const [linkEdit, setLinkEdit] = useState<{ value: string; from: number; to: number } | null>(null);

  // Published posts for "link to another post", loaded the first time the field opens.
  const [posts, setPosts] = useState<BlogLinkTarget[] | null>(null);
  const [highlight, setHighlight] = useState(0);

  function startLinkEdit() {
    const { from, to } = editor.state.selection;
    setLinkEdit({ value: (editor.getAttributes("link").href as string | undefined) ?? "", from, to });
    setHighlight(0);
    if (!posts) listBlogLinkTargets().then(setPosts, () => setPosts([]));
  }

  // Typing words (not an address) searches post titles; an empty field lists the newest.
  const query = linkEdit?.value.trim() ?? "";
  const looksLikeAddress = /^(https?:|mailto:|\/)|\.[a-z]{2,}(\/|$)/i.test(query);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const suggestions =
    linkEdit && posts && !looksLikeAddress
      ? posts.filter((p) => words.every((w) => p.title.toLowerCase().includes(w))).slice(0, 8)
      : [];

  function applyLink(override?: string) {
    if (!linkEdit) return;
    // A pasted Google-redirect address is unwrapped; a placeholder removes the link.
    const href = cleanLinkHref((override ?? linkEdit.value).trim()) ?? "";
    const chain = editor.chain().focus().setTextSelection({ from: linkEdit.from, to: linkEdit.to });
    setLinkEdit(null);
    if (!href || href === "https://") {
      chain.extendMarkRange("link").unsetLink().run();
      return;
    }
    const normalized = /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : `https://${href}`;
    if (linkEdit.from === linkEdit.to && !editor.isActive("link")) {
      // Nothing selected: insert the address itself as the link text.
      chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href: normalized } }] }).run();
      return;
    }
    chain.extendMarkRange("link").setLink({ href: normalized }).run();
  }

  function cancelLinkEdit() {
    if (linkEdit) editor.chain().focus().setTextSelection({ from: linkEdit.from, to: linkEdit.to }).run();
    setLinkEdit(null);
  }

  // The bubble menu re-checks visibility on editor updates; it reads the
  // link field's state from a ref so an open field keeps it visible.
  const linkEditRef = useRef(linkEdit);
  useEffect(() => {
    linkEditRef.current = linkEdit;
  }, [linkEdit]);

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border-b border-line bg-sand/40 px-2 py-1.5">
        <div className="[&_button]:!py-1 [&_label]:!py-1 [&_button]:!text-xs [&_label]:!text-xs">
          <ImageUploadButton
            label="Image"
            folder={imageFolder}
            onUploaded={(urls) => {
              const chain = editor.chain().focus();
              for (const src of urls) chain.setImage({ src, alt: "" });
              chain.run();
            }}
          />
        </div>
        <Divider />
        <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </ToolButton>
        <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </ToolButton>
        <span className="ml-auto pr-1 text-[11px] text-ink-muted">
          Select text to format it · on an empty line for headings and lists
        </span>
      </div>

      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 8, flip: true, shift: { padding: 8 } }}
        shouldShow={({ editor, view, state, element }) => {
          if (linkEditRef.current) return true;
          if (!editor.isEditable) return false;
          if (!(view.hasFocus() || element.contains(document.activeElement))) return false;
          // Images are selected as a whole node — they get no text formatting.
          if ("node" in state.selection) return false;
          return !state.selection.empty || editor.isActive("link");
        }}
        className="z-20 w-max max-w-[min(34rem,calc(100vw-2rem))] rounded-lg border border-line bg-white p-1.5 shadow-xl"
      >
        <div className="flex flex-wrap items-center gap-1">
          <ToolButton label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <span className="font-bold">B</span>
          </ToolButton>
          <ToolButton label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <span className="font-serif italic">I</span>
          </ToolButton>
          <ToolButton
            label="Underline"
            active={state.underline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolButton>
          <Divider />
          <ToolButton
            label="Heading"
            active={state.h2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            Heading
          </ToolButton>
          <ToolButton
            label="Subheading"
            active={state.h3}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            Subheading
          </ToolButton>
          <Divider />
          <ToolButton
            label="Bulleted list"
            active={state.bullet}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolButton>
          <ToolButton
            label="Numbered list"
            active={state.ordered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolButton>
          <ToolButton label="Quote" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            “ Quote
          </ToolButton>
          <Divider />
          <ToolButton label="Link" active={state.link} onClick={startLinkEdit}>
            🔗 Link
          </ToolButton>
        </div>
        {linkEdit ? (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-line pt-1.5 text-xs">
            <label htmlFor="rich-link-address" className="font-medium text-ink-muted">
              Link address:
            </label>
            <input
              id="rich-link-address"
              autoFocus
              value={linkEdit.value}
              placeholder="Paste an address, or type to search blog posts"
              onChange={(e) => {
                setLinkEdit({ ...linkEdit, value: e.target.value });
                setHighlight(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && suggestions.length) {
                  e.preventDefault();
                  setHighlight((h) => (h + 1) % suggestions.length);
                } else if (e.key === "ArrowUp" && suggestions.length) {
                  e.preventDefault();
                  setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink(suggestions[highlight]?.href);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelLinkEdit();
                }
              }}
              className="min-w-[16rem] flex-1 rounded-md border border-line bg-white px-2 py-1 text-xs text-ink focus:border-navy focus:outline-none"
            />
            <BarButton onClick={() => applyLink(suggestions[highlight]?.href)} primary>
              Apply
            </BarButton>
            <BarButton onClick={cancelLinkEdit}>Cancel</BarButton>
            <span className="text-ink-muted">Enter to apply · Esc to cancel · empty removes the link</span>
            {!looksLikeAddress && (
              <div className="w-full">
                <p className="mb-1 font-medium text-ink-muted">
                  {query ? "Matching blog posts" : "Or link to a blog post"}
                  {posts === null && " — loading…"}
                </p>
                {posts && suggestions.length === 0 && (
                  <p className="text-ink-muted">No published post title matches “{query}”.</p>
                )}
                {suggestions.length > 0 && (
                  <ul className="max-h-56 overflow-y-auto rounded-md border border-line bg-white" role="listbox">
                    {suggestions.map((post, i) => (
                      <li key={post.href} role="option" aria-selected={i === highlight}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setHighlight(i)}
                          onClick={() => applyLink(post.href)}
                          className={`flex w-full items-baseline justify-between gap-3 px-2.5 py-1.5 text-left ${
                            i === highlight ? "bg-sand-warm" : ""
                          }`}
                        >
                          <span className="truncate font-medium text-ink">{post.title}</span>
                          <span className="shrink-0 text-ink-muted">{formatBlogDate(post.publishedAt, "short")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          state.link && (
            <div className="flex w-full flex-wrap items-center gap-2 border-t border-line pt-1.5 text-xs">
              <span className="font-medium text-ink-muted">Link to:</span>
              <a
                href={state.href}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-[60%] truncate font-medium text-navy underline underline-offset-2"
                title={`${state.href} (opens in a new tab)`}
              >
                {state.href}
              </a>
              <BarButton onClick={startLinkEdit}>Edit</BarButton>
              <BarButton onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()} danger>
                Remove link
              </BarButton>
            </div>
          )
        )}
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        options={{ placement: "right", offset: 12 }}
        className="z-20 flex items-center gap-1 rounded-lg border border-line bg-white p-1 shadow-lg"
      >
        <ToolButton
          label="Heading"
          active={state.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </ToolButton>
        <ToolButton
          label="Subheading"
          active={state.h3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          Subheading
        </ToolButton>
        <Divider />
        <ToolButton
          label="Bulleted list"
          active={state.bullet}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={state.ordered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolButton>
        <ToolButton label="Quote" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          “ Quote
        </ToolButton>
      </FloatingMenu>
    </>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection when clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-navy text-white" : "text-ink hover:bg-sand-warm"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Pasted HTML, before the editor reads it:
 *  - images with file:// or data: sources (Word/Docs hand those over) are
 *    dropped — they can't be shown on the site; use the Image button;
 *  - Google-redirect links (google.com/search?q=…, common in text copied
 *    from AI chat tools) are unwrapped to the real address, and
 *    placeholder links ("#") are removed, keeping their text.
 */
function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("img").forEach((img) => {
    if (!/^https:\/\//i.test(img.getAttribute("src") ?? "")) img.remove();
  });
  doc.querySelectorAll("a").forEach((a) => {
    const href = cleanLinkHref(a.getAttribute("href") ?? "");
    if (href === null) a.replaceWith(...Array.from(a.childNodes));
    else a.setAttribute("href", href);
  });
  return doc.body.innerHTML;
}

function BarButton({
  onClick,
  primary,
  danger,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
        primary
          ? "bg-navy text-white hover:bg-navy-light"
          : danger
            ? "text-terracotta-dark hover:bg-terracotta/10"
            : "text-ink hover:bg-sand-warm"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-line" aria-hidden />;
}
