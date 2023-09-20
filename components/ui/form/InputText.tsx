import { useField } from 'formik';

const InputText = ({ label, ...props }) => {
    const [field, meta] = useField(props);
    const classInputDef = "block w-full rounded-md border-0 mt-2 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
    const classInputErr = "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"

    return (
        <div className="mt-6 grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6">
                <label htmlFor={props.id || props.name}
                    className="block text-sm font-medium text-gray-900">
                    {label}
                </label>
                <input
                    className={meta.touched && meta.error ? classInputErr : classInputDef}
                    {...field} {...props}
                />
                {meta.touched && meta.error ? (
                    <p className="mt-2 text-sm text-red-600">
                        {meta.error}
                    </p>
                ) : null}
            </div>
        </div>
    )
};

export default InputText;
