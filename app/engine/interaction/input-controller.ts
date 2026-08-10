/**
 * Traduit les événements bruts du canvas en intentions du moteur.
 *
 * Le viewer n'écoute aucun événement DOM lui-même : il reçoit des intentions
 * nommées. C'est ce qui rend la navigation clavier vérifiable — elle emprunte
 * exactement le même chemin que la souris, au lieu d'être un ajout parallèle.
 */

export type InputAction =
  | "rotate-left"
  | "rotate-right"
  | "zoom-in"
  | "zoom-out"
  | "next-hotspot"
  | "previous-hotspot"
  | "activate"
  | "home"
  | "escape";

export type InputHandlers = {
  /** Survol : coordonnées en pixels canvas. Résolu à la frame suivante. */
  onHover: (x: number, y: number) => void;
  onHoverEnd: () => void;
  /** Clic franc, hors glisser-déposer. */
  onPick: (x: number, y: number) => void;
  onAction: (action: InputAction) => void;
};

/** Au-delà de ce déplacement, le geste est une rotation et non un clic. */
const DRAG_THRESHOLD_PX = 5;

const KEY_ACTIONS: Record<string, InputAction> = {
  ArrowLeft: "rotate-left",
  ArrowRight: "rotate-right",
  ArrowDown: "next-hotspot",
  ArrowUp: "previous-hotspot",
  Tab: "next-hotspot",
  "+": "zoom-in",
  "=": "zoom-in",
  "-": "zoom-out",
  Enter: "activate",
  " ": "activate",
  Home: "home",
  Escape: "escape",
};

export class InputController {
  private canvas: HTMLCanvasElement;
  private handlers: InputHandlers;
  private pointerId: number | null = null;
  private pointerStart = { x: 0, y: 0 };
  private dragged = false;

  constructor(canvas: HTMLCanvasElement, handlers: InputHandlers) {
    this.canvas = canvas;
    this.handlers = handlers;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("keydown", this.onKeyDown);
  }

  private onPointerDown = (event: PointerEvent) => {
    this.pointerId = event.pointerId;
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.dragged = false;
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.pointerId !== null) {
      const moved = Math.hypot(
        event.clientX - this.pointerStart.x,
        event.clientY - this.pointerStart.y,
      );
      if (moved > DRAG_THRESHOLD_PX) this.dragged = true;
      return;
    }
    this.handlers.onHover(event.offsetX, event.offsetY);
  };

  private onPointerUp = (event: PointerEvent) => {
    const wasDragging = this.dragged;
    this.pointerId = null;
    this.dragged = false;
    if (wasDragging) return;
    this.handlers.onPick(event.offsetX, event.offsetY);
  };

  private onPointerLeave = () => {
    this.pointerId = null;
    this.handlers.onHoverEnd();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    // Tab avec modificateur reste au navigateur : piéger le focus dans le canvas
    // enfermerait un utilisateur au clavier dans la 3D.
    if (event.key === "Tab" && (event.ctrlKey || event.altKey || event.metaKey)) return;
    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      this.handlers.onAction("previous-hotspot");
      return;
    }
    event.preventDefault();
    this.handlers.onAction(action);
  };

  dispose() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("keydown", this.onKeyDown);
  }
}
