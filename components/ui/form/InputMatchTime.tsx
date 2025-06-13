import React from 'react';
import { useField } from 'formik';
import type { ComponentPropsWithoutRef } from 'react';

interface InputMatchTimeProps extends ComponentPropsWithoutRef<'input'> {
  name: string;
  label?: string;
  description?: string;
  tabIndex?: number;
}

const InputMatchTime = React.forwardRef<HTMLInputElement, InputMatchTimeProps>(({ name, label, description, ...props }, ref) => {
  const [field, meta, helpers] = useField(name);
  const classInputDef = "block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none";
  const classInputErr = "block w-full rounded-md border-0  py-1.5 px-3 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6 appearance-none";

  props.id = props.id || name;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits

    // Limit to 5 digits maximum
    if (value.length > 5) {
      value = value.substring(0, 5);
    }

    // Auto-format with colon before last 2 digits
    let formattedValue = '';
    if (value.length <= 2) {
      formattedValue = value;
    } else {
      // Insert colon before last 2 digits
      const minutes = value.substring(0, value.length - 2);
      const seconds = value.substring(value.length - 2);
      formattedValue = minutes + ':' + seconds;
    }

    helpers.setValue(formattedValue);
  };

  return (
    <>
      {label && (
        <label htmlFor={props.id || name}
          className="block mt-6 mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-2">
          {description}
        </p>
      )}
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="text"
          className={meta.touched && meta.error ? classInputErr : classInputDef}
          name={field.name}
          value={field.value}
          onChange={handleChange}
          onBlur={field.onBlur}
          placeholder="00:00"
          tabIndex={props.tabIndex}
          autoComplete="off"
        />
        {/**
        {meta.touched && meta.error ? (
          <p className="mt-2 text-sm text-red-600">
            {meta.error}
          </p>
        ) : null}
        */}
      </div>
    </>
  );
});

InputMatchTime.displayName = 'InputMatchTime';

export default InputMatchTime;