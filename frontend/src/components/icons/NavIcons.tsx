type IconProps = { size?: number; className?: string; active?: boolean };

export function HomeIcon({ size = 24, className, active }: IconProps) {
  return active ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 12L12 5L20 12V21H4V12Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9 21V15H15V21" stroke="white" strokeWidth="1.4" />
      <path d="M10.5 11.5H13.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 12L12 5L20 12V21H4V12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 21V15H15V21" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.5 11.5H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ size = 24, className, active }: IconProps) {
  const w = active ? 2.5 : 2;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={w} />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}

export function CompassIcon({ size = 24, className, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="14" r="4.4" stroke="currentColor" strokeWidth={active ? 2.4 : 2} fill={active ? 'currentColor' : 'none'} />
      <circle cx="8.2" cy="8.2" r="1.7" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.7" cy="6.9" r="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.2" cy="8.2" r="1.7" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
      {active && <circle cx="12" cy="14" r="1.8" fill="white" />}
    </svg>
  );
}

export function ReelsIcon({ size = 24, className, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 9C4 7.34 5.34 6 7 6H10L11.2 4.4C11.58 3.89 12.34 3.89 12.72 4.4L14 6H17C18.66 6 20 7.34 20 9V15C20 16.66 18.66 18 17 18H7C5.34 18 4 16.66 4 15V9Z"
        stroke="currentColor"
        strokeWidth="2"
        fill={active ? 'currentColor' : 'none'}
      />
      <circle cx="12" cy="12" r="2.5" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} strokeWidth="1.8" />
    </svg>
  );
}

export function SendIcon({ size = 24, className, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

export function PlusSquareIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function UserNavIcon({ size = 24, className, active }: IconProps) {
  return active ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20V21H4V20Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ size = 24, className, filled }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
        <path
          fill="currentColor"
          d="M12 21C8 18.7 4 15.2 4 10.8C4 8.4 5.7 6.8 7.9 6.8C9.7 6.8 11 7.9 12 9.2C13 7.9 14.3 6.8 16.1 6.8C18.3 6.8 20 8.4 20 10.8C20 15.2 16 18.7 12 21Z"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 21C12 21 4 14.5 4 8.5C4 5.5 6.5 3 9.5 3C11 3 12 3.5 12 3.5C12 3.5 13 3 14.5 3C17.5 3 20 5.5 20 8.5C20 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M21 12C21 16.97 16.97 21 12 21H5L3 23V12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 12V20H20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BookmarkIcon({ size = 24, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className} aria-hidden>
      <path
        d="M6 3H18V21L12 17L6 21V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoreHorizontalIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EditPencilIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 20.5L4.5 16L15.5 5L19 8.5L8 19.5L4 20.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 6L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LockClosedIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HelpCircleIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.62 13.88 11.38 12.8 11.8C12.3 12 12 12.5 12 13V13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function InfoCircleIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function CameraIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function LogOutDoorIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsGearIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2552 20.3766 17.7642 20.3766 18.295C20.3766 18.8258 20.1656 19.3348 19.79 19.71C19.4142 20.0858 18.9052 20.2968 18.3744 20.2968C17.8436 20.2968 17.3346 20.0858 16.959 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4755 19.5791 14.0826 20.1724 14.08 20.83V21C14.08 22.1046 13.1846 23 12.08 23H11.08C9.97544 23 9.08 22.1046 9.08 21V20.91C9.07225 20.2327 8.66291 19.6282 8.03 19.39C7.41291 19.1177 6.69225 19.2483 6.21 19.72L6.15 19.78C5.77435 20.1556 5.26538 20.3666 4.7346 20.3666C4.20382 20.3666 3.69485 20.1556 3.3192 19.78C2.94356 19.4044 2.73256 18.8954 2.73256 18.3646C2.73256 17.8338 2.94356 17.3249 3.3192 16.9492L3.3792 16.8892C3.85091 16.4069 3.98151 15.6862 3.7092 15.0692C3.45007 14.4647 2.85678 14.0718 2.1992 14.0692H2.08C0.975439 14.0692 0.0800018 13.1738 0.0800018 12.0692V11.0692C0.0800018 9.96461 0.975439 9.06918 2.08 9.06918H2.17C2.84733 9.06143 3.45185 8.65209 3.69 8.01918C3.96231 7.40209 3.83171 6.68143 3.36 6.19918L3.3 6.13918C2.92435 5.76354 2.71335 5.25457 2.71335 4.72379C2.71335 4.19301 2.92435 3.68404 3.3 3.3084C3.67564 2.93275 4.18461 2.72175 4.71539 2.72175C5.24617 2.72175 5.75514 2.93275 6.1308 3.3084L6.1908 3.3684C6.67303 3.84011 7.39369 3.97071 8.0108 3.6984H8.08C8.68446 3.43927 9.07737 2.84599 9.08 2.1884V2.06918C9.08 0.964609 9.97544 0.0691797 11.08 0.0691797H12.08C13.1846 0.0691797 14.08 0.964609 14.08 2.06918V2.15918C14.0826 2.81676 14.4755 3.41005 15.08 3.66918C15.6971 3.94149 16.4178 3.81089 16.9 3.33918L16.96 3.27918C17.3356 2.90354 17.8446 2.69254 18.3754 2.69254C18.9062 2.69254 19.4151 2.90354 19.7908 3.27918C20.1664 3.65482 20.3774 4.16379 20.3774 4.69457C20.3774 5.22535 20.1664 5.73432 19.7908 6.10996L19.7308 6.16996C19.2591 6.65221 19.1285 7.37287 19.4008 7.98996C19.6599 8.59442 20.2532 8.98733 20.9108 8.98996H21.03C22.1346 8.98996 23.03 9.88539 23.03 10.99V11.99C23.03 13.0946 22.1346 13.99 21.03 13.99H20.94C20.2824 13.9926 19.6891 14.3855 19.43 14.99V15Z"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}
