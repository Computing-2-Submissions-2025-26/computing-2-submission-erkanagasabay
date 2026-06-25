import Tabula from "./Tabula.js";

/**
 * Main UI entry point for the Tabula game.
 * Handles rendering, DOM events, and game state transitions.
 * @module main
 */

/**
 * Shorthand alias for the imported Tabula game state type.
 * @typedef {import("./Tabula.js").GameState} GameState
 */

const romanNumerals = [
    "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII",
    "XIII", "XIV", "XV", "XVI", "XVII", "XVIII",
    "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV"
];

const dieFaces = {
    "1": "⚀",
    "2": "⚁",
    "3": "⚂",
    "4": "⚃",
    "5": "⚄",
    "6": "⚅"
};

const {Location, Player} = Tabula;

let state = Tabula.createGame();
const cellElements = [];

const boardElement = document.getElementById("board");
const boardCurrentPlayerElement = (
    document.getElementById("board-current-player")
);
const diceWhiteElement = document.getElementById("dice-white");
const diceBlackElement = document.getElementById("dice-black");
const winnerElement = document.getElementById("winner-message");
const rollWhiteButton = document.getElementById("roll-white-button");
const rollBlackButton = document.getElementById("roll-black-button");
const endTurnWhiteButton = document.getElementById("end-turn-white-button");
const endTurnBlackButton = document.getElementById("end-turn-black-button");
const restartButton = document.getElementById("restart-button");
const bearOffWhiteButton = document.getElementById("bear-off-white-button");
const bearOffBlackButton = document.getElementById("bear-off-black-button");
const barWhiteButton = document.getElementById("bar-white-button");
const barBlackButton = document.getElementById("bar-black-button");
const barWhiteCount = document.getElementById("bar-white");
const barBlackCount = document.getElementById("bar-black");
const borneWhiteCount = document.getElementById("borne-white");
const borneBlackCount = document.getElementById("borne-black");
const gameRulesButton = document.getElementById("game-rules-button");
const rulesModal = document.getElementById("rules-modal");
const rulesBackdrop = document.getElementById("rules-modal-backdrop");
const rulesCloseButton = document.getElementById("rules-close-button");

/**
 * Open or collapse the rules modal panel.
 * @param {boolean} isOpen True to open, false to collapse.
 */
function setRulesModalOpen(isOpen) {
    rulesModal.classList.toggle("is-open", isOpen);
    rulesModal.setAttribute("aria-hidden", String(!isOpen));
    gameRulesButton.setAttribute("aria-expanded", String(isOpen));
}

/**
 * Creates the board UI and attaches click/keyboard listeners
 * for each point.
 */
function handleBoardPointClick(event) {
    handleBoardClick(Number(event.currentTarget.dataset.index));
}

const createBoard = function () {
    let rowIndex = 0;

    boardElement.innerHTML = "";

    while (rowIndex < 2) {
        const row = document.createElement("tr");
        let columnIndex = 0;

        while (columnIndex < 12) {
            const pointIndex = rowIndex * 12 + columnIndex;

            const cell = document.createElement("td");
            const button = document.createElement("button");

            button.type = "button";
            button.className = "board-point";
            button.dataset.index = pointIndex.toString();

            button.setAttribute(
                "aria-label",
                `Point ${pointIndex + 1}`
            );

            button.addEventListener(
                "click",
                handleBoardPointClick
            );

            button.addEventListener(
                "keydown",
                handleBoardKeyDown
            );

            cell.appendChild(button);
            row.appendChild(cell);

            cellElements[pointIndex] = button;
            columnIndex += 1;
        }

        boardElement.appendChild(row);
        rowIndex += 1;
    }
};

/**
 * Handle a board point click, selecting or moving pieces as needed.
 * @param {number} pointIndex Index of the board point that was clicked.
 */
const handleBoardClick = function (pointIndex) {
    if (state.winner) {
        return;
    }

    const legalFromPoint = Tabula.getLegalMoves(state, pointIndex);

    const selected = state.selectedPoint;

    const isSameSelection = selected === pointIndex;

    if (isSameSelection) {
        state = Object.assign({}, state, {
            selectedPoint: null
        });

        render(state);
        return;
    }

    if (selected !== null) {
        const move = {
            from: selected,
            to: pointIndex
        };

        if (Tabula.isLegalMove(state, move)) {
            state = Tabula.movePiece(state, move);

            state = completeTurnIfReady(state);

            render(state);
            return;
        }
    }

    const point = state.board[pointIndex];

    const canSelect = (
        point.player === state.currentPlayer &&
        point.count > 0 &&
        state.bar[state.currentPlayer] === 0
    );

    if (canSelect && legalFromPoint.length > 0) {
        state = Object.assign({}, state, {
            selectedPoint: pointIndex
        });
    } else {
        state = Object.assign({}, state, {
            selectedPoint: null
        });
    }

    render(state);
};

/**
 * Handle clicking a bar button to select or deselect the bar.
 * @param {Player} player Player whose bar entry is being selected.
 */
function handleBarClick(player) {
    if (
        state.winner ||
        state.currentPlayer !== player ||
        state.bar[player] === 0
    ) {
        return;
    }

    const selected = state.selectedPoint;

    if (selected === Location.BAR) {
        state = Object.assign({}, state, {
            selectedPoint: null
        });

        render(state);
        return;
    }

    state = Object.assign({}, state, {
        selectedPoint: Location.BAR
    });

    render(state);
}

/**
 * Handle bearing off a selected piece if the move is legal.
 */
const handleBearOff = function () {
    if (
        state.winner ||
        state.selectedPoint === null ||
        state.selectedPoint === Location.BAR
    ) {
        return;
    }

    const legalMoves = Tabula.getLegalMoves(state, state.selectedPoint);

    if (!legalMoves.includes(Location.OFF)) {
        return;
    }

    state = Tabula.movePiece(state, {
        from: state.selectedPoint,
        to: Location.OFF
    });

    state = completeTurnIfReady(state);

    render(state);
};

/**
 * Handle the roll dice action for the current player.
 */
const handleRollDice = function () {
    if (state.winner || state.dice.length > 0) {
        return;
    }

    state = Tabula.rollDice(state);

    render(state);
};

/**
 * Handle ending the current player's turn.
 */
const handleEndTurn = function () {
    if (state.winner || state.dice.length === 0) {
        return;
    }

    state = Tabula.switchPlayer(state);

    render(state);
};

/**
 * Handle restarting the game and resetting state.
 */
const handleRestart = function () {
    state = Tabula.createGame();

    render(state);
};

/**
 * Handle arrow-key navigation between board points.
 * @param {KeyboardEvent} event Keyboard event that may move
 * focus between points.
 */
const handleBoardKeyDown = function (event) {
    const button = event.currentTarget;

    const currentIndex = Number(button.dataset.index);

    let nextIndex = null;

    if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % 24;
    }

    if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex + 23) % 24;
    }

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
    ) {
        nextIndex = (currentIndex + 12) % 24;
    }

    if (nextIndex !== null) {
        event.preventDefault();
        cellElements[nextIndex].focus();
    }
};

/**
 * Complete the current turn and switch players if the turn is finished.
 * @param {GameState} currentState Current game state.
 * @returns {GameState}
 */
const completeTurnIfReady = function (currentState) {
    if (currentState.winner) {
        return currentState;
    }

    if (Tabula.isTurnComplete(currentState)) {
        return Tabula.switchPlayer(currentState);
    }

    return currentState;
};

/**
 * Render the game UI to reflect the latest state.
 * @param {GameState} currentState Current game state.
 */
const render = function (currentState) {
    const legalDestinations = (
        currentState.selectedPoint === null
        ? []
        : Tabula.getLegalMoves(
            currentState,
            currentState.selectedPoint
        )
    );

    currentState.board.forEach(
        function (point, index) {
            const button = cellElements[index];

            button.className = "board-point";

            if (point.player) {
                button.classList.add(
                    point.player.toLowerCase()
                );
            }

            if (
                point.player ===
                currentState.currentPlayer
            ) {
                button.classList.add("active");
            }

            if (
                point.player &&
                point.player !== currentState.currentPlayer &&
                point.count > 1
            ) {
                button.classList.add("blocked");
            }

            if (
                currentState.selectedPoint === index
            ) {
                button.classList.add("selected");
            }

            if (
                legalDestinations.includes(index)
            ) {
                button.classList.add("legal");
            }

            const pieceClass = (
                point.player
                ? point.player.toLowerCase()
                : ""
            );

            const piecesHtml = new Array(point.count).fill("").map(
                function () {
                    return (
                        "<span class=\"piece " +
                        pieceClass +
                        "\" aria-hidden=\"true\"></span>"
                    );
                }
            ).join("");

            button.innerHTML = `
                <div class="piece-stack">
                    ${piecesHtml}
                </div>

                <span class="point-label">
                    ${romanNumerals[index]}
                </span>
            `;

            button.setAttribute(
                "aria-label",
                `Point ${index + 1}, ${
                    point.player || "empty"
                }, ${point.count} piece${
                    (
                        point.count === 1
                        ? ""
                        : "s"
                    )
                }`
            );
        }
    );

    boardCurrentPlayerElement.textContent = currentState.currentPlayer;

    const diceHtml = (
        currentState.dice.length > 0
        ? currentState.dice.map(
            function (die) {
                return (
                    `<span class="die-face">${dieFaces[die] || ""}</span>`
                );
            }
        ).join("")
        : "Click roll dice to begin"
    );

    // Show dice only for the active player; other player's panel shows prompt
    if (currentState.currentPlayer === Player.WHITE) {
        diceWhiteElement.innerHTML = diceHtml;
        diceBlackElement.innerHTML = "Click roll dice to begin";
    } else {
        diceBlackElement.innerHTML = diceHtml;
        diceWhiteElement.innerHTML = "Click roll dice to begin";
    }

    const hasWinner = currentState.winner !== null;

    winnerElement.textContent = (
        hasWinner
        ? `Winner: ${currentState.winner}`
        : ""
    );

    winnerElement.classList.toggle(
        "is-visible",
        hasWinner
    );

    winnerElement.setAttribute(
        "aria-hidden",
        String(!hasWinner)
    );

    rollWhiteButton.disabled = (
        currentState.winner !== null ||
        currentState.dice.length > 0 ||
        currentState.currentPlayer !== Player.WHITE
    );

    rollBlackButton.disabled = (
        currentState.winner !== null ||
        currentState.dice.length > 0 ||
        currentState.currentPlayer !== Player.BLACK
    );

    endTurnWhiteButton.disabled = (
        currentState.winner !== null ||
        currentState.dice.length === 0 ||
        currentState.currentPlayer !== Player.WHITE
    );

    endTurnBlackButton.disabled = (
        currentState.winner !== null ||
        currentState.dice.length === 0 ||
        currentState.currentPlayer !== Player.BLACK
    );

    bearOffWhiteButton.disabled = (
        currentState.currentPlayer !== Player.WHITE ||
        !legalDestinations.includes(Location.OFF) ||
        currentState.winner !== null
    );

    bearOffBlackButton.disabled = (
        currentState.currentPlayer !== Player.BLACK ||
        !legalDestinations.includes(Location.OFF) ||
        currentState.winner !== null
    );

    barWhiteCount.textContent = currentState.bar[Player.WHITE];

    barBlackCount.textContent = currentState.bar[Player.BLACK];

    borneWhiteCount.textContent = currentState.borneOff[Player.WHITE];

    borneBlackCount.textContent = currentState.borneOff[Player.BLACK];

    barWhiteButton.classList.toggle(
        "active",
        currentState.currentPlayer === Player.WHITE &&
        currentState.bar[Player.WHITE] > 0
    );

    barWhiteButton.classList.toggle(
        "inactive",
        currentState.bar[Player.WHITE] === 0
    );

    barBlackButton.classList.toggle(
        "active",
        currentState.currentPlayer === Player.BLACK &&
        currentState.bar[Player.BLACK] > 0
    );

    barBlackButton.classList.toggle(
        "inactive",
        currentState.bar[Player.BLACK] === 0
    );
};

createBoard();
render(state);

rollWhiteButton.addEventListener("click", function () {
    if (state.currentPlayer === Player.WHITE) {
        handleRollDice();
    }
});

rollBlackButton.addEventListener("click", function () {
    if (state.currentPlayer === Player.BLACK) {
        handleRollDice();
    }
});

endTurnWhiteButton.addEventListener("click", function () {
    if (state.currentPlayer === Player.WHITE) {
        handleEndTurn();
    }
});

endTurnBlackButton.addEventListener("click", function () {
    if (state.currentPlayer === Player.BLACK) {
        handleEndTurn();
    }
});

restartButton.addEventListener("click", handleRestart);

barWhiteButton.addEventListener(
    "click",
    function () {
        handleBarClick(Player.WHITE);
    }
);

barBlackButton.addEventListener(
    "click",
    function () {
        handleBarClick(Player.BLACK);
    }
);

bearOffWhiteButton.addEventListener("click", function () {
    if (state.currentPlayer === Player.WHITE) {
        handleBearOff();
    }
});

bearOffBlackButton.addEventListener("click", function () {
    if (state.currentPlayer === Player.BLACK) {
        handleBearOff();
    }
});

gameRulesButton.addEventListener("click", function () {
    setRulesModalOpen(true);
});

rulesBackdrop.addEventListener("click", function () {
    setRulesModalOpen(false);
});

rulesCloseButton.addEventListener("click", function () {
    setRulesModalOpen(false);
});

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
        return;
    }

    if (rulesModal.classList.contains("is-open")) {
        setRulesModalOpen(false);
    }
});