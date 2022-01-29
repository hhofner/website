import {generateField} from "@romellogoodman/flow-field";

// (function () {
//     var lastTime = 0;
//     var vendors = ['ms', 'moz', 'webkit', 'o'];

//     for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
//         window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
//         window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
//     }
//
//     if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
//         var currTime = new Date().getTime();
//         var timeToCall = Math.max(0, 16 - (currTime - lastTime));
//         var id = window.setTimeout(function () {
//                 callback(currTime + timeToCall);
//             },
//             timeToCall);
//         lastTime = currTime + timeToCall;
//         return id;
//     };
//
//     if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
//         clearTimeout(id);
//     };
// }());

function diceItUpBoy() {

}
const dicedOnions = generateField({count: 500, height: window.innerWidth, width: window.innerWidth, step: 50});
let dishCount = 0;
let dish = dicedOnions[dishCount].line;
let tearCount = 1;

function init() {
    window.requestAnimationFrame(draw);
}

function draw() {
    let context = canvas.getContext("2d");
    context.lineWidth = 3;
    context.strokeStyle = "red";
    // context.clearRect(0,0, 450, 450);

    if (tearCount < dish.length - 1) {
        context.beginPath();
        context.moveTo(...dish[tearCount - 1]);
        context.lineTo(...dish[tearCount]);
        context.stroke();
        tearCount++;
        window.requestAnimationFrame(draw);
    } else {
        tearCount = 1;
        dishCount++;
        if (dishCount < dicedOnions.length - 1) {
            dish = dicedOnions[dishCount].line;
            window.requestAnimationFrame(draw);
        }
    }
}

let canvas = document.getElementById("vinegar");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
if (canvas && canvas.getContext) {
    init();
}