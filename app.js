import { generateField } from "@romellogoodman/flow-field";

const generate = () => {
    const params = {
        count: 500,
        margin: 0.0,
        amplitude: 2,
        damping: 0.5,
        height: window.innerHeight,
        width: window.innerWidth,
        scale: 1.7,
    }
    return generateField(params);
}

function kickOffDraw() {
    function drawInit() {
        let context = canvas.getContext("2d");

        // Draw the first 100 lines for a start
        fields.forEach((field, index) => {
            if (index > fieldCount) return;
            const [start, ...pts] = field.line || [];
            if (!start) return;

            context.beginPath();
            context.moveTo(...start);

            pts.forEach((pt) => {
                context.lineTo(...pt);
            })

            context.lineWidth = 2;
            context.strokeStyle = '#EDCDBB';
            context.stroke();
        })
    }
    function draw() {
        let context = canvas.getContext("2d");
        context.lineWidth = 2;
        context.strokeStyle = '#EDCDBB';

        if (fieldCount < fields.length) {
            if (fields[fieldCount].line.length > 0) {
                if (pointCount < fields[fieldCount].line.length - 2) {
                    context.beginPath();
                    context.moveTo(...fields[fieldCount].line[pointCount]);
                    context.lineTo(...fields[fieldCount].line[pointCount+1]);
                    context.stroke();
                    pointCount++;
                    window.requestAnimationFrame(draw);
                } else {
                    fieldCount++;
                    pointCount = 0;
                    window.requestAnimationFrame(draw);
                }
            } else {
                fieldCount++;
                window.requestAnimationFrame(draw);
            }
        }
    }
    let fields = generate();
    let fieldCount = 100;
    let pointCount = 0;

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
