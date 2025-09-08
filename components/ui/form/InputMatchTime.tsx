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

    // Strip leading zeros to get the actual meaningful digits
    value = value.replace(/^0+/, '') || '0';
    
    // If we ended up with just '0', treat as empty for formatting purposes
    if (value === '0') {
      helpers.setValue('');
      return;
    }

    // Limit to 5 digits maximum (6 and more not allowed)
    if (value.length > 5) {
      value = value.substring(0, 5);
    }

    // Auto-format based on meaningful digit count
    let formattedValue = '';
    if (value.length === 0) {
      formattedValue = '';
    } else if (value.length === 1) {
      // 1 digit: format as 00:01
      formattedValue = '00:0' + value;
    } else if (value.length === 2) {
      // 2 digits: format as 00:12
      formattedValue = '00:' + value;
    } else if (value.length === 3) {
      // 3 digits: format as 01:23
      formattedValue = '0' + value.charAt(0) + ':' + value.substring(1);
    } else if (value.length === 4) {
      // 4 digits: format as 12:34
      formattedValue = value.substring(0, 2) + ':' + value.substring(2);
    } else if (value.length === 5) {
      // 5 digits: format as 123:45
      formattedValue = value.substring(0, 3) + ':' + value.substring(3);
    }

    // Validate seconds are in range 00-59
    if (formattedValue && formattedValue.includes(':')) {
      const [minutes, seconds] = formattedValue.split(':');
      const secondsNum = parseInt(seconds, 10);
      
      if (secondsNum > 59) {
        // Don't update if seconds are invalid
        return;
      }
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