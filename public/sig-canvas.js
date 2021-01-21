(function () {
    // let animation;
    // animation = requestAnimationFrame(move);
    // MOUSEUP cancelAnimationFrame(animation);

    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 4;

    let drawing = false;
    let mousePos = {
        x: 0,
        y: 0,
    };
    let lastPos = mousePos;

    let dataURL = canvas.toDataURL();
    console.log("dataURL: ", dataURL);

    // dataUrl Logic
    // canvas.toDataURL(type, encoderOptions);

    // var box = document.getElementById("myBox");
    // let line = document.getElementById("line");
    // let sigLine = document.getElementById("sig-canvas");

    canvas.addEventListener(
        "mousedown",
        function (e) {
            // drawing = true;
            if (drawing) {
                console.log(e);
                lastPos = getMousePos(canvas, e);
                startDraw();
            }
        },
        false
    );
    canvas.addEventListener(
        "mouseup",
        function (e) {
            console.log(e);
            drawing = false;
            lastPos = getMousePos(canvas, e);
        },
        false
    );

    canvas.addEventListener("mousemove", function (e) {
        // console.log(e);
        startDraw();
    });

    // function getMousePos(canvasDom, mouseEvent) {
    //     var rect = canvasDom.getBoundingClientRect();
    //     return {
    //         x: mouseEvent.clientX - rect.left,
    //         y: mouseEvent.clientY - rect.top,
    //     };
    // }

    // var x = e.pageX;
    // var y = e.pageY;
    // sigLine.style.left = x - 50 + "px";
    // sigLine.style.top = y - 50 + "px";

    function startDraw() {
        ctx.beginPath();
        ctx.strokeStyle = "hotpink";
        ctx.fillStyle = "pink";
        ctx.fill();
        ctx.lineWidth = 4;
        // ctx.lineTo(lastPos, 500);
        // ctx.moveTo(100, 600);
        ctx.lineTo(100, 500);
        ctx.moveTo(100, 600);
        ctx.closePath();
    }
})();

// getMousePos();
