import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useField } from 'formik';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import type ReactQuill from 'react-quill';

interface RichEditorProps {
  name: string;
}

const DynamicEditor = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-md" />
});

const RichEditor: React.FC<RichEditorProps> = ({ name }) => {
  const [field, meta, helpers] = useField(name);
  const [isCodeView, setIsCodeView] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<ReactQuill | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Monitor for Quill-related errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Quill') || event.message.includes('react-quill')) {
        console.error('RichEditor error detected:', event.message);
        setEditorError(event.message);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    if (isCodeView && editorRef.current) {
      Prism.highlightAllUnder(editorRef.current); // Ensure highlighting only within the editor
    }
  }, [isCodeView, field.value]);

  const toggleView = () => {
    setIsCodeView(!isCodeView);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = (e.currentTarget as HTMLDivElement).innerText;
    helpers.setValue(html);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div>
      {editorError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          Editor error: {editorError}
        </div>
      )}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={toggleView}
          className="bg-gray-200 rounded-md px-3 py-1 hover:bg-gray-300 text-sm"
        >
          {isCodeView ? "Visuell" : "Code"}
        </button>
      </div>
      {isCodeView ? (
        <div 
          contentEditable
          ref={editorRef}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm language-html"
          onInput={handleInput}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: Prism.highlight(field.value, Prism.languages.html, 'html') }}
        />
      ) : (
        <DynamicEditor
          ref={quillRef}
          theme="snow"
          value={field.value}
          onChange={(value: string) => helpers.setValue(value)}
          modules={{
            toolbar: [
              [{ 'header': [2, 3, 4, false] }],
              ['bold', 'italic', 'underline', 'blockquote'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
              [{ 'color': [] }, { 'background': [] }], 
              ['link'],
              ['clean']
            ],
          }}
          formats={[
            'header', 'bold', 'italic', 'underline', 'blockquote',
            'list', 'bullet', 'align', 'link', 'color', 'background',
          ]}
        />
      )}
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">{meta.error}</p>
      ) : null}
    </div>
  );
};

export default RichEditor;