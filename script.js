"use strict";

let canvas,ctx,w,h,circles_info;
let isMouseDown = false;
let lastX, lastY;
let points = [];
let drawTimeout;

window.onload = function() {
	canvas = document.querySelector('canvas');
	w = canvas.width;
	h = canvas.height;
	ctx = canvas.getContext('2d');
	
	circles_info = document.querySelector('#circles');

	canvas.addEventListener('mousemove', mousemove);
	canvas.addEventListener('mousedown', mousedown);
	canvas.addEventListener('mouseup', mouseup);

	requestAnimationFrame(mainLoop);
};

function mainLoop() {
	//ctx.clearRect(0,0,w,h);
	draw();
	requestAnimationFrame(mainLoop);
}

function draw() {

}

function mousemove(evt) {
	let rect = evt.target.getBoundingClientRect();
	let mousex = evt.clientX - rect.left;
	let mousey = evt.clientY - rect.top;
	
	if (isMouseDown && lastX && lastY) {
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(mousex, mousey);
		ctx.stroke();
	}
	if (isMouseDown) {
		lastX = mousex;
		lastY = mousey;

		addPoint();
	}
}

function addPoint() {
	if (points.length == 0) {
			points.push([lastX,lastY]);
	} else {
		let dx = lastX - points[points.length-1][0];
		let dy = lastY - points[points.length-1][1];
		let r = Math.sqrt(dx*dx + dy*dy);
		if (r > 10) {
			points.push([lastX,lastY]);
		}
	}
}

function mousedown(evt) {
	isMouseDown = true;
	clearTimeout(drawTimeout);
}

function mouseup(evt) {
	isMouseDown = false;
	// reset last position, so that mousemove didn't draw path between separate strokes
	lastX = undefined;
	lastY = undefined;

	drawTimeout = setTimeout(function() {
		console.log("Calculating score");
		let circle = getApproximateCircle(points);
		circles_info.innerHTML += "Center: (" + circle[0].toFixed(4) + "," + circle[1].toFixed(4) + ")  Radius: " + circle[2].toFixed(4) + "  Deviation: " + circle[3].toFixed(4) + "<br>";
		points = [];
	}, 1000);
}

function getApproximateCircle(points) {
	let center = getCenter(points);
	console.log("Center at (" + center[0] + "," + center[1] + ")");
	let averageRadius = getAverageRadius(points, center);
	console.log("Average radius " + averageRadius);
	let deviation = getDeviation(points, center, averageRadius);
	console.log("Deviation/score " + deviation);
	drawCircle(center, averageRadius, deviation);
	return [center[0], center[1], averageRadius, deviation];
}

function getCenter(points) {
	let x = 0, y = 0;
	for (let i = 0; i < points.length; i++) {
		x += points[i][0];
		y += points[i][1];
	}
	return [x/points.length, y/points.length];
}

function getAverageRadius(points, center) {
	let r = 0;
	for (let i = 0; i < points.length; i++) {
		let dx = points[i][0] - center[0];
		let dy = points[i][1] - center[1];
		r += Math.sqrt(dx*dx + dy*dy)
	}
	return r/points.length;
}

function getDeviation(points, center, radius) {
	let dev = 0;
	for (let i = 0; i < points.length; i++) {
		let dx = points[i][0] - center[0];
		let dy = points[i][1] - center[1];
		let r = Math.sqrt(dx*dx + dy*dy)
		let dr = r - radius;
		dev += dr*dr;
	}
	return Math.sqrt(dev/points.length);
}

function drawCircle(center, radius, deviation) {
	ctx.save();

	ctx.strokeStyle = "#FF0000";
	ctx.beginPath();
	ctx.arc(center[0], center[1], radius, 0, 2*Math.PI);
	ctx.stroke();

	ctx.strokeStyle = "#008888";
	ctx.beginPath();
	ctx.arc(center[0], center[1], radius - deviation, 0, 2*Math.PI);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(center[0], center[1], radius + deviation, 0, 2*Math.PI);
	ctx.stroke();

	ctx.restore();
}

function runTests() {
	let tests = [
		test_center_one_point,
		test_center_two_points,
		test_center_square,
		test_averageRadius_one_point,
		test_averageRadius_two_points,
		test_averageRadius_square,
		test_deviation_square
	];

	let npassed = 0;
	for (let t = 0; t < tests.length; t++) {
		if (tests[t]()) {
			console.log("PASS " + tests[t].name);
			npassed++;
		} else {
			console.log("FAIL " + tests[t].name);
		}
	}
	if (npassed === tests.length) {
		console.log("ALL TESTS PASSED!")
	} else {
		console.log("Passed " + npassed + " out of " + tests.length);
	}
}

function test_center_one_point() {
	let c = getCenter([[10,10]]);
	return c[0] === 10 && c[1] === 10;
}

function test_center_two_points() {
	let c = getCenter([[10,10],[30,30]]);
	return c[0] === 20 && c[1] === 20;
}

function test_center_square() {
	let c = getCenter([[10,10],[30,10],[30,30],[10,30]]);
	return c[0] === 20 && c[1] === 20;
}

function test_averageRadius_one_point() {
	let r = getAverageRadius([[10,10]], [10,10]);
	return r === 0;
}

function test_averageRadius_two_points() {
	let r = getAverageRadius([[10,10],[30,30]], [20,20]);
	return Math.abs(r - 10*Math.sqrt(2)) < 0.00001;
}

function test_averageRadius_square() {
	let r = getAverageRadius([[10,10],[30,10],[30,30],[10,30]], [20,20]);
	return Math.abs(r - 10*Math.sqrt(2)) < 0.00001;
}

function test_deviation_square() {
	let d = getDeviation([[10,10],[30,10],[30,30],[10,30]], [20,20], 10*Math.sqrt(2));
	return Math.abs(d) < 0.00001;
}
