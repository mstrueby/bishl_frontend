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
  props.id = props.id || name;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits

    // Limit to 5 digits maximum
    if (value.length > 5) {
      value = value.substring(0, 5);
    }

    // Auto-format based on input length
    let formattedValue = '';
    if (value.length === 0) {
      formattedValue = '';
    } else if (value.length === 1) {
      // Single digit: format as 0:0X (seconds only)
      formattedValue = '0:0' + value;
    } else if (value.length === 2) {
      // Two digits: format as 0:XX (seconds only)
      formattedValue = '0:' + value;
    } else {
      // Three or more digits: insert colon before last 2 digits
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
          className="block mt-6 mb-2 text-sm font-medium text-gray-900">
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
          className={`relative w-full cursor-default rounded-md border bg-white py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${meta.touched && meta.error ? 'text-red-900 border-red-300 focus:border-red-500 focus:ring-red-500 placeholder:text-red-300' : 'text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-indigo-500 focus:ring-indigo-600'}`}
          name={field.name}
          value={field.value || ''}
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