type TPlane = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  subX?: number;
  subY?: number;
};

export const plane = ({
  x,
  y,
  z,
  width,
  height,
  subX = 1,
  subY = 1
}: TPlane) => {
  const stepX = width / subX;
  const stepY = height / subY;

  const positions = [];

  const yEnd = y + stepY;
  const xEnd = x + stepX;

  for (let j = 0; j < height; j += stepY) {
    for (let i = 0; i < width; i += stepX) {
      // one quad made of two triangles
      positions.push(
        x + i,
        y + j,
        z,

        xEnd + i,
        y + j,
        z,

        x + i,
        yEnd + j,
        z,

        x + i,
        yEnd + j,
        z,

        xEnd + i,
        y + j,
        z,

        xEnd + i,
        yEnd + j,
        z
      );
    }
  }

  const uvstepX = 1 / subX;
  const uvstepY = 1 / subY;

  const uv = [];

  for (let j = 0; j < 1; j += uvstepY) {
    for (let i = 0; i < 1; i += uvstepX) {
      uv.push(
        i,
        j,
        0,

        uvstepX + i,
        j,
        0,

        i,
        uvstepY + j,
        0,

        i,
        uvstepY + j,
        0,

        uvstepX + i,
        j,
        0,

        uvstepX + i,
        uvstepY + j,
        0
      );
    }
  }

  return [new Float32Array(positions), new Float32Array(uv)];
};
