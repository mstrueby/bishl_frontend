
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'

const allStatuses = [
  { key: 'REQUESTED', title: 'Angefragt' },
  { key: 'UNAVAILABLE', title: 'Nicht verfügbar' }
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
  const [selected, setSelected] = useState(null)
  const Placeholder = () => (
    <span className="block truncate text-gray-400">(auswählen)</span>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30 transition-opacity" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Status aktualisieren
              </Dialog.Title>

              <div className="mt-4">
                <Listbox value={selected} onChange={setSelected}>
                  <Label className="sr-only">Change status</Label>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                      {selected ? (

                        <span className="block truncate">{selected.title}</span>
                      ) : (
                        <Placeholder />
                      )}
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </span>
                    </ListboxButton>
                    <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {allStatuses.map((status) => (
                        <ListboxOption
                          key={status.key}
                          value={status}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {status.title}
                              </span>
                            </>
                          )}
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
                  onClick={onClose}
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
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
