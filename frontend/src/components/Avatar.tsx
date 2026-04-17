import styles from './Avatar.module.css';

type Props = {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  className?: string;
};

const sizeMap = { xs: 22, sm: 32, md: 44, lg: 86, xl: 150 };

export function Avatar({ src, alt, size = 'sm', border, className }: Props) {
  const px = sizeMap[size];
  return (
    <span
      className={`${styles.wrap} ${border ? styles.ring : ''} ${className ?? ''}`}
      style={{ width: px, height: px }}
    >
      <img src={src} alt={alt} width={px} height={px} className={styles.img} loading="lazy" />
    </span>
  );
}
