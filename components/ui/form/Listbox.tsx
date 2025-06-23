import { useField } from 'formik';
import { useState, Fragment, useEffect, ComponentPropsWithoutRef } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface ListboxOption {
  key: string;
  value: string;
}

interface ListboxProps extends ComponentPropsWithoutRef<'input'> {
  label?: string;
  name: string;
  placeholder?: string;
  showErrorText?: boolean;
  options: ListboxOption[];
  tabIndex?: number;
}

const MyListbox = ({ label, name, placeholder, showErrorText = true, options, tabIndex, ...props }: ListboxProps) => {
  const [field, meta, helpers] = useField(name);
  const [selected, setSelected] = useState<ListboxOption | null>(null);

  const handleChange = (event: ListboxOption) => {
    const index = options.findIndex(option => option.key === event.key)
    //console.log("event: ", event, "index: ", index)
    setSelected(options[index]);
    helpers.setValue(options[index].value)
  }

  useEffect(() => {
    if (field.value) {
      const index = options.findIndex(option => option.value === field.value);
      if (index > -1) {
        setSelected(options[index]);
      }
    } else {
      setSelected(null);
    }
  }, [field.value, options]);

  const Placeholder = () => (
    <span className={`block truncate ${meta.touched && meta.error ? 'text-red-300' : 'text-gray-400'}`}>{placeholder || '(auswählen)'}</span>
  );

  props.id = props.id || name;
  return (
    <>
      <Listbox
        name={name}
        value={selected}
        onChange={handleChange}
      >
        {({ open }) => (
          <div>
            {label && (
              <Listbox.Label 
                htmlFor={props.id || name} 
                className="block mt-6 mb-2 text-sm font-medium text-gray-900"
              >
                {label}
              </Listbox.Label>
            )}
            <div className="relative">
              <Listbox.Button type="button" tabIndex={tabIndex} className={`relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${meta.touched && meta.error ? 'text-red-900 border-red-300 focus:border-red-500 focus:ring-red-500 placeholder:text-red-300' : 'text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-indigo-500 focus:ring-indigo-600'}`}>
                {selected?.value ? (
                  <span className="block truncate">{selected.value}</span>
                ) : (
                  <Placeholder />
                )}
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options static className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.key}
                      value={option}
                      className={({ active }) =>
                        classNames(
                          active ? 'text-white bg-indigo-600' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-8 pr-4'
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                            {option.value}
                          </span>

                          {selected ? (
                            <span
                              className={classNames(
                                active ? 'text-white' : 'text-indigo-600',
                                'absolute inset-y-0 left-0 flex items-center pl-1.5'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </div>
        )}
      </Listbox>
      {showErrorText && meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">
          {meta.error}
        </p>
      ) : null}
    </>
  );
}

export default MyListbox;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}