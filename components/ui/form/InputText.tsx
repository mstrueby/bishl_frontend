import { useField } from 'formik';
import type { ComponentPropsWithoutRef } from 'react';

interface InputTextProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  name: string;
}

const InputText = ({ label, name, ...props }: InputTextProps) => {
  const [field, meta] = useField(name);
  const classInputDef = "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
  const classInputErr = "block w-full rounded-md border-0  py-2 pl-3 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"

  return (
    <div>
      <label htmlFor={props.id || name}
        className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
        {label}
      </label>
      <input
        className={meta.touched && meta.error ? classInputErr : classInputDef}
        {...field} {...props}
      />
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  )
};

export default InputText;
