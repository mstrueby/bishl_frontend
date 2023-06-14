import * as Outline24 from '@heroicons/react/24/outline';

interface Props {
  icon: string;
  className?: string;
  ariaHidden?: boolean;
}

export default function HeroIcon({
  icon,
  className = '',
  ariaHidden = true,
}: Props) {
  const icons: {[key: string]: React.ElementType} = Outline24;
  const Icon: React.ElementType = icons[icon];
  return (
    <Icon
      className={className}
      aria-hidden={ariaHidden}
    />
  );
}