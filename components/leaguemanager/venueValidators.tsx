interface VenueValidator {
  name: string;
  shortName: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  active: boolean;
}

const venueValidator = (values: VenueValidator) => {
  const errors = {
    name: '',
    shortName: '',
    street: '',
    zipCode: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  };
  if (!values.name) {
    errors.name = 'Pflichtfeld Name'
  }
  else if (values.name.length > 30) {
    errors.name = 'Nicht mehr als 30 Zeichen';
  }

  if (!values.shortName) {
    errors.shortName = 'Pflichtfeld Kurzname'
  }
  else if (values.shortName.length > 15) {
    errors.shortName = 'Nicht mehr als 15 Zeichen';
  }

  if (!values.street) {
    errors.street = 'Pflichtfeld Straße';
  }

  if (!values.zipCode) {
    errors.zipCode = 'Pflichtfeld PLZ';
  }

  if (!values.city) {
    errors.city = 'Pflichtfeld Stadt';
  }

  if (!values.country) {
    errors.country = 'Pflichtfeld Land';
  }

  if (!values.latitude) {
    errors.latitude = 'Pflichtfeld Lat';
  }

  if (!values.longitude) {
    errors.longitude = 'Pflichtfeld Lon';
  }
  // else if (!/([0-9.-]+).+?([0-9.-]+).test(values.latitude)

  return errors;
}

export default venueValidator;