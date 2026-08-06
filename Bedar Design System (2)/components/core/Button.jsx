import React from 'react';

const sizeStyles = {
  sm: { padding: '6px 12px', fontSize: 13, height: 32, gap: 6 },
  md: { padding: '8px 16px', fontSize: 14, height: 40, gap: 8 },
  lg: { padding: '12px 20px', fontSize: 15, height: 48, gap: 8 },
};

const variantStyles = {
  primary: {
    background: 'var(--action-primary)',
    color: 'var(--action-primary-on)',
    border: '1px solid transparent',
    hover: { background: 'var(--action-primary-hover)' },
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    hover: { background: 'var(--bg-sunken)' },
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid transparent',
    hover: { background: 'var(--state-hover-tint)' },
  },
  outline: {
    background: 'transparent',
    color: 'var(--action-primary)',
    border: '1px solid var(--action-primary)',
    hover: { background: 'var(--state-hover-tint)' },
  },
  danger: {
    background: 'var(--action-danger)',
    color: '#fff',
    border: '1px solid transparent',
    hover: { background: 'var(--action-danger-hover)' },
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  onClick,
  type = 'button',
  block = false,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;
  const style = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    padding: s.padding,
    height: s.height,
    fontSize: s.fontSize,
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    borderRadius: 'var(--radius-button)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
    ...v,
    ...(hover && !disabled && !loading ? v.hover : {}),
  };
  delete style.hover;
  return (
    <button
      type={type}
      style={style}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid currentColor', borderTopColor: 'transparent',
      display: 'inline-block', animation: 'baydar-spin 0.7s linear infinite',
    }} />
  );
}

if (typeof document !== 'undefined' && !document.getElementById('baydar-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'baydar-spin-kf';
  s.textContent = '@keyframes baydar-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}
