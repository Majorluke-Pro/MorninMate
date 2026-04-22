import { useMemo, useState } from 'react';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AlarmIcon from '@mui/icons-material/Alarm';
import BoltIcon from '@mui/icons-material/Bolt';
import NightsStayIcon from '@mui/icons-material/NightsStay';

const VARIANTS = ['sunrise', 'pulse', 'cards'];
const LOADER_QUOTES = [
  'One small win starts the whole morning.',
  'You do not need perfect. You just need up.',
  'Today gets easier once you begin.',
  'A calm start still counts as progress.',
  'Let this be the morning you show up for yourself.',
];

function getStatusCopy({ offlineAccess, cloudReachable, canUseOffline }) {
  if (offlineAccess && !cloudReachable) {
    return {
      eyebrow: 'Device Mode',
      title: 'Opening from your phone',
      subtitle: 'Cloud sync will resume when your connection comes back.',
    };
  }

  if (canUseOffline && !cloudReachable) {
    return {
      eyebrow: 'Offline Ready',
      title: 'Preparing your local routine',
      subtitle: 'You can keep going even if Supabase is unreachable.',
    };
  }

  return {
    eyebrow: 'Morning Boot',
    title: 'Warming up MorninMate',
    subtitle: 'Loading alarms, streaks, and wake-up tools.',
  };
}

function getNextLoaderQuote() {
  if (typeof window === 'undefined') {
    return LOADER_QUOTES[0];
  }

  try {
    const rawIndex = window.localStorage.getItem('mm-loader-quote-index');
    const index = Number.isInteger(Number(rawIndex)) ? Number(rawIndex) : 0;
    const nextIndex = (index + 1) % LOADER_QUOTES.length;

    window.localStorage.setItem('mm-loader-quote-index', String(nextIndex));
    return LOADER_QUOTES[index % LOADER_QUOTES.length];
  } catch {
    return LOADER_QUOTES[0];
  }
}

function SunriseVariant({ copy }) {
  return (
    <div className="mm-loader mm-loader--sunrise">
      <div className="mm-loader__sky-glow mm-loader__sky-glow--left" />
      <div className="mm-loader__sky-glow mm-loader__sky-glow--right" />

      <div className="mm-loader__content">
        <div className="mm-loader__eyebrow">{copy.eyebrow}</div>
        <div className="mm-loader__sunrise-mark">
          <div className="mm-loader__sun-halo" />
          <div className="mm-loader__sun-core">
            <WbSunnyIcon sx={{ fontSize: 34, color: '#fff4db' }} />
          </div>
          <div className="mm-loader__horizon" />
        </div>

        <h1 className="mm-loader__title">Rise in 3... 2... 1...</h1>
        <p className="mm-loader__subtitle">{copy.title}</p>
        <p className="mm-loader__detail">{copy.subtitle}</p>

        <div className="mm-loader__caption-row">
          <span>Sunrise ramp</span>
          <span className="mm-loader__dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}

function PulseVariant({ copy }) {
  const quote = useMemo(() => getNextLoaderQuote(), []);

  return (
    <div className="mm-loader mm-loader--pulse">
      <div className="mm-loader__content">
        <div className="mm-loader__simple-mark">
          <div className="mm-loader__icon-shell">
            <img className="mm-loader__icon-image" src="/loader-koala-clock.svg" alt="" />
          </div>
        </div>

        <div className="mm-loader__simple-progress" aria-hidden="true">
          <span className="mm-loader__dots mm-loader__dots--simple">
            <i />
            <i />
            <i />
          </span>
        </div>

        <p className="mm-loader__quote">{quote}</p>
      </div>
    </div>
  );
}

function CardsVariant({ copy }) {
  const items = [
    { label: 'Profile', Icon: TaskAltIcon, accent: '#ffd166' },
    { label: 'Alarms', Icon: AlarmIcon, accent: '#ff6b35' },
    { label: 'Wake stats', Icon: BoltIcon, accent: '#06d6a0' },
  ];

  return (
    <div className="mm-loader mm-loader--cards">
      <div className="mm-loader__grain" />
      <div className="mm-loader__content">
        <div className="mm-loader__eyebrow">{copy.eyebrow}</div>

        <div className="mm-loader__cards-mark">
          <div className="mm-loader__cards-icon">
            <NightsStayIcon sx={{ fontSize: 24, color: '#ffe9c1' }} />
          </div>
          <div className="mm-loader__cards-stack">
            {items.map((item, index) => (
              <div
                key={item.label}
                className="mm-loader__mini-card"
                style={{
                  '--mm-loader-accent': item.accent,
                  '--mm-loader-offset': `${index * 14}px`,
                  '--mm-loader-delay': `${index * 0.22}s`,
                }}
              >
                <item.Icon sx={{ fontSize: 16, color: item.accent }} />
                <span>{item.label}</span>
                <i />
              </div>
            ))}
          </div>
        </div>

        <h1 className="mm-loader__title">Today&apos;s routine is assembling</h1>
        <p className="mm-loader__subtitle">{copy.title}</p>
        <p className="mm-loader__detail">{copy.subtitle}</p>

        <div className="mm-loader__caption-row">
          <span>Routine cards</span>
          <span className="mm-loader__tag">Mobile-first</span>
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen({
  variant = 'sunrise',
  offlineAccess = false,
  cloudReachable = true,
  canUseOffline = false,
}) {
  const copy = useMemo(
    () => getStatusCopy({ offlineAccess, cloudReachable, canUseOffline }),
    [offlineAccess, cloudReachable, canUseOffline]
  );

  if (variant === 'pulse') return <PulseVariant copy={copy} />;
  if (variant === 'cards') return <CardsVariant copy={copy} />;
  return <SunriseVariant copy={copy} />;
}

export function LoadingScreenPreview() {
  const [variant, setVariant] = useState('sunrise');

  return (
    <div className="mm-loader-preview">
      <LoadingScreen variant={variant} offlineAccess canUseOffline cloudReachable={false} />

      <div className="mm-loader-preview__picker">
        {VARIANTS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setVariant(item)}
            className={`mm-loader-preview__chip${variant === item ? ' is-active' : ''}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
