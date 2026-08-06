/* @ds-bundle: {"format":4,"namespace":"BaydarDesignSystem_b7d248","components":[{"name":"ContentCard","sourcePath":"components/blocks/ContentCard.jsx"},{"name":"FeatureGrid","sourcePath":"components/blocks/FeatureGrid.jsx"},{"name":"Hero","sourcePath":"components/blocks/Hero.jsx"},{"name":"Testimonial","sourcePath":"components/blocks/Testimonial.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FileUpload","sourcePath":"components/forms/FileUpload.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"Navbar","sourcePath":"components/navigation/Navbar.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Modal","sourcePath":"components/surfaces/Modal.jsx"}],"sourceHashes":{"components/blocks/ContentCard.jsx":"5c3acd7b965c","components/blocks/FeatureGrid.jsx":"499115087aac","components/blocks/Hero.jsx":"8c3449867528","components/blocks/Testimonial.jsx":"bdd73cb2b893","components/core/Badge.jsx":"74a6484537b2","components/core/Button.jsx":"103a5195a9ad","components/core/IconButton.jsx":"f981818f3117","components/core/Tag.jsx":"086460f49b97","components/data/Table.jsx":"d75346bbd0dc","components/feedback/Tooltip.jsx":"eda896de4d9d","components/forms/Checkbox.jsx":"31d267297f84","components/forms/FileUpload.jsx":"ea88141ef6d8","components/forms/Input.jsx":"b364e6ee3a3b","components/forms/Radio.jsx":"1a1099eebd83","components/forms/Select.jsx":"7066aeeb2cfd","components/forms/Switch.jsx":"76d29cfea8cc","components/forms/Textarea.jsx":"ad03193d460f","components/navigation/Breadcrumbs.jsx":"2c38ebd17884","components/navigation/Navbar.jsx":"69002ef84b23","components/navigation/Sidebar.jsx":"967e498511cf","components/navigation/Tabs.jsx":"2f2243bc113d","components/surfaces/Card.jsx":"46d70e902e17","components/surfaces/Modal.jsx":"625349a30b90"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BaydarDesignSystem_b7d248 = window.BaydarDesignSystem_b7d248 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/blocks/ContentCard.jsx
try { (() => {
function ContentCard({
  image,
  category,
  title,
  excerpt,
  meta,
  href = '#'
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      color: 'inherit',
      textDecoration: 'none',
      transition: 'transform var(--dur-fast),box-shadow var(--dur-fast)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-e2)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/10',
      background: 'var(--bg-sunken)'
    }
  }, image), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, category && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-overline)',
      color: 'var(--brand-600)',
      textTransform: 'uppercase'
    }
  }, category), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h5)',
      margin: 0
    }
  }, title), excerpt && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body-sm)',
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, excerpt), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, meta)));
}
Object.assign(__ds_scope, { ContentCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/blocks/ContentCard.jsx", error: String((e && e.message) || e) }); }

// components/blocks/FeatureGrid.jsx
try { (() => {
function FeatureGrid({
  eyebrow,
  title,
  features = [],
  columns = 3
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-2xl)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 48,
      maxWidth: 720,
      marginInline: 'auto'
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-overline)',
      color: 'var(--brand-600)',
      textTransform: 'uppercase',
      marginBottom: 8
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h2", {
    style: {
      font: 'var(--type-h2)',
      margin: 0
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + columns + ',1fr)',
      gap: 24
    }
  }, features.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, f.icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 'var(--radius-md)',
      background: 'var(--brand-50)',
      color: 'var(--brand-600)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, f.icon), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--type-h4)',
      margin: 0
    }
  }, f.title), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body-sm)',
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, f.description))))));
}
Object.assign(__ds_scope, { FeatureGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/blocks/FeatureGrid.jsx", error: String((e && e.message) || e) }); }

// components/blocks/Hero.jsx
try { (() => {
/** Baydar dynamic Hero block — every value is CMS-mappable (see JSON schema in prompt). */
function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  image,
  align = 'start',
  accentColor
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 32px',
      background: 'linear-gradient(180deg, var(--brand-50) 0%, var(--bg-app) 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-2xl)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: image ? '1.1fr 1fr' : '1fr',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-overline)',
      color: accentColor || 'var(--brand-600)',
      textTransform: 'uppercase',
      marginBottom: 12
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--type-h1)',
      color: 'var(--text-primary)',
      margin: '0 0 16px',
      letterSpacing: '-0.02em'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-body-lg)',
      color: 'var(--text-secondary)',
      margin: '0 0 32px',
      maxWidth: 640
    }
  }, subtitle), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, primaryCta, secondaryCta)), image && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-e3)',
      aspectRatio: '4/3',
      background: 'var(--bg-sunken)'
    }
  }, image)));
}
Object.assign(__ds_scope, { Hero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/blocks/Hero.jsx", error: String((e && e.message) || e) }); }

// components/blocks/Testimonial.jsx
try { (() => {
function Testimonial({
  quote,
  author,
  role,
  avatar,
  accent = false
}) {
  return /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0,
      background: accent ? 'var(--brand-700)' : 'var(--bg-surface)',
      color: accent ? '#fff' : 'var(--text-primary)',
      padding: 28,
      borderRadius: 'var(--radius-card)',
      border: accent ? 0 : '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "20",
    viewBox: "0 0 28 20",
    style: {
      color: accent ? 'var(--brand-200)' : 'var(--brand-400)'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 20V10c0-5.5 4-9 9-10l1 3c-3 1-5 3-5 6h4v11H0zm14 0V10c0-5.5 4-9 9-10l1 3c-3 1-5 3-5 6h4v11H14z",
    fill: "currentColor"
  })), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      font: 'var(--type-body-lg)',
      lineHeight: 1.6
    }
  }, quote), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginTop: 'auto'
    }
  }, avatar && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'var(--neutral-200)'
    }
  }, avatar), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, author), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      opacity: 0.8
    }
  }, role))));
}
Object.assign(__ds_scope, { Testimonial });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/blocks/Testimonial.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const tones = {
  neutral: {
    bg: 'var(--neutral-100)',
    fg: 'var(--neutral-700)'
  },
  brand: {
    bg: 'var(--brand-100)',
    fg: 'var(--brand-700)'
  },
  accent: {
    bg: 'var(--accent-100)',
    fg: 'var(--accent-700)'
  },
  success: {
    bg: 'var(--success-100)',
    fg: 'var(--success-700)'
  },
  warning: {
    bg: 'var(--warning-100)',
    fg: 'var(--warning-700)'
  },
  error: {
    bg: 'var(--error-100)',
    fg: 'var(--error-700)'
  },
  info: {
    bg: 'var(--info-100)',
    fg: 'var(--info-700)'
  }
};
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  size = 'md'
}) {
  const t = tones[tone] || tones.neutral;
  const pad = size === 'sm' ? '2px 8px' : '4px 10px';
  const fs = size === 'sm' ? 11 : 12;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: t.bg,
      color: t.fg,
      padding: pad,
      borderRadius: 'var(--radius-full)',
      fontSize: fs,
      fontWeight: 600,
      fontFamily: 'var(--font-display)',
      lineHeight: 1
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.fg
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizeStyles = {
  sm: {
    padding: '6px 12px',
    fontSize: 13,
    height: 32,
    gap: 6
  },
  md: {
    padding: '8px 16px',
    fontSize: 14,
    height: 40,
    gap: 8
  },
  lg: {
    padding: '12px 20px',
    fontSize: 15,
    height: 48,
    gap: 8
  }
};
const variantStyles = {
  primary: {
    background: 'var(--action-primary)',
    color: 'var(--action-primary-on)',
    border: '1px solid transparent',
    hover: {
      background: 'var(--action-primary-hover)'
    }
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    hover: {
      background: 'var(--bg-sunken)'
    }
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid transparent',
    hover: {
      background: 'var(--state-hover-tint)'
    }
  },
  outline: {
    background: 'transparent',
    color: 'var(--action-primary)',
    border: '1px solid var(--action-primary)',
    hover: {
      background: 'var(--state-hover-tint)'
    }
  },
  danger: {
    background: 'var(--action-danger)',
    color: '#fff',
    border: '1px solid transparent',
    hover: {
      background: 'var(--action-danger-hover)'
    }
  }
};
function Button({
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
    ...(hover && !disabled && !loading ? v.hover : {})
  };
  delete style.hover;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    style: style,
    onClick: disabled || loading ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    disabled: disabled || loading,
    "aria-busy": loading || undefined
  }, rest), loading && /*#__PURE__*/React.createElement(Spinner, null), !loading && iconLeft, /*#__PURE__*/React.createElement("span", null, children), !loading && iconRight);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'baydar-spin 0.7s linear infinite'
    }
  });
}
if (typeof document !== 'undefined' && !document.getElementById('baydar-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'baydar-spin-kf';
  s.textContent = '@keyframes baydar-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 32,
  md: 40,
  lg: 48
};
function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  'aria-label': aria,
  onClick,
  disabled,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const dim = sizes[size] || 40;
  const bg = variant === 'primary' ? 'var(--action-primary)' : variant === 'outline' ? 'transparent' : variant === 'solid' ? 'var(--bg-sunken)' : 'transparent';
  const color = variant === 'primary' ? 'var(--action-primary-on)' : 'var(--text-primary)';
  const border = variant === 'outline' ? '1px solid var(--border-default)' : '1px solid transparent';
  const hoverBg = variant === 'primary' ? 'var(--action-primary-hover)' : 'var(--state-hover-tint)';
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": aria,
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: dim,
      height: dim,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-md)',
      background: hover && !disabled ? hoverBg : bg,
      color,
      border,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard)'
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  children,
  onRemove,
  tone = 'neutral'
}) {
  const bg = tone === 'brand' ? 'var(--brand-50)' : 'var(--neutral-50)';
  const fg = tone === 'brand' ? 'var(--brand-700)' : 'var(--text-primary)';
  const bd = tone === 'brand' ? 'var(--brand-200)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px 4px 12px',
      background: bg,
      color: fg,
      border: '1px solid ' + bd,
      borderRadius: 'var(--radius-full)',
      fontSize: 12,
      fontWeight: 500
    }
  }, children, onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: 'inherit',
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 3l6 6M9 3l-6 6",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function Table({
  columns = [],
  rows = [],
  striped = false,
  dense = false
}) {
  const cellPad = dense ? '8px 12px' : '12px 16px';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      overflow: 'auto',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      font: 'var(--type-body-sm)'
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: {
      background: 'var(--bg-sunken)'
    }
  }, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: 'start',
      padding: cellPad,
      font: 'var(--type-label)',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-default)',
      whiteSpace: 'nowrap'
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      background: striped && i % 2 ? 'var(--bg-sunken)' : 'transparent',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      padding: cellPad,
      color: 'var(--text-primary)'
    }
  }, c.render ? c.render(r) : r[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  children,
  content,
  placement = 'top'
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translate(-50%,-8px)'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translate(-50%,8px)'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translate(-8px,-50%)'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translate(8px,-50%)'
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      background: 'var(--neutral-900)',
      color: '#fff',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 12,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      boxShadow: 'var(--shadow-e2)',
      zIndex: 100
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  ...rest
}) {
  const uid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: 18,
      height: 18,
      marginTop: 2,
      borderRadius: 4,
      border: '1.5px solid ' + (checked ? 'var(--action-primary)' : 'var(--field-border)'),
      background: checked ? 'var(--action-primary)' : 'var(--field-bg)',
      transition: 'all var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: uid,
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled
  }, rest, {
    style: {
      opacity: 0,
      position: 'absolute',
      inset: 0,
      margin: 0,
      cursor: 'inherit'
    }
  })), checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    style: {
      margin: 'auto',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6l3 3 5-6",
    stroke: "currentColor",
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body-sm)',
      color: 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption)',
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FileUpload.jsx
try { (() => {
function FileUpload({
  label = 'Upload file',
  hint,
  accept,
  onChange,
  files = []
}) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    onDragEnter: e => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDragOver: e => e.preventDefault(),
    onDrop: e => {
      e.preventDefault();
      setDrag(false);
      onChange && onChange(Array.from(e.dataTransfer.files));
    },
    onClick: () => inputRef.current && inputRef.current.click(),
    style: {
      border: '1.5px dashed ' + (drag ? 'var(--action-primary)' : 'var(--field-border)'),
      background: drag ? 'var(--state-hover-tint)' : 'var(--field-bg)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      margin: '0 auto 8px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--brand-50)',
      color: 'var(--brand-600)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v13m0-13l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-body-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, hint), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: accept,
    multiple: true,
    style: {
      display: 'none'
    },
    onChange: e => onChange && onChange(Array.from(e.target.files || []))
  })), files.length > 0 && /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, files.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      background: 'var(--bg-sunken)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCE"), f.name))));
}
Object.assign(__ds_scope, { FileUpload });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FileUpload.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  icon,
  id,
  dir,
  ...rest
}) {
  const uid = id || React.useId();
  const state = error ? 'error' : 'default';
  const borderColor = state === 'error' ? 'var(--error-500)' : 'var(--field-border)';
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    },
    dir: dir
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      font: 'var(--type-label)',
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      insetInlineStart: 12,
      color: 'var(--text-muted)',
      display: 'inline-flex',
      pointerEvents: 'none'
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: uid,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: 40,
      padding: icon ? '0 14px 0 40px' : '0 14px',
      background: 'var(--field-bg)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-input)',
      font: 'var(--type-body-sm)',
      color: 'var(--text-primary)',
      outline: 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      boxShadow: focus ? state === 'error' ? 'var(--shadow-focus-danger)' : 'var(--shadow-focus)' : 'none',
      borderColor: focus ? state === 'error' ? 'var(--error-500)' : 'var(--border-focus)' : borderColor
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      color: error ? 'var(--error-500)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  checked,
  onChange,
  label,
  description,
  name,
  value,
  disabled,
  id
}) {
  const uid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: 18,
      height: 18,
      marginTop: 2,
      borderRadius: '50%',
      border: '1.5px solid ' + (checked ? 'var(--action-primary)' : 'var(--field-border)'),
      background: 'var(--field-bg)',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: uid,
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      opacity: 0,
      position: 'absolute',
      inset: 0,
      margin: 0
    }
  }), checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--action-primary)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body-sm)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption)',
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  hint,
  error,
  options = [],
  id,
  value,
  onChange,
  placeholder,
  ...rest
}) {
  const uid = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--error-500)' : 'var(--field-border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      font: 'var(--type-label)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: uid,
    value: value,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      width: '100%',
      height: 40,
      padding: '0 40px 0 14px',
      background: 'var(--field-bg)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-input)',
      font: 'var(--type-body-sm)',
      color: 'var(--text-primary)',
      outline: 'none',
      cursor: 'pointer',
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      borderColor: focus ? 'var(--border-focus)' : borderColor
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      insetInlineEnd: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "8",
    viewBox: "0 0 12 8",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1.5l5 5 5-5",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  })))), (hint || error) && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      color: error ? 'var(--error-500)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  onChange,
  label,
  disabled,
  id
}) {
  const uid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 36,
      height: 20,
      background: checked ? 'var(--action-primary)' : 'var(--neutral-300)',
      borderRadius: 999,
      transition: 'background var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: uid,
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      opacity: 0,
      position: 'absolute',
      inset: 0,
      margin: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 18 : 2,
      width: 16,
      height: 16,
      background: '#fff',
      borderRadius: '50%',
      boxShadow: 'var(--shadow-e1)',
      transition: 'left var(--dur-fast) var(--ease-standard)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body-sm)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  ...rest
}) {
  const uid = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--error-500)' : 'var(--field-border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: uid,
    style: {
      font: 'var(--type-label)'
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: uid,
    rows: rows,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      padding: '10px 14px',
      background: 'var(--field-bg)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-input)',
      font: 'var(--type-body-sm)',
      color: 'var(--text-primary)',
      outline: 'none',
      resize: 'vertical',
      boxShadow: focus ? error ? 'var(--shadow-focus-danger)' : 'var(--shadow-focus)' : 'none',
      borderColor: focus ? error ? 'var(--error-500)' : 'var(--border-focus)' : borderColor
    }
  }, rest)), (hint || error) && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-caption)',
      color: error ? 'var(--error-500)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function Breadcrumbs({
  items = []
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Breadcrumb"
  }, /*#__PURE__*/React.createElement("ol", {
    style: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--type-body-sm)'
    }
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }
    }, last ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-primary)',
        fontWeight: 600
      }
    }, it.label) : /*#__PURE__*/React.createElement("a", {
      href: it.href || '#',
      style: {
        color: 'var(--text-secondary)'
      }
    }, it.label), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)'
      }
    }, "/"));
  })));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Navbar.jsx
try { (() => {
function Navbar({
  logo,
  links = [],
  actions,
  transparent = false
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: transparent ? 'var(--glass-bg)' : 'var(--bg-surface)',
      backdropFilter: transparent ? 'var(--blur-md)' : 'none',
      borderBottom: '1px solid ' + (transparent ? 'var(--glass-border)' : 'var(--border-subtle)')
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-2xl)',
      margin: '0 auto',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-primary)',
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, logo), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4,
      marginInlineStart: 'auto'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.href,
    href: l.href,
    style: {
      padding: '8px 12px',
      color: l.active ? 'var(--brand-700)' : 'var(--text-secondary)',
      font: 'var(--type-body-sm)',
      fontWeight: l.active ? 600 : 500,
      borderRadius: 'var(--radius-sm)'
    }
  }, l.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, actions)));
}
Object.assign(__ds_scope, { Navbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Navbar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function Sidebar({
  logo,
  items = [],
  footer,
  activeId,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 260,
      height: '100%',
      background: 'var(--bg-surface)',
      borderInlineEnd: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      gap: 4
    }
  }, logo && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px 16px'
    }
  }, logo), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      flex: 1
    }
  }, items.map(it => it.section ? /*#__PURE__*/React.createElement("div", {
    key: 's-' + it.section,
    style: {
      font: 'var(--type-overline)',
      color: 'var(--text-muted)',
      padding: '12px 12px 4px'
    }
  }, it.section) : /*#__PURE__*/React.createElement("button", {
    key: it.id,
    onClick: () => onSelect && onSelect(it.id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      borderRadius: 'var(--radius-md)',
      border: 0,
      background: activeId === it.id ? 'var(--state-selected-tint)' : 'transparent',
      color: activeId === it.id ? 'var(--brand-700)' : 'var(--text-secondary)',
      font: 'var(--type-body-sm)',
      fontWeight: activeId === it.id ? 600 : 500,
      cursor: 'pointer',
      textAlign: 'start',
      width: '100%'
    }
  }, it.icon, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, it.label), it.badge))), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: 12
    }
  }, footer));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-default)'
    }
  }, tabs.map(t => {
    const active = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      onClick: () => onChange && onChange(t.value),
      style: {
        background: 'transparent',
        border: 0,
        padding: '10px 14px',
        borderBottom: '2px solid ' + (active ? 'var(--action-primary)' : 'transparent'),
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        font: 'var(--type-button)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        marginBottom: -1,
        transition: 'color var(--dur-fast),border-color var(--dur-fast)'
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  elevation = 1,
  padding = 24,
  interactive = false,
  as = 'div',
  style,
  ...rest
}) {
  const Comp = as;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement(Comp, _extends({}, rest, {
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)',
      padding,
      boxShadow: hover ? `var(--shadow-e${Math.min(elevation + 1, 4)})` : `var(--shadow-e${elevation})`,
      transition: 'box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
      transform: hover ? 'translateY(-2px)' : 'none',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Modal.jsx
try { (() => {
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}) {
  React.useEffect(() => {
    if (!open) return;
    const h = e => e.key === 'Escape' && onClose && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const width = size === 'sm' ? 420 : size === 'lg' ? 720 : 560;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.target === e.currentTarget && onClose && onClose(),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-overlay)',
      backdropFilter: 'var(--blur-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 1000,
      animation: 'baydar-fade var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--bg-raised)',
      borderRadius: 'var(--radius-modal)',
      boxShadow: 'var(--shadow-e4)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
      overflow: 'hidden'
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-h4)'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      padding: 6,
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 3l10 10M13 3L3 13",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 24px',
      overflow: 'auto',
      font: 'var(--type-body-sm)',
      color: 'var(--text-primary)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 24px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-sunken)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, footer)));
}
if (typeof document !== 'undefined' && !document.getElementById('baydar-fade-kf')) {
  const s = document.createElement('style');
  s.id = 'baydar-fade-kf';
  s.textContent = '@keyframes baydar-fade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}';
  document.head.appendChild(s);
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Modal.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ContentCard = __ds_scope.ContentCard;

__ds_ns.FeatureGrid = __ds_scope.FeatureGrid;

__ds_ns.Hero = __ds_scope.Hero;

__ds_ns.Testimonial = __ds_scope.Testimonial;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FileUpload = __ds_scope.FileUpload;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.Navbar = __ds_scope.Navbar;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Modal = __ds_scope.Modal;

})();
