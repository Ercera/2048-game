let field = document.querySelector(".field");
let isGameFinished = false;

const continueButton = document.getElementById("continueBtn");
const startButton = document.getElementById("startBtn");
const restartButton = document.getElementById("restartBtn");

const homeButton = document.getElementById("homeBtn");
const themeButton = document.getElementById("themeBtn");
const undoButton = document.getElementById("undoBtn");

const container = document.querySelector(".container");
const coverScreen = document.querySelector(".cover-screen");
const finish = document.querySelector("#finish");
const currResult = document.getElementById("result");
const currText = document.getElementById("over-text");
const overText = document.getElementById("finish__over-text");
const overResult = document.getElementById("finish__result");

let matrix,
    prevMatrix,
    best = 0,
    score = 0,
    prevScore,
    isSwiped,
    touchY,
    touchX,
    startX,
    startY,
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
const setTheme = (themeName) => {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
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

const restoreGameState = () => {
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

async function animateButton(button, textBtn) {
    const buttonText = textBtn;
    button.textContent = '';

    for (let i = 0; i < buttonText.length; i++) {
        await new Promise(resolve => {
            setTimeout(() => {
                button.textContent += buttonText[i];
                resolve();
            }, 150);
        });
    }
}

const changeBoxStyles = () => {
    const boxElements = document.querySelectorAll('.box');
    boxElements.forEach(box => {
        box.style.transition = 'all 5s ease-in';

    });
    setTimeout(() => {
        boxElements.forEach(box => {
            box.style.backgroundColor = 'var(--gray-bg)';
            box.style.color = 'var(--text-over)';
        });
    }, 150);
};

const gameOver = (timeout = 40) => {
    if (!possibleMovesCheck()) {
        setTimeout(() => {
            isGameFinished = true;
            finish.classList.remove("hide");
            restartButton.classList.remove("hide");
            continueButton.classList.add("hide");
            overText.classList.remove("hide");
            overResult.innerText = `Final score: ${score}`;
            changeBoxStyles();
        }, timeout);
    }
};

const randomPosition = (arr) => {
    return Math.floor(Math.random() * arr.length);
};

const hasEmptyBox = () => {
    for (let row in matrix) {
        for (let column in matrix[row]) {
            if (matrix[row][column] == 0) {
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
        animateButton(restartButton, 'Restart...?!');
        prevMatrix = null;
        prevScore = undefined;
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
// Обновление отображения элемента на сетке
const updateBox = (i, j, value) => {
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
        setTimeout(generateNumber(4), 250);
    } else {
        setTimeout(generateNumber(2), 250);
    }
}

// Объединенная функция slide
const slide = (direction = false, matrixSize = 4, reverse = false) => {
    if (isGameFinished) return;
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
            updateBox(rowIndex, colIndex, matrix[rowIndex][colIndex]);
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

// ======== Кнопки меню ======== 
// Обработчик кнопки "Home"
const home = () => {
    if (isGameFinished) return;

    container.classList.add("hide");
    coverScreen.classList.remove("hide");
    currText.classList.add("hide");
    currResult.innerText = `Current score: ${score}`;
}

// Обработчик кнопки "Toggle Theme"
const toggleTheme = () => {
    if (isGameFinished) return;

    if (localStorage.getItem('theme') === 'theme-dark') {
        setTheme('theme-light');
    } else {
        setTheme('theme-dark');
    }
}

// Обработчик кнопки "Undo"
const undo = () => {
    if (isGameFinished) return;

    if (prevMatrix) {
        matrix = JSON.parse(JSON.stringify(prevMatrix));
        score = prevScore;
        // Обновление отображения на сетке
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                updateBox(i, j, matrix[i][j]);
            }
        }
        document.getElementById("score").innerText = score;
        prevMatrix = null;
        prevScore = undefined;
    }
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
    isGameFinished = false;
    matrix = JSON.parse(localStorage.getItem('matrix'));
    score = parseInt(localStorage.getItem('score'));
    gameCheck();

    // Обновление отображения элементов на сетке (визуального представления матрицы)
    matrix.forEach((row, i) => {
        row.forEach((value, j) => {
            updateBox(i, j, value);
        });
    });
    swipeDirection = "";
};

const startGame = () => {
    isGameFinished = false;
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
    finish.classList.add("hide");
    overText.classList.add("hide");
    swipeDirection = "";
};

// ======== Обработка слайдов и жестов: ======== 
// Общая функция для обработки действий слайдов (клавиши и свайпы)
function handleSlideAction(slideFunction) {
    if (isGameFinished) return;

    slideFunction();
    document.getElementById("score").innerText = score;
    if (!possibleMovesCheck()) {
        gameOver();
        animateButton(restartButton, 'Restart...?!');
        prevMatrix = null;
        prevScore = undefined;
    }
}

// Создаем объект с соответствиями между клавишами и функциями слайдов
const keyToSlideFunction = {
    ArrowLeft: slideLeft,
    ArrowRight: slideRight,
    ArrowUp: slideUp,
    ArrowDown: slideDown
};

// ======= Обработчик события клавиатуры и свайпов ======= 
// Функция обработки события клавиатуры
const handleKeyup = (e) => {
    const slideFunction = keyToSlideFunction[e.code];
    if (slideFunction) {
        handleSlideAction(slideFunction);
    }
};

// Функция обработки события касания поля
const handleTouchStart = (event) => {
    isSwiped = true;
    getXY(event);
    startY = touchY;
    startX = touchX;
};

// Функция обработки события перемещения пальца по экрану
const handleTouchMove = event => {
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
};

// Функция обработки угла свайпа на поле field для альтернативного управления
const handleTouchAngle = () => {
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
};

// Функция обработки события отпускания пальца
const handleTouchEnd = () => {
    if (isGameFinished) return;

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
    handleTouchAngle();
};

// ======== Все слушатели событий ========
// Кпопки настроек
homeButton.addEventListener("click", home);
themeButton.addEventListener("click", toggleTheme);
undoButton.addEventListener("click", undo);

// Кнопки меню
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
continueButton.addEventListener("click", continueGame);

// Обработка для мобильных браузеров
document.addEventListener("keyup", handleKeyup);
field.addEventListener("touchstart", handleTouchStart);
field.addEventListener("touchmove", handleTouchMove);
field.addEventListener("touchend", handleTouchEnd);