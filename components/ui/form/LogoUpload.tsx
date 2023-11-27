import { useField } from 'formik';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';

interface LogoUploadProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  name: string;
}

const LogoUpload = ({ label, name, ...props }: LogoUploadProps) => {
  const [field, meta, helpers] = useField(name);
  const classInputDef = "block w-full text-sm text-gray-900 file:mr-4 file:rounded file:border-0 file:py-2 file:px-4 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100";

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
        className={classInputDef}
        {...props}
      />
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
};

export default LogoUpload;