import styles from './KwangstaLogo.module.css';

type Props = { variant?: 'word' | 'glyph'; className?: string };

export function KwangstaLogo({ variant = 'word', className }: Props) {
  if (variant === 'glyph') {
    return (
      <svg className={className} width="32" height="32" viewBox="0 0 24 24" aria-label="인스타그램 로고" role="img">
        <defs>
          <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f58529" />
            <stop offset="30%" stopColor="#dd2a7b" />
            <stop offset="60%" stopColor="#8134af" />
            <stop offset="100%" stopColor="#515bd4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igGrad)" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
      </svg>
    );
  }
  return <span className={`${styles.wordmark} ${className ?? ''}`}>Kwangsta</span>;
}
