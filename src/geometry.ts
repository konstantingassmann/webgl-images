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
  const stepX = width / subX;
  const stepY = height / subY;

  const positions = [];
  const uv = [];

  for (let j = 0; j < height; j += stepY) {
    for (let i = 0; i < width; i += stepX) {
      positions.push(...quad(i, j, stepX, stepY));
      uv.push(...quad(i / width, j / height, stepX / width, stepY / height));
    }
  }

  return [new Float32Array(positions), new Float32Array(uv)];
};
