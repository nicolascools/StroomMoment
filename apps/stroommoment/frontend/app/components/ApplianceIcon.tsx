type Props = { applianceId: string };

// Minimal inline stroke icons keyed by backend appliance id. No external icon dependency.
export function ApplianceIcon({ applianceId }: Props) {
  return (
    <svg
      aria-hidden="true"
      className="appliance-icon"
      fill="none"
      height="26"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width="26"
    >
      {iconPath(applianceId)}
    </svg>
  );
}

function iconPath(applianceId: string) {
  switch (applianceId) {
    case "dishwasher":
      return (
        <>
          <rect height="18" rx="2.5" width="16" x="4" y="3" />
          <line x1="4" x2="20" y1="8" y2="8" />
          <circle cx="12" cy="14.5" r="3.4" />
          <path d="M12 12.6v1.9l1.4 1" />
          <circle cx="7" cy="5.5" r="0.4" />
          <circle cx="9.6" cy="5.5" r="0.4" />
        </>
      );
    case "washing_machine":
      return (
        <>
          <rect height="18" rx="2.5" width="16" x="4" y="3" />
          <line x1="4" x2="20" y1="8" y2="8" />
          <circle cx="12" cy="14.5" r="3.8" />
          <path d="M8.6 14c1.1 1 2.2-1 3.4 0s2.3 1 3.4 0" />
          <circle cx="17" cy="5.5" r="0.4" />
        </>
      );
    case "dryer":
      return (
        <>
          <rect height="18" rx="2.5" width="16" x="4" y="3" />
          <line x1="4" x2="20" y1="8" y2="8" />
          <circle cx="12" cy="14.5" r="3.8" />
          <path d="M10.6 13.2c.5.9-.5 1.6 0 2.6M13.4 13.2c.5.9-.5 1.6 0 2.6" />
        </>
      );
    case "ev_charging":
      return (
        <>
          <path d="M5 11l1.4-4.2A2 2 0 0 1 8.3 5.5h7.4a2 2 0 0 1 1.9 1.3L19 11" />
          <rect height="7" rx="1.8" width="16" x="4" y="11" />
          <circle cx="7.5" cy="18" r="1.4" />
          <circle cx="16.5" cy="18" r="1.4" />
          <path d="M12.6 9.5l-1.8 3h2.4l-1.8 3" />
        </>
      );
    case "boiler":
      return (
        <>
          <path d="M12 3.5c3 3.6 5.5 6.4 5.5 9.6a5.5 5.5 0 0 1-11 0c0-3.2 2.5-6 5.5-9.6z" />
          <path d="M9.8 13.4a2.4 2.4 0 0 0 2 2.5" />
        </>
      );
    case "heat_pump":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="1.6" />
          <path d="M12 10.4c0-2.4 1.2-3.9 3-4.4M13.6 12c2.4 0 3.9 1.2 4.4 3M12 13.6c0 2.4-1.2 3.9-3 4.4M10.4 12c-2.4 0-3.9-1.2-4.4-3" />
        </>
      );
    default:
      return (
        <>
          <line x1="5" x2="19" y1="7" y2="7" />
          <line x1="5" x2="19" y1="12" y2="12" />
          <line x1="5" x2="19" y1="17" y2="17" />
          <circle cx="9" cy="7" fill="currentColor" r="1.7" />
          <circle cx="15" cy="12" fill="currentColor" r="1.7" />
          <circle cx="8" cy="17" fill="currentColor" r="1.7" />
        </>
      );
  }
}
