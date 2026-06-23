export function Footer() {
  return (
    <footer className="mt-auto text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>↑↓←→ / WASD 移动</span>
        <span>U 撤销</span>
        <span>Y 重做</span>
        <span>R 重置</span>
        <span>P / Esc 暂停</span>
      </div>
      <div className="mt-1 text-muted-foreground/60">Sokoban · v2.0</div>
    </footer>
  );
}
