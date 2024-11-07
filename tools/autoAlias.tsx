import React from 'react';
import { useFormikContext } from 'formik';

interface AutoAliasProps {
  field: string;    // Name of the field to transform
  targetField: string; // Name of the field where the alias will be set
}

const handleAliasValue = (value: string) => {
  return value.trim().toLowerCase()
    .replace(/\./g, '')
    .replace(/ /g, '-')
    .replace(/ü/g, 'ue')
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ß/g, 'ss');
};

export const AutoAlias: React.FC<AutoAliasProps> = ({ field, targetField }) => {
  const { values, setFieldValue } = useFormikContext<any>();

  React.useEffect(() => {
    if(values[field]) {
      const transformedAlias = handleAliasValue(values[field]);
      setFieldValue(targetField, transformedAlias);
    }
  }, [values, field, targetField, setFieldValue]);

  return null;
};