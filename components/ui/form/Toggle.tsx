import { useField } from 'formik';
import { useState, useEffect, ComponentPropsWithoutRef } from 'react';
import { Field, Label, Description, Switch } from '@headlessui/react'

interface ToggleProps extends ComponentPropsWithoutRef<'input'> {
  name: string;
  label?: string;
  description?: string;
}

const Toggle = ({ name, label, description, disabled }: ToggleProps) => {
  const [field, meta, helpers] = useField(name);
  const [enabled, setEnabled] = useState(false)

  function handleChange() {
    if (enabled) {
      helpers.setValue(false)
      setEnabled(false)
    } else {
      helpers.setValue(true)
      setEnabled(true)
    }
  }

  useEffect(() => {
    if (field.value == true) {
      setEnabled(true)
    } else {
      setEnabled(false)
    }
  }, [field.value])

  return (
    <li className="flex items-center justify-between mt-6 mb-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {label}
        </span>
        <span className="text-xs sm:text-sm text-gray-500">
          {description}
        </span>
      </div>
      <Switch
        value="true"
        name={field.name}
        checked={enabled}
        onChange={handleChange}
        className={classNames(
          !disabled ? (enabled ? 'bg-indigo-600' : 'bg-gray-200') : 'bg-gray-100',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ml-2'
        )}
      >
        {label && <span className="sr-only">{label}</span>}
        <span
          aria-hidden="true"
          className={classNames(
            enabled ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </Switch>
    </li>
  )
};

function classNames(...classes: string[] ) {
  return classes.filter(Boolean).join(' ')
}

export default Toggle;