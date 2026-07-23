function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function parseAvatarPosition(value = '50% 50%') {
  const [x = '50%', y = '50%'] = String(value).trim().split(/\s+/);
  const parsedX = Number.parseFloat(x);
  const parsedY = Number.parseFloat(y);
  return {
    x: clamp(Number.isFinite(parsedX) ? parsedX : 50, 0, 100),
    y: clamp(Number.isFinite(parsedY) ? parsedY : 50, 0, 100),
  };
}

// The image is deliberately larger than the crop frame so position changes remain visible.
export function avatarImageStyle(position, zoom = 100) {
  const { x, y } = parseAvatarPosition(position);
  const size = clamp(Number(zoom) || 100, 100, 220);
  return {
    width: `${size}%`,
    height: `${size}%`,
    left: `${((100 - size) * x) / 100}%`,
    top: `${((100 - size) * y) / 100}%`,
    objectFit: 'cover',
    objectPosition: 'center',
  };
}
