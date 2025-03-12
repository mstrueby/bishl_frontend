import { useField } from 'formik';
import type { ComponentPropsWithoutRef } from 'react';

interface InputTextProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  name: string;
  description?: string;
}

const InputText = ({ label, name, description, ...props }: InputTextProps) => {
  const [field, meta] = useField(name);
  const classInputDef = "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none"
  const classInputErr = "block w-full rounded-md border-0  py-2 pl-3 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6 appearance-none"
  props.id = props.id || name;
  return (
    <div>
      <label htmlFor={props.id || name}
        className="block text-sm font-medium mt-6 mb-2 leading-6 text-gray-900">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">
          {description}
        </p>
      )}
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
