import { useField, FieldAttribiutes } from 'formik';

interface ButtonProps extends FieldAttributes<any> {
  label: string;
}

export default function ButtonPrimary({ label, ...props }: ButtonProps) {
    const [field, meta] = useField(props);

    return (
        <button
            {...field} {...props}
            className="ml-5 inline-flex justify-center rounded-md border border-transparent bg-indigo-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >{label}</button>
    )
};
