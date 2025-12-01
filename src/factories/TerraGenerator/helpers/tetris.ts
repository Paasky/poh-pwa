export type Offset = { dx: number; dy: number };

/**
 * Simple tetris-like shape generator used to carve tiny island clusters.
 * Produces relative (dx, dy) offsets to apply at a chosen anchor (x, y).
 *
 * Behavior mirrors the inlined implementation previously in TerraGenerator:
 * - 70% chance to pick a 3x3-centered footprint (T, L, I, N/Z, V) with 0–3 random rotations.
 * - 30% chance to pick a 2x2-topLeft footprint with random rotate/mirror.
 */
export class Tetris {
  static randomOffsets(): Offset[] {
    const use3 = Math.random() < 0.7;

    if (use3) {
      // 3x3-centered shapes (relative to center at 0,0)
      const shapes3Center: Offset[][] = [
        // T (upright base): center + left/right + down
        [
          { dx: 0, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
        ],
        // L (down-right base)
        [
          { dx: 0, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: 2 },
          { dx: 1, dy: 2 },
        ],
        // I (triomino line)
        [
          { dx: 0, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
        ],
        // N/Z (zigzag tetromino)
        [
          { dx: -1, dy: 0 },
          { dx: 0, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 1, dy: 1 },
        ],
        // V (triomino)
        [
          { dx: 0, dy: 0 },
          { dx: -1, dy: 1 },
          { dx: 1, dy: 1 },
        ],
      ];

      const rotate90 = (o: Offset): Offset => ({ dx: -o.dy, dy: o.dx });
      const rotN = (offs: Offset[], n: number): Offset[] => {
        let out = offs;
        for (let i = 0; i < n; i++) out = out.map(rotate90);
        return out;
      };

      const base = shapes3Center[Math.floor(Math.random() * shapes3Center.length)];
      const rot = Math.floor(Math.random() * 4);
      return rotN(base, rot);
    }

    // 2x2-topLeft shapes (relative to top-left at 0,0)
    const shapes2TopLeft: Offset[][] = [
      // L triomino
      [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
      ],
      // I domino horizontal
      [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 0 },
      ],
      // I domino vertical
      [
        { dx: 0, dy: 0 },
        { dx: 0, dy: 1 },
      ],
      // V mini (diagonal pair + top-left)
      [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 1 },
      ],
    ];

    const base = shapes2TopLeft[Math.floor(Math.random() * shapes2TopLeft.length)];
    const rotate = Math.random() < 0.5;
    const mirrorX = Math.random() < 0.5;
    const mirrorY = Math.random() < 0.5;
    return base.map((o) => {
      const dx1 = rotate ? o.dy : o.dx;
      const dy1 = rotate ? o.dx : o.dy;
      return {
        dx: mirrorX ? 1 - dx1 : dx1,
        dy: mirrorY ? 1 - dy1 : dy1,
      };
    });
  }
}
