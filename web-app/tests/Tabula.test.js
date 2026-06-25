import assert from "assert";
import Tabula from "../Tabula.js";

var Player = Tabula.Player;
var Location = Tabula.Location;

function emptyBoard() {
    return Array.from({length: 24}, function () {
        return {player: null, count: 0};
    });
}

function countPieces(game, player) {
    var boardPieces = game.board.reduce(
        function (sum, point) {
            if (point.player === player) {
                return sum + point.count;
            }

            return sum;
        },
        0
    );

    return boardPieces + game.bar[player] + game.borneOff[player];
}

describe("Tabula game behaviour", function () {
    it("creates valid start state with 15 pieces each", function () {
        var game = Tabula.createGame();

        assert.strictEqual(
            game.currentPlayer,
            Player.WHITE,
            "WHITE should start"
        );

        assert.strictEqual(
            game.board.length,
            24,
            "Board should have 24 points"
        );

        assert.deepStrictEqual(
            game.dice,
            [],
            "Starting turn should have no dice"
        );

        assert.strictEqual(
            countPieces(game, Player.WHITE),
            15,
            "WHITE should start with 15 total pieces"
        );

        assert.strictEqual(
            countPieces(game, Player.BLACK),
            15,
            "BLACK should start with 15 total pieces"
        );
    });

    it("returns no legal moves before any dice roll", function () {
        var game = Tabula.createGame();

        assert.deepStrictEqual(
            Tabula.getLegalMoves(game, 0),
            [],
            "No dice means no legal moves"
        );
    });

    it("enforces bar priority over normal board moves", function () {
        var game = Object.assign({}, Tabula.createGame(), {
            bar: {
                WHITE: 1,
                BLACK: 0
            },
            dice: [1, 2, 3],
            currentPlayer: Player.WHITE
        });

        assert.deepStrictEqual(
            Tabula.getLegalMoves(game, 11),
            [],
            "Player with bar pieces must re-enter first"
        );
    });

    it("rejects malformed moves in legality checks", function () {
        var game = Tabula.createGame();

        assert.strictEqual(
            Tabula.isLegalMove(game, null),
            false,
            "Null move should be illegal"
        );

        assert.strictEqual(
            Tabula.isLegalMove(game, "not-a-move"),
            false,
            "Non-object move should be illegal"
        );
    });

    it("moves a piece and consumes only the used die", function () {
        var board = emptyBoard();
        var game;
        var next;

        board[0] = {player: Player.WHITE, count: 1};

        game = Object.assign({}, Tabula.createGame(), {
            board: board,
            dice: [1, 2, 3],
            currentPlayer: Player.WHITE
        });

        next = Tabula.movePiece(game, {from: 0, to: 3});

        assert.strictEqual(
            next.board[0].count,
            0,
            "Source point should lose one piece"
        );

        assert.strictEqual(
            next.board[3].player,
            Player.WHITE,
            "Destination should be WHITE"
        );

        assert.strictEqual(
            next.board[3].count,
            1,
            "Destination should gain one piece"
        );

        assert.deepStrictEqual(
            next.dice,
            [1, 2],
            "Move 0->3 should consume die value 3 only"
        );
    });

    it("captures opposing singleton to the bar", function () {
        var board = emptyBoard();
        var game;
        var next;

        board[19] = {player: Player.WHITE, count: 1};
        board[20] = {player: Player.BLACK, count: 1};

        game = Object.assign({}, Tabula.createGame(), {
            board: board,
            dice: [1],
            currentPlayer: Player.WHITE,
            bar: {
                WHITE: 0,
                BLACK: 0
            }
        });

        next = Tabula.movePiece(game, {from: 19, to: 20});

        assert.strictEqual(
            next.bar[Player.BLACK],
            1,
            "Captured BLACK piece should go to BLACK bar"
        );

        assert.strictEqual(
            next.board[20].player,
            Player.WHITE,
            "Capture point should become WHITE"
        );

        assert.strictEqual(
            next.board[20].count,
            1,
            "Capture point should hold one WHITE piece"
        );
    });

    it("rejects move onto point blocked by two opponents", function () {
        var board = emptyBoard();
        var game;
        var next;

        board[19] = {player: Player.WHITE, count: 1};
        board[20] = {player: Player.BLACK, count: 2};

        game = Object.assign({}, Tabula.createGame(), {
            board: board,
            dice: [1],
            currentPlayer: Player.WHITE
        });

        next = Tabula.movePiece(game, {from: 19, to: 20});

        assert.deepStrictEqual(
            next,
            game,
            "Blocked destination should keep state unchanged"
        );
    });

    it("does not allow bear off with pieces outside home", function () {
        var board = emptyBoard();
        var game;

        board[10] = {player: Player.WHITE, count: 1};

        game = Object.assign({}, Tabula.createGame(), {
            board: board,
            dice: [1],
            currentPlayer: Player.WHITE
        });

        assert.strictEqual(
            Tabula.getLegalMoves(game, 10).includes(Location.OFF),
            false,
            "OFF should be illegal until all WHITE pieces are home"
        );
    });

    it("declares winner when 15th piece is borne off", function () {
        var board = emptyBoard();
        var game;
        var next;

        board[23] = {player: Player.WHITE, count: 1};

        game = Object.assign({}, Tabula.createGame(), {
            board: board,
            dice: [1],
            currentPlayer: Player.WHITE,
            borneOff: {
                WHITE: 14,
                BLACK: 0
            },
            bar: {
                WHITE: 0,
                BLACK: 0
            }
        });

        next = Tabula.movePiece(game, {from: 23, to: Location.OFF});

        assert.strictEqual(
            next.borneOff[Player.WHITE],
            15,
            "WHITE borneOff should reach 15"
        );

        assert.strictEqual(
            next.winner,
            Player.WHITE,
            "WHITE should be set as winner"
        );
    });

    it("switches player and resets turn-local state", function () {
        var game = Object.assign({}, Tabula.createGame(), {
            currentPlayer: Player.WHITE,
            dice: [2, 4],
            selectedPoint: 7,
            turn: 3
        });

        var next = Tabula.switchPlayer(game);

        assert.strictEqual(
            next.currentPlayer,
            Player.BLACK,
            "Turn should pass from WHITE to BLACK"
        );

        assert.deepStrictEqual(
            next.dice,
            [],
            "Dice should reset on player switch"
        );

        assert.strictEqual(
            next.selectedPoint,
            null,
            "Selection should clear on player switch"
        );

        assert.strictEqual(
            next.turn,
            4,
            "Turn counter should increment by 1"
        );
    });
});
