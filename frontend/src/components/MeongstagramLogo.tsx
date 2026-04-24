type Props = { variant?: 'word' | 'glyph'; className?: string };

export function MeongstagramLogo({ variant = 'word', className }: Props) {
  const size = variant === 'glyph' ? 32 : 36;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-label="멍스타그램 로고" role="img">
      <circle cx="7" cy="7" r="2.1" fill="currentColor" />
      <circle cx="17" cy="7" r="2.1" fill="currentColor" />
      <circle cx="5.6" cy="12.2" r="1.7" fill="currentColor" />
      <circle cx="18.4" cy="12.2" r="1.7" fill="currentColor" />
      <path
        d="M8.2 13.5C8.2 11.54 9.83 10 11.8 10H12.2C14.17 10 15.8 11.54 15.8 13.5C15.8 15.65 14.23 17.58 12 18.5C9.77 17.58 8.2 15.65 8.2 13.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
