/**
 * Tile DOM nodes by atomic number. The HUD needs the geometry of the hovered/pinned tile
 * to park itself beside the wall; registering refs here avoids querying the document.
 */
const tiles = new Map<number, HTMLElement>();
let grid: HTMLElement | null = null;

export const tileRegistry = {
  set(z: number, el: HTMLElement | null): void {
    if (el) tiles.set(z, el);
    else tiles.delete(z);
  },
  get(z: number): HTMLElement | undefined {
    return tiles.get(z);
  },
  setGrid(el: HTMLElement | null): void {
    grid = el;
  },
  getGrid(): HTMLElement | null {
    return grid;
  },
};
