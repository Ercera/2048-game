let grid = document.querySelector(".grid");
const startButton = document.getElementById("start-button");
const container = document.querySelector(".container");
const coverScreen = document.querySelector(".cover-screen");
const result = document.getElementById("result");
const overText = document.getElementById("over-text");
let matrix,
    prevMatrix,
    score,
    prevScore,
    isSwiped,
    touchY,
    initialY = 0,
    touchX,
    initialX = 0,
    rows = 4,
    columns = 4,
    swipeDirection;
let rectLeft = grid.getBoundingClientRect().left;
let rectTop = grid.getBoundingClientRect().top;
const getXY = (e) => {
    touchX = e.touches[0].pageX - rectLeft;
    touchY = e.touches[0].pageY - rectTop;
};

// Theme switcher
function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
}

// Функция переключения цветов
const toggleTheme = () => {
    if (localStorage.getItem('theme') === 'theme-dark') {
        setTheme('theme-light');
    } else {
        setTheme('theme-dark');
    }
}

const createGrid = () => {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const boxDiv = document.createElement("div");
            boxDiv.classList.add("box");
            boxDiv.setAttribute("data-position", `${i}_${j}`);
            grid.appendChild(boxDiv);
        }
    }
};
const adjacentCheck = (arr) => {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] == arr[i + 1]) {
            return true;
        }
    }
    return false;
};
const possibleMovesCheck = () => {
    for (let i in matrix) {
        if (adjacentCheck(matrix[i])) {
            return true;
        }
        let colarr = [];
        for (let j = 0; j < columns; j++) {
            colarr.push(matrix[i][j]);
        }
        if (adjacentCheck(colarr)) {
            return true;
        }
    }
    return false;
};

const randomPosition = (arr) => {
    return Math.floor(Math.random() * arr.length);
};

const hasEmptyBox = () => {
    for (let r in matrix) {
        for (let c in matrix[r]) {
            if (matrix[r][c] == 0) {
                return true;
            }
        }
    }
    return false;
};

const gameOver = () => {
    if (!possibleMovesCheck()) {
        coverScreen.classList.remove("hide");
        container.classList.add("hide");
        overText.classList.remove("hide");
        result.innerText = `Final score: ${score}`;
        startButton.innerText = "Restart Game";
    }
};
const generateTwo = () => {
    if (hasEmptyBox()) {
        let randomRow = randomPosition(matrix);
        let randomCol = randomPosition(matrix[randomPosition(matrix)]);
        if (matrix[randomRow][randomCol] == 0) {
            matrix[randomRow][randomCol] = 2;
            let element = document.querySelector(
                `[data-position = '${randomRow}_${randomCol}']`
            );
            element.innerHTML = 2;
            element.classList.add("box-2");
        } else {
            generateTwo();
        }
    } else {
        gameOver();
    }
};
const generateFour = () => {
    if (hasEmptyBox()) {
        let randomRow = randomPosition(matrix);
        let randomCol = randomPosition(matrix[randomPosition(matrix)]);
        if (matrix[randomRow][randomCol] == 0) {
            matrix[randomRow][randomCol] = 4;
            let element = document.querySelector(
                `[data-position= '${randomRow}_${randomCol}']`
            );
            element.innerHTML = 4;
            element.classList.add("box-4");
        } else {
            generateFour();
        }
    } else {
        gameOver();
    }
};

const removeZero = (arr) => arr.filter((num) => num);

const checker = (arr, reverseArr = false) => {
    arr = reverseArr ? removeZero(arr).reverse() : removeZero(arr);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] == arr[i + 1]) {
            arr[i] += arr[i + 1];
            arr[i + 1] = 0;
            score += arr[i];
        }
    }
    arr = reverseArr ? removeZero(arr).reverse() : removeZero(arr);
    let missingCount = 4 - arr.length;
    while (missingCount > 0) {
        if (reverseArr) {
            arr.unshift(0);
        } else {
            arr.push(0);
        }
        missingCount -= 1;
    }
    return arr;
};

// Функции для более легкого чтения функции slide
// Обновление элементов
const updateElement = (i, j, value) => {
    const element = document.querySelector(`[data-position='${i}_${j}']`);
    element.innerHTML = value ? value : "";
    element.classList.value = "";
    element.classList.add("box", `box-${value}`);
};

// Сравнение состояний матрицы и, если состояние изменилось выполняется функция decision
const arraysEqual = (arr1, arr2) => {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
};

// Генерация рандомных цифр 2 или 4
const decision = () => {
    let decision = Math.random() > 0.5 ? 1 : 0;
    if (decision) {
        setTimeout(generateFour, 200);
    } else {
        setTimeout(generateTwo, 200);
    }
}

// Для восстановления сетки матрицы на шаг назад
const undo = () => {
    if (prevMatrix) {
        matrix = JSON.parse(JSON.stringify(prevMatrix));
        score = prevScore;
        // Обновление отображения на сетке
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                updateElement(i, j, matrix[i][j]);
            }
        }
        document.getElementById("score").innerText = score;
        prevMatrix = null;
        prevScore = undefined;
    }
};

// Объединенная функция slide
const slide = (direction = false, matrixSize = 4, reverse = false) => {
    let isMatrixChanged = false;
    prevScore = score; // Сохраняем текущий счетчик
    for (let i = 0; i < matrixSize; i++) {
        let num = [];
        for (let j = 0; j < (direction ? columns : rows); j++) {
            if (direction) {
                num.push(matrix[i][j]);
            } else {
                num.push(matrix[j][i]);
            }
        }

        const oldRowOrCol = [...matrix[i]];
        // Сохраняем старую строку/столбец для сравнения

        num = checker(num, reverse);
        for (let j = 0; j < matrixSize; j++) {
            if (direction) {
                matrix[i][j] = num[j];
                updateElement(i, j, matrix[i][j]);
            } else {
                matrix[j][i] = num[j];
                updateElement(j, i, matrix[j][i]);
            }
        }
        if (!arraysEqual(oldRowOrCol, matrix[i])) {
            isMatrixChanged = true; // Матрица изменилась
        }
    }
    if (isMatrixChanged) {
        decision();
    }
};

const slideRight = () => {
    prevMatrix = JSON.parse(JSON.stringify(matrix));
    slide(true, rows, true);
};

const slideDown = () => {
    prevMatrix = JSON.parse(JSON.stringify(matrix));
    slide(false, columns, true);
};

const slideUp = () => {
    prevMatrix = JSON.parse(JSON.stringify(matrix));
    slide(false, columns);
};

const slideLeft = () => {
    prevMatrix = JSON.parse(JSON.stringify(matrix));
    slide(true, rows);
};

// Общая функция для обработки действий слайдов (клавиши и свайпы)
function handleSlideAction(slideFunction) {
    slideFunction();
    document.getElementById("score").innerText = score;
}

// Создаем объект с соответствиями между клавишами и функциями слайдов
const keyToSlideFunction = {
    ArrowLeft: slideLeft,
    ArrowRight: slideRight,
    ArrowUp: slideUp,
    ArrowDown: slideDown
};

// Обработчик события клавиатуры и свайпов
document.addEventListener("keyup", (e) => {
    const slideFunction = keyToSlideFunction[e.code];
    if (slideFunction) {
        handleSlideAction(slideFunction);
    }
});

grid.addEventListener("touchend", () => {
    isSwiped = false;
    const swipeCalls = {
        up: slideUp,
        down: slideDown,
        left: slideLeft,
        right: slideRight,
    };
    const slideFunction = swipeCalls[swipeDirection];
    if (slideFunction) {
        handleSlideAction(slideFunction);
    }
});

grid.addEventListener("touchstart", (event) => {
    isSwiped = true;
    getXY(event);
    initialX = touchX;
    initialY = touchY;
});
grid.addEventListener("touchmove", (event) => {
    if (isSwiped) {
        getXY(event);
        let diffX = touchX - initialX;
        let diffY = touchY - initialY;
        if (Math.abs(diffY) > Math.abs(diffX)) {
            swipeDirection = diffX > 0 ? "down" : "up";
        } else {
            swipeDirection = diffX > 0 ? "right" : "left";
        }
    }
});

const startGame = () => {
    score = 0;
    document.getElementById("score").innerText = score;
    grid.innerHTML = "";
    matrix = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
    container.classList.remove("hide");
    coverScreen.classList.add("hide");
    createGrid();
    generateTwo();
    generateTwo();
};
startButton.addEventListener("click", () => {
    startGame();
    swipeDirection = "";
});