import { useField, FieldAttributes } from 'formik';

interface ButtonProps extends FieldAttributes<any> {
  label: string;
}

export default function ButtonLight({ label, ...props }: ButtonProps) {
  const [field, meta] = useField(props);

  return (
    <button
      {...field} {...props}
      className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {label}
    </button>
  );
}
