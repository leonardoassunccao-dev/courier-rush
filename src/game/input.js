export class InputController {
  constructor(element, handlers) {
    this.handlers = handlers;
    this.startX = 0;
    this.startY = 0;
    window.addEventListener('keydown', event => this.key(event));
    element.addEventListener('pointerdown', event => { this.startX = event.clientX; this.startY = event.clientY; });
    element.addEventListener('pointerup', event => this.swipe(event));
  }

  key(event) {
    if (event.repeat) return;
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) this.handlers.left();
    if (['ArrowRight', 'd', 'D'].includes(event.key)) this.handlers.right();
    if (['Escape', 'p', 'P'].includes(event.key)) this.handlers.pause();
    if (event.key === 'Enter') this.handlers.confirm?.();
  }

  swipe(event) {
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy)) return;
    dx < 0 ? this.handlers.left() : this.handlers.right();
  }
}
