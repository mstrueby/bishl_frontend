// File: components/ui/DataList.tsx

import React from 'react';
import { CldImage } from 'next-cloudinary';

interface DataListProps {
  items: {
    _id: string;
    title: string;
    alias: string;
    url?: string;
    description?: string[];
    image?: {
      src: string;
      width: number;
      height: number;
      gravity: string;
      className: string;
      radius: number;
    }
  }[];
};

const DataList: React.FC<DataListProps> = ({ items }) => {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item._id} className="relative flex justify-between gap-x-6 py-5">
          <div className="flex min-w-0 gap-x-4">
            {item.image &&
              <CldImage
                src={item.image.src}
                alt="Icon"
                className={item.image.className}
                width={item.image.width}
                height={item.image.height}
                //crop="fill"
                gravity={item.image.gravity}
                radius={item.image.radius}
              />
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-x-3">
                <p className="text-sm/6 font-semibold text-gray-900 truncate">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer nofollow">
                      <span className="absolute inset-x-0 -top-px bottom-0" />
                      {item.title}
                    </a>
                  ) : (
                    <span>{item.title}</span>
                  )}
                </p>
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
          </div>
        </li>
      ))}
    </ul>
  );
};

export default DataList;