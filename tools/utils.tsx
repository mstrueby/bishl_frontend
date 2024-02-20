import React from 'react';
import { useFormikContext } from 'formik';

const handleAliasValue = (nameValue: string) => {
  return nameValue.trim().toLowerCase().replace(/\./g, '').replace(/ /g, '-').replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae').replace(/ß/g, 'ss');
};

export const AutoAlias = () => {
  const { values, setFieldValue } = useFormikContext<any>();
  React.useEffect(() => {
    const transformedAlias = handleAliasValue(values.name);
    setFieldValue('alias', transformedAlias);
  }, [values.name, setFieldValue]);
  return null;
};