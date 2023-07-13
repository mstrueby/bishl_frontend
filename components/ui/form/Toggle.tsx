import { useField } from 'formik';
import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react'


const Toggle = ({ label, description, ...props }) => {
    const [field, meta, helpers] = useField(props);
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
    })

    return (
        <Switch.Group as="li" className="flex items-center justify-between py-4">
            <div className="flex flex-col">
                <Switch.Label as="p" className="text-sm font-medium text-gray-900" passive>
                  {label}
                </Switch.Label>
                <Switch.Description className="text-sm text-gray-500">
                  {description}
                </Switch.Description>
            </div>
            <Switch
                value="true"
                name={field.name}
                checked={enabled}
                onChange={handleChange}
                className={classNames(
                    enabled ? 'bg-indigo-600' : 'bg-gray-200',
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
                )}
            >
                <span className="sr-only">{label}</span>
                <span
                    aria-hidden="true"
                    className={classNames(
                        enabled ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                    )}
                />
            </Switch>
        </Switch.Group>
    )
};

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default Toggle;