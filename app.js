import { generateField } from "@romellogoodman/flow-field";

const generate = () => {
  const params = {
    count: 800,
    margin: 0.0,
    amplitude: 2,
    damping: 0.5,
    height: window.innerHeight,
    width: window.innerWidth,
    scale: 1.7,
  };
  return generateField(params);
};

function kickOffDraw() {
  function drawInit() {
    let context = canvas.getContext("2d");

    // Draw the first 100 lines for a start
    fields.forEach((field, index) => {
      if (index > fieldIndex) return;
      const [start, ...pts] = field.line || [];
      if (!start) return;

      context.beginPath();
      context.moveTo(...start);

      pts.forEach((pt) => {
        context.lineTo(...pt);
      });

      context.lineWidth = 2;
      context.strokeStyle = "#EDCDBB";
      context.stroke();
    });
  }
  function draw() {
    let context = canvas.getContext("2d");
    context.lineWidth = 2;
    context.strokeStyle = "#EDCDBB";

    if (fieldIndex < fields.length) {
      if (fields[fieldIndex].line.length > 0) {
        if (pointIndex < fields[fieldIndex].line.length - 2) {
          context.beginPath();
          context.moveTo(...fields[fieldIndex].line[pointIndex]);
          context.lineTo(...fields[fieldIndex].line[pointIndex + 1]);
          context.stroke();
          pointIndex++;
          window.requestAnimationFrame(draw);
        } else {
          fieldIndex++;
          pointIndex = 0;
          window.requestAnimationFrame(draw);
        }
      } else {
        fieldIndex++;
        window.requestAnimationFrame(draw);
      }
    }
  }
  let fields = generate();
  let fieldIndex = 300;
  let pointIndex = 0;

  drawInit();
  return window.requestAnimationFrame(draw);
}

let canvas = document.getElementById("vinegar");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let animation = undefined;
if (canvas && canvas.getContext) {
  animation = kickOffDraw();
}
