import React from 'react';
import { useField } from 'formik';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';

interface ImageUploadProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  name: string;
  description?: string;
  imageUrl: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ name, label, description, imageUrl, ...props }) => {
  const [field, meta, helpers] = useField(name);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files ? e.target.files[0] : null;
    helpers.setValue(file);
  }
  
  return (
    <div>
      <label htmlFor={props.id || name} className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
        {label}
      </label>
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:py-2 file:px-4 file:bg-indigo-600 file:text-white hover:file:bg-indigo-800"
        {...props}
        id={props.id || name}
      />
      <p id="image-upload-description" className="mt-2 text-xs sm:text-sm text-gray-500"          
         dangerouslySetInnerHTML={{ __html: description || '' }}>
      </p>
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
};

export default ImageUpload;