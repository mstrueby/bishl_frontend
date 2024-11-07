import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Define props
interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
}
const DynamicHeader = dynamic(() => import('react-quill'), { ssr: false });

const RichEditor: React.FC<RichEditorProps> = ({ value, onChange }) => {
  return (
    <>
      <DynamicHeader
        theme="snow"
        value={value}
        onChange={onChange}
        modules={{
          toolbar: [
            [{ 'header': [2, 3, 4, false] }],
            ['bold', 'italic', 'underline', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ],
        }}
        formats={[
          'header', 'bold', 'italic', 'underline', 'blockquote',
          'list', 'bullet', 'link', 'image'
        ]}
      />
    </>
  );
};

export default RichEditor;