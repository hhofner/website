import { generateField } from "@romellogoodman/flow-field";

const generate = () => {
    const params = {
        count: 1000,
        margin: 0.0,
        amplitude: Math.random() * 100,
        damping: Math.random(),
        height: window.innerWidth,
        width: window.innerWidth,
        scale: Math.random() * 10,
    }
    return generateField(params);
}

const fields = generate();

let fieldCount = 100;
let lineCount = 1;

function init() {
    window.requestAnimationFrame(draw);
}

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
        const [start, ...pts] = fields[fieldCount].line || [];

        context.beginPath();
        context.moveTo(...start);
        pts.forEach((pt) => {
            context.lineTo(...pt);
        })
        context.stroke();
        fieldCount++;
        window.requestAnimationFrame(draw);
        // if (lineCount < line.length - 1) {
        //     context.beginPath();
        //     context.moveTo(...line[lineCount]);
        //     context.lineTo(...line[lineCount + 1]);
        //     context.stroke();
        //     lineCount++;
        //     window.requestAnimationFrame(draw);
        // } else {
        //     fieldCount++;
        //     lineCount = 1;
        //     window.requestAnimationFrame(draw);
        // }
    }
}

let canvas = document.getElementById("vinegar");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
if (canvas && canvas.getContext) {
    drawInit();
    init();
}