import React from 'react';
import { useState, useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisVerticalIcon, PencilSquareIcon, StarIcon, DocumentArrowUpIcon, DocumentArrowDownIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import { classNames } from '../../../tools/utils';

type MenuItemType = {
  edit?: { onClick: () => void };
  feature?: { onClick: () => void };
  publish?: { onClick: () => void };
  active?: { onClick: () => void };
  delete?: { onClick?: () => void };
};

interface DataListProps {
  items: {
    _id: string;
    title: string;
    alias: string;
    description?: string[];
    category?: string;
    image?: {
      src: string;
      width: number;
      height: number;
      gravity: string;
      className: string;
      radius: number;
    };
    published?: boolean;
    featured?: boolean;
    menu: Array<{
      edit?: { onClick: () => void };
      feature?: { onClick: () => void };
      publish?: { onClick: () => void };
      active?: { onClick: () => void };
      delete?: { onClick: () => void };
    }>;
  }[];
  statuses: { [key: string]: string };
  categories?: { [key: string]: string };
  onDeleteConfirm?: (id: string) => void;
  deleteModalTitle?: string;
  deleteModalDescription?: string;
  deleteModalDescriptionSubText?: string;
  showThumbnails?: boolean;
  showThumbnailsOnMobiles?: boolean;
  showStatusIndicator?: boolean;
}


const DataList: React.FC<DataListProps> = ({ items, statuses, categories, onDeleteConfirm,
  deleteModalTitle, deleteModalDescription, deleteModalDescriptionSubText, showThumbnails, showThumbnailsOnMobiles, showStatusIndicator }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string | null>(null);

  const handleDeleteClick = (id: string, title: string) => {
    setPostIdToDelete(id);
    setPostTitle(title);
    setIsModalOpen(true);
  };
  const handleConfirmDelete = () => {
    if (postIdToDelete && onDeleteConfirm) {
      onDeleteConfirm(postIdToDelete);
    }
    setIsModalOpen(false);
  };

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item._id} className="flex items-center justify-between gap-x-6 py-5">
          {showThumbnails && (
            item.image ? (
              <span className={`${!showThumbnailsOnMobiles ? 'hidden sm:block' : 'block'}`}><CldImage
                src={item.image.src}
                alt="Thumbnail"
                className={classNames(item.image.className, '')}
                width={item.image.width} height={item.image.height}
                gravity={item.image.gravity}
                radius={item.image.radius}
              /></span>
            ) : (
              <div className={`${!showThumbnailsOnMobiles ? 'hidden sm:block' : 'block'} relative w-32 flex-none rounded-lg border bg-gray-50 sm:inline-block aspect-[16/9]`}></div>
            )
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-x-3">
              {showStatusIndicator && (
                <div className={`${statuses[item.published ? 'Published' : 'Unpublished']} flex-none rounded-full p-1`}>
                  <div className="h-2 w-2 rounded-full bg-current" />
                </div>
              )}
              <p className="text-sm/6 font-semibold text-gray-900 truncate">{item.title}</p>
              {item.featured && (
                <p
                  className='inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10'
                >
                  Angeheftet
                </p>
              )}
              {item.category && (
                <p
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${categories && categories[item.category.toLowerCase()]}`}
                >
                  {item.category}
                </p>
              )}
            </div>

            {item.description && (
              <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
                {item.description.map((descItem: string, index: number, array: string[]) => (
                  <React.Fragment key={`${item._id}-${index}`}>
                    <span key={index} className="whitespace-nowrap truncate">
                      {descItem}
                    </span>
                    {index < array.length - 1 && (
                      <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                        <circle r={1} cx={1} cy={1} />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Context Menu */}
          <div className="flex-none gap-x-4">
            <Menu as="div" className="relative flex-none">
              <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                <span className="sr-only">Open options</span>
                <EllipsisVerticalIcon aria-hidden="true" className="h-5 w-5" />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
              >
                {item.menu.map((menuItem, index) => {
                  const key = Object.keys(menuItem)[0];
                  let IconComponent: any;
                  let caption: string = "";
                  let iconColor: string = "";
                  switch (key) {
                    case "edit":
                      IconComponent = PencilSquareIcon;
                      caption = "Bearbeiten";
                      iconColor = "text-gray-500";
                      break;
                    case "publish":
                      IconComponent = item.published ? DocumentArrowDownIcon : DocumentArrowUpIcon;
                      caption = item.published ? "Entwurf" : "Veröffentlichen";
                      iconColor = item.published ? "text-gray-500" : "text-green-500";
                      break;
                    case "active":
                      IconComponent = item.published ? XCircleIcon : CheckCircleIcon;
                      caption = item.published ? "Deaktivieren" : "Aktivieren";
                      iconColor = item.published ? "text-gray-500" : "text-green-500";
                      break;
                    case "feature":
                      IconComponent = item.featured ? StarIcon : StarIcon;
                      caption = item.featured ? "Loslösen" : "Anheften";
                      iconColor = item.featured ? "text-gray-500" : "text-indigo-500";
                      break;
                    case "delete":
                      IconComponent = TrashIcon;
                      caption = "Löschen";
                      iconColor = "text-red-500";

                    case "delete":
                      IconComponent = TrashIcon;
                      caption = "Löschen";
                      iconColor = "text-red-500";
                      //if (menuItem[key]) { menuItem[key].onClick = () => handleDeleteClick(item._id, item.title); }
                      break;
                    default:
                      break;
                  }
                  return (
                    <MenuItem key={index}>
                      <button
                        onClick={() => {
                          if (key === 'delete') {
                            handleDeleteClick(item._id, item.title);
                          } else if (key in menuItem && menuItem[key as keyof MenuItemType]?.onClick) {
                            menuItem[key as keyof MenuItemType]?.onClick();
                          }
                        }}
                        className="block flex items-center px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none">
                        <IconComponent className={`h-4 w-4 mr-2 ${iconColor}`} aria-hidden="true" />
                        {caption}<span className="sr-only">, {item.title}</span>
                      </button>
                    </MenuItem>
                  );
                })}
              </MenuItems>
            </Menu>
          </div>
        </li>
      ))}

      {isModalOpen && (
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={onDeleteConfirm ? handleConfirmDelete : () => setIsModalOpen(false)}
          title={deleteModalTitle ?? ''}
          description={deleteModalDescription?.replace('{{title}}', postTitle!) ?? ''}
          descriptionSubText={deleteModalDescriptionSubText ?? ''}
        />
      )}

    </ul>
  );
};

export default DataList;