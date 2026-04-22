import { createElement, forwardRef } from 'react';
import { createPortal } from 'react-dom';

const PALETTE = {
  'primary.main': '#FF6B35',
  'primary.light': '#FF8C5A',
  'primary.dark': '#E54E1B',
  'secondary.main': '#FFD166',
  'background.default': '#0D0D1A',
  'background.paper': '#16162A',
  'success.main': '#06D6A0',
  'error.main': '#EF476F',
  'info.main': '#118AB2',
  'text.primary': '#F0F0FA',
  'text.secondary': '#9898B8',
  'text.disabled': 'rgba(255,255,255,0.4)',
};

const SPACING_KEYS = new Set([
  'm', 'mt', 'mr', 'mb', 'ml', 'mx', 'my',
  'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py',
  'gap', 'rowGap', 'columnGap',
  'top', 'right', 'bottom', 'left',
]);

const SPACING_MAP = {
  m: ['margin'],
  mt: ['marginTop'],
  mr: ['marginRight'],
  mb: ['marginBottom'],
  ml: ['marginLeft'],
  mx: ['marginLeft', 'marginRight'],
  my: ['marginTop', 'marginBottom'],
  p: ['padding'],
  pt: ['paddingTop'],
  pr: ['paddingRight'],
  pb: ['paddingBottom'],
  pl: ['paddingLeft'],
  px: ['paddingLeft', 'paddingRight'],
  py: ['paddingTop', 'paddingBottom'],
};

const STYLE_ALIASES = {
  bgcolor: 'backgroundColor',
};

function resolveColor(value) {
  if (typeof value !== 'string') return value;
  return PALETTE[value] ?? value;
}

function spacing(value) {
  if (typeof value === 'number') return `${value * 8}px`;
  return value;
}

function normalizeValue(key, value) {
  if (SPACING_KEYS.has(key)) return spacing(value);
  if (key === 'borderRadius' && typeof value === 'number') return `${value * 4}px`;
  if (key === 'boxShadow' || key === 'background' || key === 'backgroundColor' || key === 'color' || key === 'borderColor') {
    return resolveColor(value);
  }
  return resolveColor(value);
}

export function sxToStyle(sx) {
  if (!sx) return {};
  if (Array.isArray(sx)) {
    return sx.reduce((acc, item) => ({ ...acc, ...sxToStyle(item) }), {});
  }

  const style = {};

  Object.entries(sx).forEach(([rawKey, rawValue]) => {
    if (rawValue == null) return;
    if (typeof rawValue === 'object') return;

    const key = STYLE_ALIASES[rawKey] ?? rawKey;
    const value = normalizeValue(rawKey, rawValue);

    if (SPACING_MAP[rawKey]) {
      SPACING_MAP[rawKey].forEach((mappedKey) => {
        style[mappedKey] = value;
      });
      return;
    }

    style[key] = value;
  });

  return style;
}

function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

const VARIANT_ELEMENTS = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  caption: 'span',
};

function typographyStyle({ color, fontWeight, fontSize, textAlign, sx }) {
  const base = {
    margin: 0,
    color: resolveColor(color),
    fontWeight,
    fontSize,
    textAlign,
  };
  return mergeStyles(base, sxToStyle(sx));
}

export const Box = forwardRef(function Box({ component = 'div', sx, style, ...props }, ref) {
  const Component = component;
  return <Component ref={ref} style={mergeStyles(sxToStyle(sx), style)} {...props} />;
});

export const Typography = forwardRef(function Typography({
  component,
  variant = 'body1',
  color,
  fontWeight,
  fontSize,
  textAlign,
  sx,
  style,
  noWrap: _noWrap,
  gutterBottom: _gutterBottom,
  paragraph: _paragraph,
  display: _display,
  ...props
}, ref) {
  const Component = component ?? VARIANT_ELEMENTS[variant] ?? 'p';
  return createElement(Component, {
    ref,
    style: mergeStyles(typographyStyle({ color, fontWeight, fontSize, textAlign, sx }), style),
    ...props,
  });
});

export const Button = forwardRef(function Button({
  children,
  variant = 'text',
  color = 'primary',
  fullWidth,
  startIcon,
  endIcon,
  sx,
  style,
  disabled,
  ...props
}, ref) {
  const palette = color === 'error'
    ? { main: '#EF476F', text: '#fff' }
    : { main: '#FF6B35', text: '#fff' };

  const baseStyle = {
    width: fullWidth ? '100%' : undefined,
    borderRadius: '12px',
    padding: '12px 20px',
    border: variant === 'outlined' ? `1px solid ${palette.main}` : 'none',
    background: variant === 'contained' ? palette.main : variant === 'outlined' ? 'transparent' : 'transparent',
    color: variant === 'contained' ? palette.text : palette.main,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    touchAction: 'manipulation',
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      style={mergeStyles(baseStyle, sxToStyle(sx), style)}
      {...props}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton({ children, sx, style, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      style={mergeStyles({
        border: 'none',
        background: 'transparent',
        borderRadius: '999px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
      }, sxToStyle(sx), style)}
      {...props}
    >
      {children}
    </button>
  );
});

export const CircularProgress = forwardRef(function CircularProgress({ size = 40, sx, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      style={mergeStyles({
        width: size,
        height: size,
        border: '2px solid rgba(255,107,53,0.25)',
        borderTopColor: '#FF6B35',
        borderRadius: '50%',
        animation: 'uiLiteSpin 0.85s linear infinite',
      }, sxToStyle(sx), style)}
      {...props}
    >
      <style>{'@keyframes uiLiteSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
    </div>
  );
});

export const Alert = forwardRef(function Alert({ severity = 'info', children, sx, style, ...props }, ref) {
  const tones = {
    error: { bg: 'rgba(239,71,111,0.12)', border: 'rgba(239,71,111,0.32)', color: '#EF476F' },
    success: { bg: 'rgba(6,214,160,0.12)', border: 'rgba(6,214,160,0.32)', color: '#06D6A0' },
    info: { bg: 'rgba(17,138,178,0.12)', border: 'rgba(17,138,178,0.32)', color: '#118AB2' },
    warning: { bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.32)', color: '#FFD166' },
  };
  const tone = tones[severity] ?? tones.info;
  return (
    <div
      ref={ref}
      style={mergeStyles({
        padding: '12px 16px',
        borderRadius: '12px',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        fontSize: '0.9rem',
      }, sxToStyle(sx), style)}
      {...props}
    >
      {children}
    </div>
  );
});

export function TextField({
  label,
  value,
  onChange,
  fullWidth,
  size,
  variant = 'outlined',
  multiline,
  rows = 3,
  sx,
  style,
  inputProps,
  InputProps,
  slotProps,
  placeholder,
  disabled,
  type = 'text',
  ...props
}) {
  const startAdornment = InputProps?.startAdornment ?? null;
  const endAdornment = InputProps?.endAdornment ?? null;
  const fieldStyle = variant === 'standard'
    ? {
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.18)',
        color: 'inherit',
        padding: '10px 0',
        outline: 'none',
        fontSize: size === 'small' ? '0.95rem' : '1rem',
      }
    : {
        width: '100%',
        background: 'rgba(12,12,28,0.58)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        color: 'inherit',
        padding: multiline ? '12px 14px' : '12px 14px',
        outline: 'none',
        fontSize: size === 'small' ? '0.95rem' : '1rem',
      };

  const wrapperStyle = mergeStyles({
    width: fullWidth ? '100%' : undefined,
  }, sxToStyle(sx), style);

  const controlShellStyle = startAdornment || endAdornment
    ? mergeStyles({
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        gap: '10px',
      }, variant === 'standard'
        ? { borderBottom: '1px solid rgba(255,255,255,0.18)', padding: multiline ? '10px 0' : '0' }
        : {
            background: 'rgba(12,12,28,0.58)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: multiline ? '12px 14px' : '10px 14px',
          })
    : null;

  const inputStyle = controlShellStyle
    ? mergeStyles(fieldStyle, {
        flex: 1,
        border: 'none',
        background: 'transparent',
        borderRadius: 0,
        padding: multiline ? '2px 0 0' : '0',
      })
    : fieldStyle;

  const sharedProps = {
    value,
    onChange,
    placeholder,
    disabled,
    type,
    style: inputStyle,
    ...inputProps,
    ...props,
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.52)', fontWeight: 700 }}>
          {label}
        </label>
      )}
      {controlShellStyle ? (
        <div style={controlShellStyle}>
          {startAdornment}
          {multiline ? <textarea rows={rows} {...sharedProps} /> : <input {...sharedProps} />}
          {endAdornment}
        </div>
      ) : (
        multiline ? <textarea rows={rows} {...sharedProps} /> : <input {...sharedProps} />
      )}
    </div>
  );
}

export const Card = forwardRef(function Card({ children, sx, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      style={mergeStyles({
        borderRadius: '16px',
      }, sxToStyle(sx), style)}
      {...props}
    >
      {children}
    </div>
  );
});

export function Switch({ checked, onChange, sx, style, ...props }) {
  const nextChecked = !checked;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => onChange?.({ ...event, target: { ...event.target, checked: nextChecked } }, nextChecked)}
      style={mergeStyles({
        position: 'relative',
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        border: 'none',
        background: checked ? '#FF6B35' : 'rgba(255,255,255,0.18)',
        cursor: 'pointer',
        touchAction: 'manipulation',
      }, sxToStyle(sx), style)}
      {...props}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.18s ease',
        }}
      />
    </button>
  );
}

export function LinearProgress({ value = 0, sx, style, ...props }) {
  const rootStyle = sxToStyle(sx);
  const barStyle = sx?.['& .MuiLinearProgress-bar'] ? sxToStyle(sx['& .MuiLinearProgress-bar']) : {};

  return (
    <div
      style={mergeStyles({
        width: '100%',
        height: '6px',
        borderRadius: '999px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.08)',
      }, rootStyle, style)}
      {...props}
    >
      <div
        style={mergeStyles({
          width: `${value}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
          borderRadius: 'inherit',
          transition: 'width 0.25s ease',
        }, barStyle)}
      />
    </div>
  );
}

export const Fab = forwardRef(function Fab({ children, sx, style, ...props }, ref) {
  return (
    <button
      ref={ref}
      style={mergeStyles({
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: '#FF6B35',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        touchAction: 'manipulation',
      }, sxToStyle(sx), style)}
      {...props}
    >
      {children}
    </button>
  );
});

export function Dialog({ open, onClose, fullWidth, fullScreen, maxWidth = 'sm', children, sx, style, PaperProps }) {
  if (!open) return null;

  const widths = { xs: 420, sm: 560, md: 720 };
  const width = widths[maxWidth] ?? 560;
  const paperStyle = sxToStyle(PaperProps?.sx);

  return (
    <div
      onClick={onClose}
      style={mergeStyles({
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.58)',
        display: 'flex',
        alignItems: fullScreen ? 'stretch' : 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 40,
      }, sxToStyle(sx), style)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={mergeStyles({
          width: fullScreen || fullWidth ? '100%' : 'auto',
          maxWidth: fullScreen ? '100%' : `${width}px`,
          height: fullScreen ? '100%' : 'auto',
          maxHeight: fullScreen ? '100%' : 'calc(100vh - 32px)',
          background: '#16162A',
          borderRadius: fullScreen ? '0px' : '18px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.38)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }, paperStyle)}
      >
        {children}
      </div>
    </div>
  );
}

export const DialogTitle = forwardRef(function DialogTitle({ children, sx, style, ...props }, ref) {
  return (
    <div ref={ref} style={mergeStyles({ padding: '18px 20px 10px', fontWeight: 800, fontSize: '1.05rem' }, sxToStyle(sx), style)} {...props}>
      {children}
    </div>
  );
});

export const DialogContent = forwardRef(function DialogContent({ children, sx, style, ...props }, ref) {
  return (
    <div ref={ref} style={mergeStyles({ padding: '0 20px 18px' }, sxToStyle(sx), style)} {...props}>
      {children}
    </div>
  );
});

export const DialogActions = forwardRef(function DialogActions({ children, sx, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      style={mergeStyles({
        padding: '0 20px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      }, sxToStyle(sx), style)}
      {...props}
    >
      {children}
    </div>
  );
});

export const Divider = forwardRef(function Divider({ sx, style, ...props }, ref) {
  return <hr ref={ref} style={mergeStyles({ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }, sxToStyle(sx), style)} {...props} />;
});

export const Avatar = forwardRef(function Avatar({ children, src, sx, style, ...props }, ref) {
  const merged = mergeStyles({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FF6B35',
    color: '#fff',
  }, sxToStyle(sx), style);

  if (src) {
    return <img ref={ref} src={src} alt="" style={merged} {...props} />;
  }

  return <div ref={ref} style={merged} {...props}>{children}</div>;
});

export function Menu({ anchorEl, open, onClose, PaperProps, children }) {
  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const paperStyle = sxToStyle(PaperProps?.sx);
  const menu = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 220 }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={mergeStyles({
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${Math.max(8, rect.right - 180)}px`,
          minWidth: '160px',
          background: '#16162A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          boxShadow: '0 24px 56px rgba(0,0,0,0.34)',
          overflow: 'hidden',
        }, paperStyle)}
      >
        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(menu, document.body)
    : menu;
}

export const MenuItem = forwardRef(function MenuItem({ children, sx, style, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      style={mergeStyles({
        width: '100%',
        padding: '12px 14px',
        border: 'none',
        background: 'transparent',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        textAlign: 'left',
        touchAction: 'manipulation',
      }, sxToStyle(sx), style)}
      {...props}
    >
      {children}
    </button>
  );
});
