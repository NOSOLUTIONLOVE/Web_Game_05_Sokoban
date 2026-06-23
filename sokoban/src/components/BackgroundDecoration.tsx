/**
 * BackgroundDecoration - 背景装饰（毛玻璃 + 渐变光晕）
 */

export function BackgroundDecoration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 紫色光晕 */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      {/* 青色光晕 */}
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
