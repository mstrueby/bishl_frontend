import { useField, FieldAttributes } from 'formik';

interface ButtonProps extends FieldAttributes<any> {
  label: string;
  name: string;
  className?: string;
  isLoading?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ButtonPrimary({ label, name, className, isLoading, ...props }: ButtonProps) {
  const [field, meta] = useField(name);

  return (
    <button
      {...field} {...props}
      className={classNames(
        "inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        className == 'w-full' ? 'w-full' : 'ml-4 w-24'
      )}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
        </svg>
      ) : (
        label
      )}
    </button>
  );
}