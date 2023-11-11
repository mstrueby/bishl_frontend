import { useField, FieldAttributes } from 'formik';

interface ButtonProps extends FieldAttributes<any> {
  label: string;
  name: string;
  className?: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ButtonPrimary({ label, name, className, ...props }: ButtonProps) {
    const [field, meta] = useField(name);

    return (
        <button
            {...field} {...props}
            className={classNames("inline-flex justify-center rounded-md border border-transparent bg-indigo-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2", className == 'w-full' ? 'w-full' : 'ml-4')}
        >{label}</button>
    )
};
