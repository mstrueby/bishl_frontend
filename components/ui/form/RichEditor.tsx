import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useField } from 'formik';

interface RichEditorProps {
  name: string;
  // Remove value and onChange, as we'll handle these with useField
}

const DynamicHeader = dynamic(() => import('react-quill'), { ssr: false });

const RichEditor: React.FC<RichEditorProps> = ({ name }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <div>
      <DynamicHeader
        theme="snow"
        value={field.value}
        onChange={(value: string, delta: any, source: any, editor: any) => {
          helpers.setValue(value); // setValue expects the text value
        }}modules={{
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
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">{meta.error}</p>
      ) : null}
    </div>
  );
};

export default RichEditor;