"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Placeholder } from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Youtube from "@tiptap/extension-youtube";
import { useEffect, useCallback, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Table as TableIcon, Quote,
  Undo, Redo, Palette, Type, ImageIcon, PlaySquare as YoutubeIcon,
  Trash2, ArrowDownToLine, ArrowRightToLine, Loader2, DownloadCloud
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TEXT_COLORS = [
  { color: "#000000", label: "Black" }, { color: "#374151", label: "Dark Gray" },
  { color: "#DC2626", label: "Red" }, { color: "#D97706", label: "Orange" },
  { color: "#059669", label: "Green" }, { color: "#2563EB", label: "Blue" },
  { color: "#7C3AED", label: "Purple" }, { color: "#DB2777", label: "Pink" },
];

function ToolbarButton({
  onClick, active, title, children, disabled, className = ""
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean; className?: string;
}) {
  return (
    <button
      type="button" title={title} disabled={disabled} onClick={onClick}
      className={`p-2 rounded-lg transition-all ${className} ${
        active ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

import { Node } from "@tiptap/core";

// ── Custom Extensions to preserve inline style, id and class attributes ──────
const CustomDiv = Node.create({
  name: "div",
  group: "block",
  content: "block+",
  parseHTML() {
    return [{ tag: "div" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("id"),
        renderHTML: (attrs) => (attrs.id ? { id: attrs.id } : {}),
      },
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute("class"),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
    };
  },
});

const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

function Divider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1.5 self-center" />;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importingGdoc, setImportingGdoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      CustomDiv,
      TextAlign.configure({ types: ["heading", "paragraph", "div"] }),
      Underline,
      CustomLink.configure({ openOnClick: false }),
      TextStyle, Color,
      Highlight.configure({ multicolor: true }),
      CustomTable.configure({ resizable: true }),
      CustomTableRow,
      CustomTableHeader,
      CustomTableCell,
      Image.configure({ inline: true, allowBase64: true }),
      Superscript, Subscript,
      Youtube.configure({ inline: false }),
      Placeholder.configure({ placeholder: placeholder || "Yahan se blog likhna shuru karein..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else editor.chain().focus().unsetLink().run();
  }, [editor]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_img.${fileExt}`;
      const { data, error } = await supabase.storage.from('blog_images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('blog_images').getPublicUrl(fileName);
      editor.chain().focus().setImage({ src: publicUrl }).run();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGDocImport = async () => {
    if (!editor) return;
    const url = window.prompt("Google Docs ka 'Shareable Link' paste karein (Ensure 'Anyone with the link' can view):");
    if (!url) return;

    // Extract Document ID
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const docId = match ? match[1] : null;

    if (!docId) {
      alert("Invalid Google Docs link.");
      return;
    }

    setImportingGdoc(true);
    try {
      const res = await fetch(`/api/import-gdoc?docId=${docId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to import document");

      // Set the content
      editor.commands.setContent(data.html);
      alert("Document imported successfully!");
    } catch (err: any) {
      alert("Import Failed: " + err.message);
    } finally {
      setImportingGdoc(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      
      {/* ─── Simple & Clean Toolbar ─── */}
      <div className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap items-center gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1"><Heading1 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Text"><Type className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="List"><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbers"><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link"><LinkIcon className="h-4 w-4" /></ToolbarButton>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Image" disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4 text-blue-500" />}
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><TableIcon className="h-4 w-4 text-emerald-500" /></ToolbarButton>
        <Divider />
        <button 
          onClick={handleGDocImport} 
          disabled={importingGdoc}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors"
        >
          {importingGdoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          Import G-Doc
        </button>
      </div>

      {/* ─── Table Tools (Auto-show) ─── */}
      {editor.isActive("table") && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 p-1.5 flex gap-1 items-center px-4">
           <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mr-2">Table Tools:</span>
           <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1 hover:bg-emerald-100 rounded text-xs font-bold text-emerald-700">Add Col</button>
           <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1 hover:bg-emerald-100 rounded text-xs font-bold text-emerald-700">Add Row</button>
           <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-1 hover:bg-red-100 rounded text-xs font-bold text-red-600 flex items-center gap-1 ml-auto"><Trash2 className="h-3 w-3" /> Delete Table</button>
        </div>
      )}

      {/* ─── Standard Editor Area ─── */}
      <div className="overflow-y-auto min-h-[500px] max-h-[800px] bg-white dark:bg-gray-900">
        <style>{`
          .ProseMirror { outline: none !important; }
          .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0; font-style: italic; }
          .ProseMirror h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 1rem; color: #111827; }
          .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #1f2937; }
          .ProseMirror p { margin: 0.75rem 0; line-height: 1.6; color: #374151; }
          .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb; }
          .ProseMirror th, .ProseMirror td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          .ProseMirror th { background: #f9fafb; font-weight: 700; }
          .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
          .dark .ProseMirror h1, .dark .ProseMirror h2 { color: #f9fafb; }
          .dark .ProseMirror p { color: #d1d5db; }
          .dark .ProseMirror table, .dark .ProseMirror th, .dark .ProseMirror td { border-color: #374151; }
          .dark .ProseMirror th { background: #1f2937; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 px-4 py-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
         Blog Content Editor
      </div>
    </div>
  );
}
