import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, RotateCcw, RotateCw } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-background/50 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-surface transition-colors ${editor.isActive('bold') ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
         className={`p-1.5 rounded hover:bg-surface transition-colors ${editor.isActive('italic') ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-surface transition-colors ${editor.isActive('strike') ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}
      >
        <Strikethrough size={16} />
      </button>
      
      <div className="w-px h-5 bg-border mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-surface transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-surface transition-colors ${editor.isActive('bulletList') ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-surface transition-colors ${editor.isActive('orderedList') ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}
      >
        <ListOrdered size={16} />
      </button>
      
      <div className="w-px h-5 bg-border mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-surface text-text-muted transition-colors disabled:opacity-50"
      >
        <RotateCcw size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-surface text-text-muted transition-colors disabled:opacity-50"
      >
        <RotateCw size={16} />
      </button>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, readOnly = false }) => {
  const isHtml = /<[a-z][\s\S]*>/i.test(content || '');
  
  // Format content as paragraph if it's plain text to maintain tiptap style consistency
  const formattedContent = content 
    ? (isHtml ? content : `<p>${content.replace(/\n/g, '<br/>')}</p>`) 
    : '';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: formattedContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 focus:outline-none min-h-[120px] p-4 text-text-main !max-w-none',
      },
    },
  });

  // Handle external content updates
  useEffect(() => {
    if (editor && formattedContent && formattedContent !== editor.getHTML()) {
      editor.commands.setContent(formattedContent);
    }
  }, [formattedContent, editor]);

  // Handle read-only updates
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`rounded-xl overflow-hidden ${readOnly ? 'bg-transparent py-2' : 'border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all'}`}>
      {!readOnly && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
      <style>{`
        /* Quick style overrides for tiptap lists if prose doesn't apply perfectly */
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
        .ProseMirror h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5rem; color: var(--color-text-main); }
        .ProseMirror h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.5rem; color: var(--color-text-main); }
        .ProseMirror p { margin-top: 0.5rem; margin-bottom: 0.5rem; color: var(--color-text-main); }
      `}</style>
    </div>
  );
};
