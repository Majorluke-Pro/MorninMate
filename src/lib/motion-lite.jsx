import { forwardRef } from 'react';

function pickAnimatedValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function extractVariantState(variants, animate, custom) {
  if (!variants) return {};
  if (typeof animate === 'string' && variants[animate]) {
    return typeof variants[animate] === 'function' ? variants[animate](custom) : variants[animate];
  }
  if (!animate && variants.show) {
    return typeof variants.show === 'function' ? variants.show(custom) : variants.show;
  }
  return {};
}

function motionStateToStyle(state) {
  const style = {};
  const transforms = [];

  Object.entries(state || {}).forEach(([key, rawValue]) => {
    if (key === 'transition') return;
    const value = pickAnimatedValue(rawValue);

    switch (key) {
      case 'x':
        transforms.push(`translateX(${typeof value === 'number' ? `${value}px` : value})`);
        break;
      case 'y':
        transforms.push(`translateY(${typeof value === 'number' ? `${value}px` : value})`);
        break;
      case 'scale':
        transforms.push(`scale(${value})`);
        break;
      case 'scaleX':
        transforms.push(`scaleX(${value})`);
        break;
      case 'scaleY':
        transforms.push(`scaleY(${value})`);
        break;
      case 'rotate':
        transforms.push(`rotate(${typeof value === 'number' ? `${value}deg` : value})`);
        break;
      default:
        if (typeof value !== 'object') {
          style[key] = value;
        }
        break;
    }
  });

  if (transforms.length > 0) {
    style.transform = transforms.join(' ');
  }

  return style;
}

function createMotionComponent(tagName) {
  return forwardRef(function MotionComponent({
    animate,
    initial: _initial,
    exit: _exit,
    variants,
    transition: _transition,
    whileHover: _whileHover,
    whileTap: _whileTap,
    custom,
    style,
    children,
    ...props
  }, ref) {
    const variantStyle = motionStateToStyle(extractVariantState(variants, animate, custom));
    const animateStyle = typeof animate === 'object' ? motionStateToStyle(animate) : {};

    const mergedStyle = {
      ...style,
      ...variantStyle,
      ...animateStyle,
    };

    const Component = tagName;
    return (
      <Component ref={ref} style={mergedStyle} {...props}>
        {children}
      </Component>
    );
  });
}

export function AnimatePresence({ children }) {
  return children ?? null;
}

export const motion = new Proxy({}, {
  get: (_, tagName) => createMotionComponent(tagName),
});
