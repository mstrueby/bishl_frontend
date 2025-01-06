
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { classNames } from '../../tools/utils'

const allStatuses = [
  {
    key: 'REQUESTED', title: 'Angefragt', current: false, color: {
      divide: 'divide-yellow-600/20',
      background: 'bg-yellow-50',
      text: 'text-yellow-800',
      ring: 'ring-yellow-600/20',
      hover: 'hover:bg-yellow-100',
      focus: 'focus-visible:outline-yellow-600/20',
      dot: 'fill-yellow-500'
    }
  },
  {
    key: 'UNAVAILABLE', title: 'Nicht verfügbar', current: false, color: {
      divide: 'divide-red-600/10',
      background: 'bg-red-50',
      text: 'text-red-700',
      ring: 'ring-red-600/10',
      hover: 'hover:bg-red-100',
      focus: 'focus-visible:outline-red-600/10',
      dot: 'fill-red-500'
    }
  },
  {
    key: 'ACCEPTED', title: 'Bestätigt', current: false, color: {
      divide: 'divide-green-100',
      background: 'bg-green-500',
      text: 'text-white',
      ring: 'ring-green-700',
      hover: 'hover:bg-green-100',
      focus: 'focus-visible:outline-green-100',
      dot: 'fill-green-300'
    }
  }
]

export default function BulkStatusDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: {
  isOpen: boolean,
  onClose: () => void,
  onConfirm: (status: string) => void,
  isLoading?: boolean
}) {
  interface StatusType {
  key: string;
  title: string;
  current: boolean;
  color: {
    divide: string;
    background: string;
    text: string;
    ring: string;
    hover: string;
    focus: string;
    dot: string;
  };
}

const [selected, setSelected] = useState<StatusType | null>(null);


  const handleCancel = () => {
    setSelected(null);
    onClose();
  };

  const Placeholder = () => (
    <span className="block truncate text-gray-400">(auswählen)</span>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30 transition-opacity" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md p-6 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Status aktualisieren
              </Dialog.Title>

              <div className="mt-4">
                <Listbox value={selected} onChange={setSelected}>
                  <Label className="sr-only">Change status</Label>
                  <div className="relative">
                    <ListboxButton className="relative flex flex-row items-center w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                      {selected ? (
                        <div className={classNames("inline-flex rounded-md outline-none my-0.5", selected.color.divide)}>
                          <div className={classNames("inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset py-0.5 px-2", selected.color.background, selected.color.text, selected.color.ring)}>
                            <p className="text-xs font-medium uppercase whitespace-nowrap">{selected.title}</p>
                          </div>
                        </div>
                      ) : (
                        <Placeholder />
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </span>
                    </ListboxButton>
                    <ListboxOptions className="absolute right-0 z-10 mt-2 w-full p-3 grid gap-y-4 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in">
                      {allStatuses.map((status) => (
                        <ListboxOption
                          key={status.key}
                          value={status}
                          className="group cursor-default select-none text-sm text-gray-900"
                        >
                          <div className="flex flex-col">
                            <div className="flex justify-between">
                              <div className={classNames("inline-flex rounded-md outline-none", status.color.divide)}>
                                <div className={classNames("inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset py-0.5 px-2", status.color.background, status.color.text, status.color.ring)}>
                                  <p className="text-xs font-medium uppercase whitespace-nowrap">{status.title}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={handleCancel}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => onConfirm(selected.key)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : 'Aktualisieren'}
                </button>
              </div>
            </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
