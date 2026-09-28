"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extension-placeholder";
import { listMediaAction } from "@/app/admin/(protected)/medya/actions";

type MediaItem = { id: string; url: string; originalName: string; mimeType: string; alt: string | null };

/**
 * Admin içerik alanları (ürün/blog/proje açıklaması, hizmet sayfası içeriği) için zengin metin editörü.
 * Müşteri artık `<p>`, `<h2>` gibi HTML etiketlerini elle yazmak zorunda değil — araç çubuğundan biçimlendirir,
 * sonuçta üretilen HTML formun gizli input'una yazılır ve mevcut server action'lar (formData.get(name))
 * HİÇBİR DEĞİŞİKLİK GEREKTİRMEDEN aynı şekilde çalışmaya devam eder.
 */
export function RichTextEditor({
  name,
  initialValue,
  placeholder = "Buraya yazmaya başlayın...",
}: {
  name: string;
  initialValue?: string | null;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(initialValue ?? "");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [replacingImage, setReplacingImage] = useState(false);
  const [library, setLibrary] = useState<MediaItem[] | null>(null);
  const [, startTransition] = useTransition();

  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR ile hydration uyumsuzluğunu önler (TipTap'ın önerdiği ayar)
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // H1 kullanılmaz — sayfanın kendi başlığı zaten H1
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      TiptapImage.configure({ HTMLAttributes: { loading: "lazy" } }),
      // Bazı eski ürün/blog içeriklerinde tablo var (30+7 kayıt) — desteklenmezse düzenlemede sessizce silinirdi.
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialValue || "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-40 px-3 py-2 focus:outline-none",
      },
    },
  });

  // Formu sıfırlayan (ör. başarısız submit sonrası) dış initialValue değişimini yansıt.
  useEffect(() => {
    if (editor && initialValue !== undefined && initialValue !== editor.getHTML()) {
      editor.commands.setContent(initialValue || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  function openLibrary() {
    if (!library) {
      startTransition(async () => {
        const list = await listMediaAction();
        setLibrary(list);
      });
    }
  }

  function insertImage(src: string, alt: string) {
    if (!src.trim()) return;
    const attrs = { src: src.trim(), alt: alt.trim() || undefined };
    if (replacingImage) {
      // Seçili görseli, hattaki konumunda kalarak değiştirir (silip yeniden eklemeye gerek yok).
      editor?.chain().focus().updateAttributes("image", attrs).run();
    } else {
      editor?.chain().focus().setImage(attrs).run();
    }
    setImageOpen(false);
    setImageUrl("");
    setImageAlt("");
    setReplacingImage(false);
  }

  function openReplaceImage() {
    if (!editor) return;
    const attrs = editor.getAttributes("image");
    setImageUrl((attrs.src as string) ?? "");
    setImageAlt((attrs.alt as string) ?? "");
    setReplacingImage(true);
    setLinkOpen(false);
    setImageOpen(true);
    openLibrary();
  }

  function updateSelectedImageAlt(alt: string) {
    editor?.chain().focus().updateAttributes("image", { alt: alt || undefined }).run();
  }

  function removeSelectedImage() {
    editor?.chain().focus().deleteSelection().run();
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  }

  if (!editor) {
    return <div className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-500">Editör yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Server action'lar için: formData.get(name) her zaman güncel HTML'i alır. */}
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 p-1.5">
        <ToolbarButton label="Kalın" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>K</strong>
        </ToolbarButton>
        <ToolbarButton label="İtalik" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>İ</em>
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Normal metin" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          P
        </ToolbarButton>
        <ToolbarButton label="Alt başlık" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Alt başlık (küçük)" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Madde işaretli liste" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •
        </ToolbarButton>
        <ToolbarButton label="Numaralı liste" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </ToolbarButton>
        <ToolbarButton label="Alıntı" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Bağlantı ekle"
          active={editor.isActive("link")}
          onClick={() => {
            setLinkUrl((editor.getAttributes("link").href as string) ?? "");
            setImageOpen(false);
            setLinkOpen((open) => !open);
          }}
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          label="Görsel ekle"
          onClick={() => {
            setLinkOpen(false);
            setReplacingImage(false);
            setImageUrl("");
            setImageAlt("");
            setImageOpen((open) => !open);
            if (!imageOpen) openLibrary();
          }}
        >
          🖼
        </ToolbarButton>
        <ToolbarButton
          label="Tablo ekle"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          ▦
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="Geri al" onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </ToolbarButton>
        <ToolbarButton label="Yinele" onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </ToolbarButton>
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 p-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-400"
          />
          <button type="button" onClick={applyLink} className="h-9 rounded-md border border-neutral-700 px-3 text-xs text-neutral-200 hover:bg-neutral-800">
            {linkUrl.trim() ? "Bağlantıyı Ekle" : "Bağlantıyı Kaldır"}
          </button>
        </div>
      )}

      {imageOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-700 bg-neutral-900 p-2">
          {replacingImage && <p className="text-xs text-amber-300">Seçili görseli değiştiriyorsunuz — kütüphaneden veya URL ile yeni görsel seçin.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="veya medya URL'si yapıştırın"
              className="h-9 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-400"
            />
            <input
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Alt metin (görselde ne var?)"
              className="h-9 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-400"
            />
            <button
              type="button"
              onClick={() => insertImage(imageUrl, imageAlt)}
              className="h-9 rounded-md border border-neutral-700 px-3 text-xs text-neutral-200 hover:bg-neutral-800"
            >
              {replacingImage ? "Değiştir" : "Ekle"}
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 p-2">
            {!library && <p className="text-xs text-neutral-500">Yükleniyor...</p>}
            {library && library.length === 0 && <p className="text-xs text-neutral-500">Medya kütüphanesi boş.</p>}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {library
                ?.filter((item) => item.mimeType.startsWith("image/"))
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertImage(item.url, item.alt ?? "")}
                    className="flex flex-col overflow-hidden rounded-md border border-neutral-800 text-start hover:border-neutral-400"
                    title={item.originalName}
                  >
                    <div className="relative aspect-square shrink-0">
                      <Image src={item.url} alt="" fill sizes="100px" className="object-cover" />
                    </div>
                    <p className={`truncate px-1 py-0.5 text-[10px] leading-tight ${item.alt ? "text-neutral-400" : "text-amber-400"}`}>
                      {item.alt || "Alt metin yok"}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative rounded-md border border-neutral-700 bg-neutral-950">
        <EditorContent editor={editor} />
        {/* İçerikteki bir görsele tıklandığında hemen üzerinde beliren mini menü: silip yeniden yüklemeye gerek kalmadan
            görseli değiştirmek veya alt metnini düzeltmek için. */}
        <BubbleMenu editor={editor} shouldShow={({ editor }) => editor.isActive("image")}>
          <div className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800 p-1.5 shadow-xl">
            <input
              key={editor.state.selection.from}
              defaultValue={(editor.getAttributes("image").alt as string) ?? ""}
              onBlur={(e) => updateSelectedImageAlt(e.target.value)}
              placeholder="Alt metin"
              className="h-8 w-40 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-400"
            />
            <button type="button" onClick={openReplaceImage} className="h-8 rounded-md border border-neutral-700 px-2 text-xs text-neutral-200 hover:bg-neutral-700">
              Değiştir
            </button>
            <button type="button" onClick={removeSelectedImage} className="h-8 rounded-md border border-neutral-700 px-2 text-xs text-red-400 hover:bg-neutral-700">
              Kaldır
            </button>
          </div>
        </BubbleMenu>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-xs font-medium ${
        active ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-neutral-700" aria-hidden="true" />;
}

export type { Editor };
