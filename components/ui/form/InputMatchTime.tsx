
import { useField } from 'formik';
import type { ComponentPropsWithoutRef } from 'react';

interface InputMatchTimeProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'onChange' | 'value'> {
  label: string;
  name: string;
  description?: string;
}

const InputMatchTime = ({ label, name, description, ...props }: InputMatchTimeProps) => {
  const [field, meta, helpers] = useField(name);
  const classInputDef = "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none";
  const classInputErr = "block w-full rounded-md border-0  py-2 pl-3 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6 appearance-none";
  
  props.id = props.id || name;

  // Format seconds to mm:ss
  const formatToTimeString = (totalSeconds: string | number): string => {
    if (!totalSeconds || totalSeconds === '') return '';
    const seconds = parseInt(totalSeconds.toString());
    if (isNaN(seconds)) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Parse mm:ss to total seconds
  const parseTimeString = (timeString: string): number => {
    if (!timeString || timeString === '') return 0;
    
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    
    // Validate ranges
    if (minutes < 0 || minutes > 99 || seconds < 0 || seconds > 59) {
      return 0;
    }
    
    return minutes * 60 + seconds;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters except colon
    value = value.replace(/[^\d:]/g, '');
    
    // Ensure proper format
    if (value.length === 1 && /\d/.test(value)) {
      // First digit entered
      value = '0' + value + ':';
    } else if (value.length === 2 && /\d{2}/.test(value)) {
      // Two digits entered, add colon
      value = value + ':';
    } else if (value.length === 4 && value.endsWith(':')) {
      // Remove trailing colon if we have mm:
      value = value;
    } else if (value.length > 5) {
      // Limit to mm:ss format
      value = value.substring(0, 5);
    }
    
    // Validate the format and convert to seconds for storage
    if (value === '' || value === ':') {
      helpers.setValue('');
    } else if (/^\d{1,2}:\d{0,2}$/.test(value)) {
      // Valid partial or complete format
      if (value.endsWith(':')) {
        // Still typing seconds
        helpers.setValue(value);
      } else {
        // Complete format, convert to seconds
        const totalSeconds = parseTimeString(value);
        helpers.setValue(totalSeconds.toString());
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // On blur, ensure we store the value as total seconds
    const currentValue = e.target.value;
    if (currentValue && currentValue !== '') {
      const totalSeconds = parseTimeString(currentValue);
      helpers.setValue(totalSeconds.toString());
    }
    
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // Display value should be in mm:ss format
  const displayValue = field.value && field.value.toString().includes(':') 
    ? field.value 
    : formatToTimeString(field.value);

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
        {...props}
        type="text"
        className={meta.touched && meta.error ? classInputErr : classInputDef}
        name={field.name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="00:00"
        maxLength={5}
      />
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
};

export default InputMatchTime;
