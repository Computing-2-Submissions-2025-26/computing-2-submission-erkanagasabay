import R from "./ramda.js";

/**
 * Core Tabula game type definitions and helper constructors.
 */

/**
 * Represents a player in the game.
 * @readonly
 * @enum {string}
 */
export const Player = {
    WHITE: "WHITE",
    BLACK: "BLACK"
};

/**
 * Represents special board locations outside the normal points.
 * @readonly
 * @enum {string}
 */
export const Location = {
    BAR: "BAR",
    OFF: "OFF"
};

/**
 * Creates a new point object for the board.
 * @param {Player|null} [player=null] Player occupying the
 * new point, or null if empty.
 * @param {number} [count=0] Number of pieces on the new point.
 * @returns {Object} Point object with player and count
 * properties.
 */
export const createPoint = (player = null, count = 0) => ({
    player,
    count
});

/**
 * Builds the initial Tabula board configuration.
 * @returns {Object[]} Array of point objects representing the
 * initial board state.
 */
export const createInitialBoard = () => [
    { player: Player.WHITE, count: 2 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: Player.BLACK, count: 5 },
    { player: null, count: 0 },
    { player: Player.BLACK, count: 3 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: Player.WHITE, count: 5 },
    { player: Player.BLACK, count: 5 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: Player.WHITE, count: 3 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: null, count: 0 },
    { player: Player.WHITE, count: 5 },
    { player: null, count: 0 },
    { player: null, count: 0 }
];

/**
 * Tabula.js models and runs the board game "Tabula".
 * Inspired by ancient Roman backgammon.
 *
 * @namespace Tabula
 * @author Emily Kanagasabay
 * @version 2026
 */
const Tabula = Object.create(null);

/**
 * A move in the Tabula game.
 *
 * @typedef {Object} Move
 * @memberof Tabula
 * @property {number|Location} from Starting position (board index or BAR)
 * @property {number|Location} to Destination position (board index or OFF)
 */

/**
 * A single board point.
 *
 * @typedef {Object} Point
 * @memberof Tabula
 * @property {Player|null} player Which player owns this point,
 * or null when empty.
 * @property {number} count Number of pieces stacked at this
 * point.
 */

/**
 * The full game state for Tabula.
 *
 * @typedef {Object} GameState
 * @memberof Tabula
 * @property {Point[]} board Array of 24 board points
 * representing the game board.
 * @property {Object.<Player, number>} bar Number of pieces on
 * the bar for each player.
 * @property {Object.<Player, number>} borneOff Number of
 * pieces borne off for each player.
 * @property {Player} currentPlayer Player whose turn is active.
 * @property {number[]} dice Dice values available in the
 * current turn.
 * @property {number|Location|null} selectedPoint Currently
 * selected source position, bar entry, or null.
 * @property {number} turn Current turn number.
 * @property {Player|null} winner Winning player, or null if
 * the game is still active.
 */

/**
 * Returns the opponent of the given player.
 *
 * @function
 * @memberof Tabula
 * @param {Player} player Player attempting the move or selection.
 * @returns {Player}
 */
const getOpponent = (player) => (
    player === Player.WHITE
        ? Player.BLACK
        : Player.WHITE
);

/**
 * Returns movement direction for a player.
 * WHITE moves forward (+1), BLACK moves backward (-1).
 *
 * @function
 * @memberof Tabula
 * @param {Player} player Player attempting the move or selection.
 * @returns {number}
 */
const getDirection = (player) => (
    player === Player.WHITE
        ? 1
        : -1
);

/**
 * Checks whether a board index is valid.
 *
 * @function
 * @memberof Tabula
 * @param {number} index Board index to validate or access.
 * @returns {boolean}
 */
const isWithinBoard = (index) => index >= 0 && index < 24;

/**
 * Safely retrieves a board point.
 *
 * @function
 * @memberof Tabula
 * @param {Object[]} board Board array representing points and piece counts.
 * @param {number} index Board index to validate or access.
 * @returns {Object|null}
 */
const getBoardPoint = (board, index) => (
    isWithinBoard(index)
        ? board[index]
        : null
);

/**
 * Creates a new game state.
 *
 * @function
 * @memberof Tabula
 * @returns {GameState} Initial game state
 */
Tabula.createGame = () => ({
    board: createInitialBoard(),
    bar: {
        [Player.WHITE]: 0,
        [Player.BLACK]: 0
    },
    borneOff: {
        [Player.WHITE]: 0,
        [Player.BLACK]: 0
    },
    currentPlayer: Player.WHITE,
    dice: [],
    selectedPoint: null,
    turn: 1,
    winner: null
});

/**
 * Returns the board from state.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {Point[]}
 */
Tabula.getBoard = (state) => state.board;

/**
 * Returns the current player.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {Player}
 */
Tabula.getCurrentPlayer = (state) => state.currentPlayer;

/**
 * Rolls a single die (1–6).
 *
 * @function
 * @memberof Tabula
 * @returns {number}
 */
const rollDie = () => Math.floor(Math.random() * 6) + 1;

/**
 * Rolls three dice for the current turn.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {GameState}
 */
Tabula.rollDice = (state) => {
    if (state.winner || state.dice.length > 0) {
        return state;
    }

    return {
        ...state,
        dice: [rollDie(), rollDie(), rollDie()]
    };
};

/**
 * Returns entry index for bar entry.
 *
 * @function
 * @memberof Tabula
 * @param {Player} player Player attempting the move or selection.
 * @returns {number}
 */
const getBarEntryIndex = (player) =>
    player === Player.WHITE ? 0 : 23;

/**
 * Determines whether a destination is open.
 *
 * @function
 * @memberof Tabula
 * @param {Point} point Board point to inspect.
 * @param {Player} player Player attempting the move or selection.
 * @returns {boolean}
 */
const isDestinationOpen = (point, player) =>
    point.player === player ||
    point.player === null ||
    point.count === 1;

/**
 * Determines if a piece can be borne off.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @param {number} pointIndex Point index to evaluate for
 * movement or bearing off.
 * @param {number} dieValue Die value used to calculate
 * movement distance.
 * @returns {boolean}
 */
const canBearOffFrom = (state, pointIndex, dieValue) => {
    const { board, currentPlayer } = state;

    const homeStart = currentPlayer === Player.WHITE ? 18 : 0;
    const homeEnd = currentPlayer === Player.WHITE ? 23 : 5;

    const inHomeBoard = board.reduce((sum, point, index) => {
        if (point.player !== currentPlayer) return sum;

        if (currentPlayer === Player.WHITE) {
            return index >= homeStart ? sum + point.count : sum;
        }

        return index <= homeEnd ? sum + point.count : sum;
    }, 0);

    const totalOnBoard = board.reduce(
        (sum, p) =>
            sum + (p.player === currentPlayer ? p.count : 0),
        0
    );

    if (totalOnBoard === 0 || inHomeBoard !== totalOnBoard) {
        return false;
    }

    const distance =
        currentPlayer === Player.WHITE
            ? 24 - pointIndex
            : pointIndex + 1;

    return dieValue === distance;
};

/**
 * Returns every reachable destination from a source point
 * using any valid combination and ordering of remaining dice.
 * Intermediate points must also be legal.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @param {number|Location} pointIndex Source point index or
 * special location for the move.
 * @returns {Array.<number|Location>}
 */
Tabula.getLegalMoves = (state, pointIndex) => {
    const {
        board,
        currentPlayer,
        dice,
        bar
    } = state;

    if (dice.length === 0) {
        return [];
    }

    /**
     * Generates all permutations of an array.
     *
     * @param {number[]} values Dice values to generate sequences from.
     * @returns {number[][]}
     */
    const getPermutations = (values) => {
        if (values.length <= 1) {
            return [values];
        }

        return values.flatMap((value, index) => {
            const remaining = [
                ...values.slice(0, index),
                ...values.slice(index + 1)
            ];

            return getPermutations(remaining).map(
                (perm) => [value, ...perm]
            );
        });
    };

    /**
     * Generates all ordered dice combinations.
     *
     * Examples:
     * [1]
     * [3]
     * [5]
     * [1,3]
     * [3,1]
     * [1,5]
     * [5,1]
     * [1,3,5]
     * etc.
     *
     * @param {number[]} values Dice values to generate
     * sequences from.
     * @returns {number[][]}
     */
    const getDiceSequences = (values) => {
        const results = [];

        /**
         * Recursive subset builder.
         *
         * @param {number[]} remaining Remaining dice values
         * available for the sequence.
         * @param {number[]} current Currently built dice
         * sequence.
         */
        const build = (
            remaining,
            current
        ) => {
            if (current.length > 0) {
                results.push(
                    ...getPermutations(current)
                );
            }

            remaining.forEach((value, index) => {
                build(
                    [
                        ...remaining.slice(0, index),
                        ...remaining.slice(index + 1)
                    ],
                    [...current, value]
                );
            });
        };

        build(values, []);

        return results;
    };

    /**
     * Checks whether every step in a movement sequence is legal.
     *
     * @param {number} start Starting board index for the sequence.
     * @param {number[]} sequence Ordered dice sequence to follow.
     * @returns {number|null}
     */
    const followSequence = (
        start,
        sequence
    ) => {
        const direction =
            getDirection(currentPlayer);

        let current = start;

        for (const die of sequence) {
            const destination =
                current + direction * die;

            if (!isWithinBoard(destination)) {
                return null;
            }

            const point =
                getBoardPoint(
                    board,
                    destination
                );

            if (
                !isDestinationOpen(
                    point,
                    currentPlayer
                )
            ) {
                return null;
            }

            current = destination;
        }

        return current;
    };

    /**
     * Determines whether a source point is selectable.
     */
    if (pointIndex === Location.BAR) {
        if (bar[currentPlayer] === 0) {
            return [];
        }
    } else {
        const sourcePoint =
            getBoardPoint(board, pointIndex);

        if (
            !sourcePoint ||
            sourcePoint.player !== currentPlayer ||
            sourcePoint.count === 0
        ) {
            return [];
        }

        if (bar[currentPlayer] > 0) {
            return [];
        }
    }

    const startIndex =
        pointIndex === Location.BAR
            ? getBarEntryIndex(currentPlayer)
            : pointIndex;

    const sequences =
        getDiceSequences(dice);

    const legalMoves = [];

    sequences.forEach((sequence) => {
        const destination =
            followSequence(
                startIndex,
                sequence
            );

        if (destination !== null) {
            legalMoves.push(destination);
        }

        const totalDistance =
            sequence.reduce(
                (sum, value) => sum + value,
                0
            );

        if (
            pointIndex !== Location.BAR &&
            canBearOffFrom(
                state,
                pointIndex,
                totalDistance
            )
        ) {
            legalMoves.push(Location.OFF);
        }
    });

    return R.uniq(legalMoves);
};

/**
 * Checks whether a move is legal.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @param {Move} move Proposed move with source and destination.
 * @returns {boolean}
 */
Tabula.isLegalMove = (state, move) => {
    if (!move || typeof move !== "object") return false;

    const legalMoves = Tabula.getLegalMoves(state, move.from);
    return R.includes(move.to, legalMoves);
};

/**
 * Removes a used die value from the dice pool.
 *
 * @function
 * @memberof Tabula
 * @param {number[]} dice Available dice values in the current turn.
 * @param {number} value Die value to remove from the current dice pool.
 * @returns {number[]}
 */
const removeDie = (dice, value) => {
    const index = dice.indexOf(value);
    if (index === -1) return dice;
    return [...dice.slice(0, index), ...dice.slice(index + 1)];
};

/**
 * Executes a move and returns updated state.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @param {Move} move Proposed move with source and destination.
 * @returns {GameState}
 */
Tabula.movePiece = (state, move) => {
    if (!Tabula.isLegalMove(state, move) || state.winner) {
        return state;
    }

    const { board, currentPlayer, bar, borneOff } = state;
    const opponent = getOpponent(currentPlayer);

    const nextBoard = board.map((p) => ({ ...p }));
    const nextBar = { ...bar };
    const nextBorneOff = { ...borneOff };

    const sourceIndex = move.from;
    const destination = move.to;

    let entryDieUsed = null;

    if (sourceIndex === Location.BAR) {
        nextBar[currentPlayer]--;

        // determine which die actually produced this move
        const entryIndex = getBarEntryIndex(currentPlayer);
        const direction = getDirection(currentPlayer);

        const possibleDice = state.dice.filter((die) => {
            return entryIndex + direction * die === destination;
        });

        entryDieUsed = possibleDice[0] ?? null;
    } else {
        const source = nextBoard[sourceIndex];
        const count = source.count - 1;

        nextBoard[sourceIndex] = {
            player: count > 0 ? currentPlayer : null,
            count
        };
    }

    let distanceMoved = 0;

    if (destination === Location.OFF) {
        nextBorneOff[currentPlayer]++;

        distanceMoved =
            currentPlayer === Player.WHITE
                ? 24 - sourceIndex
                : sourceIndex + 1;
    } else {
        const target = nextBoard[destination];

        if (target.player === opponent && target.count === 1) {
            nextBar[opponent]++;
            nextBoard[destination] = {
                player: currentPlayer,
                count: 1
            };
        } else {
            nextBoard[destination] = {
                player: currentPlayer,
                count: target.count + 1
            };
        }

        distanceMoved = Math.abs(destination - sourceIndex);
    }

    /**
     * Removes an ordered sequence of dice.
     *
     * @param {number[]} availableDice Dice values still available to use.
     * @param {number[]} usedDice Dice values already consumed for a move.
     * @returns {number[]}
     */
    const removeDiceSequence = (
        availableDice,
        usedDice
    ) => {
        const remaining = [...availableDice];

        usedDice.forEach((die) => {
            const index =
                remaining.indexOf(die);

            if (index !== -1) {
                remaining.splice(index, 1);
            }
        });

        return remaining;
    };

    /**
     * Finds a valid dice sequence
     * matching a travelled distance.
     *
     * @param {number[]} availableDice Dice values still available to use.
     * @param {number} distance Total distance travelled by a proposed move.
     * @returns {number[]}
     */
    const findUsedDice = (
        availableDice,
        distance
    ) => {
        const sequences = [];

        const build = (
            remaining,
            current
        ) => {
            const total =
                current.reduce(
                    (sum, value) => sum + value,
                    0
                );

            if (total === distance) {
                sequences.push(current);
            }

            if (total >= distance) {
                return;
            }

            remaining.forEach((value, index) => {
                build(
                    [
                        ...remaining.slice(0, index),
                        ...remaining.slice(index + 1)
                    ],
                    [...current, value]
                );
            });
        };

        build(availableDice, []);

        return sequences[0] || [];
    };

    let nextDice = state.dice;

    if (sourceIndex === Location.BAR) {
        if (entryDieUsed !== null) {
            nextDice = removeDie(
                nextDice,
                entryDieUsed
            );
        }
    } else {
        const usedDice =
            findUsedDice(
                state.dice,
                distanceMoved
            );

        nextDice =
            removeDiceSequence(
                state.dice,
                usedDice
            );
    }


    const nextWinner =
        nextBorneOff[currentPlayer] === 15 ? currentPlayer : null;

    return {
        ...state,
        board: nextBoard,
        bar: nextBar,
        borneOff: nextBorneOff,
        dice: nextDice,
        selectedPoint: null,
        winner: nextWinner
    };
};

/**
 * Checks whether the current player has any legal moves remaining.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {boolean}
 */
Tabula.isTurnComplete = (state) => {
    if (state.dice.length === 0) return true;

    const sources =
        state.bar[state.currentPlayer] > 0
            ? [Location.BAR]
            : state.board.reduce((acc, p, i) => {
                if (
                    p.player === state.currentPlayer &&
                    p.count > 0
                ) {
                    return [...acc, i];
                }
                return acc;
            }, []);

    return !R.any(
        (s) => Tabula.getLegalMoves(state, s).length > 0,
        sources
    );
};

/**
 * Switches turn to the next player.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {GameState}
 */
Tabula.switchPlayer = (state) => {
    if (state.winner) return state;

    return {
        ...state,
        currentPlayer: getOpponent(state.currentPlayer),
        dice: [],
        selectedPoint: null,
        turn: state.turn + 1
    };
};

/**
 * Checks if the game is over.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {boolean}
 */
Tabula.isGameOver = (state) =>
    state.winner !== null;

/**
 * Returns the winner, if any.
 *
 * @function
 * @memberof Tabula
 * @param {GameState} state Current game state.
 * @returns {Player|null}
 */
Tabula.getWinner = (state) => state.winner;

export default Object.freeze(Tabula);