export type TPlane = {
  width: number;
  height: number;
  subX?: number;
  subY?: number;
};

const quad = (x: number, y: number, width: number, height: number) => {
  const x2 = x + width;
  const y2 = y + height;

  return [x, y, 0, x2, y, 0, x, y2, 0, x, y2, 0, x2, y, 0, x2, y2, 0];
};

export const plane = ({ width, height, subX = 1, subY = 1 }: TPlane) => {
  const quadWidth = width / subX;
  const quadHeight = height / subY;

  const positions = [];
  const uv = [];

  for (let y = 0; y < subY; y++) {
    for (let x = 0; x < subX; x++) {
      positions.push(
        ...quad(x * quadWidth, y * quadHeight, quadWidth, quadHeight)
      );

      uv.push(
        ...quad(x / subX, y / subY, quadWidth / width, quadHeight / height)
      );
    }
  }

  return [new Float32Array(positions), new Float32Array(uv)];
};
