import React from 'react';
import { useField } from 'formik';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';

interface ImageUploadProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  name: string;
  imageUrl: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ name, label, imageUrl, ...props }) => {
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
      {
        imageUrl && (
          //<div className="flex items-center justify-center w-full h-64 bg-gray-200">
          <div className="flex justify-left mb-2">
            <CldImage
              src={imageUrl}
              alt="Uploaded image"
              width={600}
              height={337}
              aspectRatio="16:9"
              crop="fill"
              gravity="auto"
              className="aspect-[16/9] w-full rounded-xl object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
            />
          </div>
        )
      }
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-900 file:mr-4 file:rounded file:border-0 file:py-2 file:px-4 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        {...props}
        id={props.id || name}
      />
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
};

export default ImageUpload;