(function () {
    let isDrawing = false;
    let x = 0;
    let y = 0;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sigId = document.getElementById("sig-id");
    // console.log("dataURL: ", dataURL);

    // dataUrl Logic
    // canvas.toDataURL(type, encoderOptions);

    canvas.addEventListener("mousedown", (e) => {
        // console.log(e);
        x = e.offsetX;
        y = e.offsetY;
        isDrawing = true;
    });
    canvas.addEventListener("mousemove", (e) => {
        if (isDrawing) {
            startDraw(ctx, x, y, e.offsetX, e.offsetY);
            x = e.offsetX;
            y = e.offsetY;
        }
    });

    window.addEventListener("mouseup", (e) => {
        // console.log(e);
        if (isDrawing) {
            startDraw(ctx, x, y, e.offsetX, e.offsetY);
            x = 0;
            y = 0;
            isDrawing = false;
            sigId.value = canvas.toDataURL();
            // console.log("dataURL", dataURL);
        }
    });

    function startDraw(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.strokeStyle = "#74ff7a";
        ctx.lineWidth = 3;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }
})();
