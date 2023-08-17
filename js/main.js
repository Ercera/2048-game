let field = document.querySelector(".field");
const continueButton = document.getElementById("continue");
const startButton = document.getElementById("start-button");
const container = document.querySelector(".container");
const coverScreen = document.querySelector(".cover-screen");
const result = document.getElementById("result");
const overText = document.getElementById("over-text");

let matrix,
    prevMatrix,
    best = 0,
    score = 0,
    prevScore,
    isSwiped,
    touchY,
    initialY = 0,
    touchX,
    initialX = 0,
    rows = 4,
    columns = 4,
    swipeDirection;

let rectLeft = field.getBoundingClientRect().left;
let rectTop = field.getBoundingClientRect().top;

const getXY = (e) => {
    touchX = e.touches[0].pageX - rectLeft;
    touchY = e.touches[0].pageY - rectTop;
};

// ======== Управление темой ======== 
function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
}

const toggleTheme = () => {
    if (localStorage.getItem('theme') === 'theme-dark') {
        setTheme('theme-light');
    } else {
        setTheme('theme-dark');
    }
}

// ======== Состояние игры. ======== 
// Выгрузка данных, если они есть в пользовательском кеше
// Проверка наличия данных в localStorage
const checkScore = () => {
    // Проверяем, изменился ли score и обновляем bestScore
    if (score > best) {
        best = score;
        document.getElementById("best-score").innerText = best;
        localStorage.setItem('bestScore', best);
    }
}

function restoreGameState() {
    const savedSettings = {
        theme: 'theme-light',
        matrix: null,
        bestScore: null,
        score: null
    };

    for (const key in savedSettings) {
        const savedValue = localStorage.getItem(key);
        if (savedValue) {
            if (key === 'matrix') {
                continueButton.classList.remove("hide");
                matrix = JSON.parse(savedValue);
            } else if (key === 'bestScore') {
                best = parseInt(savedValue);
                document.getElementById("best-score").innerText = best;
            } else if (key === 'score') {
                score = parseInt(savedValue);
                document.getElementById("score").innerText = score;
            } else if (key === 'theme') {
                setTheme(savedValue);
            }
        } else if (key === 'theme') {
            setTheme(savedSettings.theme);
        }
    }
    checkScore();
}
restoreGameState();

const createField = () => {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const boxDiv = document.createElement("div");
            boxDiv.classList.add("box");
            boxDiv.setAttribute("data-position", `${i}_${j}`);
            field.appendChild(boxDiv);
        }
    }
};

// Поиск соседних одинаковых элементов в массиве
// Метод some вернет true, если хотя бы одна пара соседних элементов равны друг другу
const adjacentCheck = (arr) =>
    arr.some((value, index) =>
        value === arr[index + 1]);

// Проверка соседних одинаковых элементов в строках и столбцах матрицы
const possibleMovesCheck = () => {
    return matrix.some(row => adjacentCheck(row)) ||
        matrix[0].map((col, j) => adjacentCheck(matrix.map(row => row[j]))).some(Boolean);
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

const generateNumber = (number) => {
    if (hasEmptyBox()) {
        let randomRow = randomPosition(matrix);
        let randomCol = randomPosition(matrix[randomPosition(matrix)]);
        if (matrix[randomRow][randomCol] == 0) {
            matrix[randomRow][randomCol] = number;
            let element = document.querySelector(
                `[data-position='${randomRow}_${randomCol}']`
            );
            element.innerHTML = number;
            element.classList.add(`box-${number}`);
        } else {
            generateNumber(number);
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

// Кнопка возврата на главный экран
const home = () => {
    container.classList.add("hide");
    coverScreen.classList.remove("hide");
    overText.classList.add("hide");
    result.innerText = `Current score: ${score}`;
}

// Генерация рандомных цифр 2 или 4
const decision = () => {
    let decision = Math.random() > 0.5 ? 1 : 0;
    if (decision) {
        setTimeout(generateNumber(4), 200);
    } else {
        setTimeout(generateNumber(2), 200);
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
    const oldMatrix = JSON.parse(JSON.stringify(matrix));
    let isMatrixChanged = false;
    prevScore = score;
    for (let i = 0; i < matrixSize; i++) {
        let num = [];
        for (let j = 0; j < matrixSize; j++) {
            const rowIndex = direction ? i : j;
            const colIndex = direction ? j : i;
            num.push(matrix[rowIndex][colIndex]);
        }

        num = checker(num, reverse);
        for (let j = 0; j < matrixSize; j++) {
            const rowIndex = direction ? i : j;
            const colIndex = direction ? j : i;
            matrix[rowIndex][colIndex] = num[j];
            updateElement(rowIndex, colIndex, matrix[rowIndex][colIndex]);
        }
    }
    if (!arraysEqual(oldMatrix, matrix)) { // Проверяем изменения во всей матрице
        isMatrixChanged = true; // Матрица изменилась
    }
    if (isMatrixChanged) {
        decision();
        localStorage.setItem('matrix', JSON.stringify(matrix));
        localStorage.setItem('score', score);
        prevMatrix = oldMatrix;
        checkScore();
    }
};

const slideRight = () => {
    slide(true, rows, true);
};

const slideDown = () => {
    slide(false, columns, true);
};

const slideUp = () => {
    slide(false, columns);
};

const slideLeft = () => {
    slide(true, rows);
};

// ======== Логика запуска: ======== 
const gameCheck = () => {
    document.getElementById("score").innerText = score;
    field.innerHTML = "";
    createField();
    container.classList.remove("hide");
    coverScreen.classList.add("hide");
    decision();
}

const continueGame = () => {
    matrix = JSON.parse(localStorage.getItem('matrix'));
    score = parseInt(localStorage.getItem('score'));
    gameCheck();

    // Обновление отображения элементов на сетке (визуального представления матрицы)
    matrix.forEach((row, i) => {
        row.forEach((value, j) => {
            updateElement(i, j, value);
        });
    });
};

const startGame = () => {
    matrix = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
    score = 0;
    gameCheck();
    // Сохранение начальных значений в localStorage
    localStorage.setItem('matrix', JSON.stringify(matrix));
    localStorage.setItem('score', score);
    decision();
};

startButton.addEventListener("click", () => {
    startGame();
    swipeDirection = "";
});

continueButton.addEventListener("click", () => {
    continueGame();
    swipeDirection = "";
});

const gameOver = () => {
    if (!possibleMovesCheck()) {
        coverScreen.classList.remove("hide");
        container.classList.add("hide");
        continueButton.classList.add("hide");
        overText.classList.remove("hide");
        result.innerText = `Final score: ${score}`;
        startButton.innerText = "Restart Game";
    }
};

// ======== Обработка слайдов и жестов: ======== 
// Общая функция для обработки действий слайдов (клавиши и свайпы)
function handleSlideAction(slideFunction) {
    slideFunction();
    document.getElementById("score").innerText = score;
    if (!possibleMovesCheck()) {
        gameOver();
    }
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

let startY;
let startX;

field.addEventListener("touchstart", (event) => {
    isSwiped = true;
    getXY(event);
    startY = touchY; // Сохраняем начальные координаты Y
    startX = touchX; // Сохраняем начальные координаты X
});
field.addEventListener("touchmove", (event) => {
    if (isSwiped) {
        getXY(event);
        let diffX = touchX - startX;
        let diffY = touchY - startY;

        // Определяем направление скролла в зависимости от разницы в координатах
        if (Math.abs(diffY) > Math.abs(diffX)) {
            swipeDirection = diffY > 0 ? "down" : "up";
        } else {
            swipeDirection = diffX > 0 ? "right" : "left";
        }
    }
});

field.addEventListener("touchend", () => {
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

    // Тестовое использование, для мобильных устройств, вместо свайпа,
    // можно нажимать на область в пределах поля field и имитировать свайпы
    const fieldPosition = field.getBoundingClientRect();
    const centerX = field.clientWidth / 2;
    const centerY = field.clientHeight / 2;
    const relativeX = touchX - centerX - fieldPosition.left;
    const relativeY = touchY - centerY - fieldPosition.top;
    const angleDegrees = Math.atan2(relativeY, relativeX) * (180 / Math.PI);

    if (angleDegrees > -45 && angleDegrees <= 45) {
        slideRight();
    } else if (angleDegrees > 45 && angleDegrees <= 135) {
        slideDown();
    } else if (angleDegrees > 135 || angleDegrees <= -135) {
        slideLeft();
    } else {
        slideUp();
    }
});