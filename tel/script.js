const canvas = document.getElementById('drawcanvas');
const ctx = canvas.getContext('2d');
const colorEls = document.querySelectorAll('.color');
var gameType = "none";

let drawing = false;
let currentColor = 'rgb(43, 43, 43)';
let brushSize = 15;
let points = [];
let lerpPos = { x: 0, y: 0 };

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = brushSize;
ctx.strokeStyle = currentColor;

colorEls.forEach(el => {
    el.addEventListener('click', () => {
        colorEls.forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        currentColor = getComputedStyle(el).backgroundColor;
        ctx.strokeStyle = currentColor;
    });
});

colorEls.forEach(el => {
    if (getComputedStyle(el).backgroundColor === currentColor) {
        el.classList.add('active');
    }
});

function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    } else {
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function startDrawing(e) {
    drawing = true;
    points = [];
    const pos = getCanvasPos(e);
    lerpPos = { ...pos };
    points.push(pos);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const target = getCanvasPos(e);
    lerpPos.x = lerp(lerpPos.x, target.x, 0.3);
    lerpPos.y = lerp(lerpPos.y, target.y, 0.3);
    points.push({ x: lerpPos.x, y: lerpPos.y });
    if (points.length < 3) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;

    const prev = points[points.length - 3];
    const curr = points[points.length - 2];
    const mid = {
        x: (prev.x + curr.x) / 2,
        y: (prev.y + curr.y) / 2
    };

    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
    ctx.quadraticCurveTo(curr.x, curr.y, lerpPos.x, lerpPos.y);
    ctx.stroke();
}

function stopDrawing() {
    drawing = false;
    points = [];
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

document.querySelectorAll('.window').forEach(function (el) {
    el.style.display = 'none';
});

function showScr(scr) {
    document.querySelectorAll('.window').forEach(function (el) {
        el.style.display = 'none';
    });
    document.getElementById(scr).style.display = 'flex';
}


function genRandWord() {
    var words = [
        "table", "plane", "apple", "sun", "tree", "house", "car", "fish", "ball", "star",
        "cloud", "cat", "dog", "book", "hat", "shoe", "cup", "chair", "door", "key",
        "pen", "pencil", "bag", "clock", "flower", "leaf", "moon", "shirt", "pants", "sock",
        "box", "phone", "bed", "candle", "lamp", "spoon", "fork", "plate", "window", "ladder",
        "truck", "bike", "train", "boat", "bus", "flag", "ice", "snowman", "egg", "banana",
        "grape", "peach", "cheese", "cookie", "cake", "tree", "bottle", "brush", "comb", "mirror",
        "glasses", "drum", "guitar", "violin", "kite", "balloon", "rocket", "mountain", "river", "bridge",
        "tent", "tooth", "toothbrush", "bucket", "mop", "broom", "soap", "towel", "glove", "ring",
        "watch", "wallet", "fan", "remote", "television", "radio", "camera", "mouse", "keyboard", "laptop", "watermelon", "anything you like", "the other person"
    ];

    var index = Math.floor(Math.random() * words.length);
    return words[index];
}

function DoDraw() {
    var word = genRandWord();
    var article = /^[aeiou]/i.test(word) ? 'an' : 'a';
    document.getElementById("drawWhat").innerText = article + ' ' + word;
    document.getElementById("systemprompt").innerText = article + ' ' + word;

    conn.send({ state: "system_prompt", text: (article + ' ' + word) });
    startTimer(letthemguess)
    showScr("painting");
    resizeCanvas();
}

function DoGuess() {
    startTimer(guess)
    showScr("waitdr");
}

function startTimer(callback, duration = 20) {
    const progressBars = document.querySelectorAll('.ActProg');
    let elapsed = 0;
    const interval = 100;

    const timer = setInterval(() => {
        elapsed += interval / 1000;
        const percent = Math.min((elapsed / duration) * 100, 100);
        progressBars.forEach(bar => {
            bar.style.width = percent + '%';
        });

        if (elapsed >= duration) {
            clearInterval(timer);
            callback();
        }
    }, interval);
}

function letthemguess() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.putImageData(imageData, 0, 0);

    const dataUri = canvas.toDataURL('image/png');

    conn.send({ state: "drawing_complete", src: dataUri });
    document.getElementById("endreelimg").src = dataUri;
    showScr("waitgu");
    startTimer(endsession);
}

function guess() {
    startTimer(submitguess);
    showScr("review");
}

function submitguess() {
    conn.send({ state: "guess_img", text: document.getElementById("itisinput").value });
    document.getElementById("whattheyguessed").innerText = document.getElementById("itisinput").value;
    endsession();
}

function endsession() {
    startEndReel();
}

showScr("auth")

function imdrawing() {
    console.log("I WILL DRAW");
    gameType = "dr";
    conn.send({ state: "declare_drawing" });
    DoDraw();
}

function handlemsg(msg) {
    console.log(msg)
    switch (msg.state) {
        case "declare_drawing":
            gameType = "gu";
            console.log("I WILL GUESS");
            DoGuess();
            break;
        case "drawing_complete":
            document.getElementById("guesscanvas").src = msg.src;
            document.getElementById("endreelimg").src = msg.src;
            break;
        case "guess_img":
            document.getElementById("whattheyguessed").innerText = msg.text;
            break;
        case "system_prompt":
            document.getElementById("systemprompt").innerText = msg.text;
            break;
        case "restart":
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawing = false;
            points = [];
            showScr("whowill");
    }
}

function startEndReel() {
    const messages = document.querySelectorAll('.msg');
    messages.forEach(el => el.style.display = 'none');
    showScr("ending");

    messages.forEach((el, index) => {
        setTimeout(() => {
            el.style.display = '';
        }, 1000 * index);
    });
}

function goAgain() {
    showScr("whowill");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawing = false;
    points = [];
    conn.send({ state: "restart" });
}
