import * as utils from './utils.js';

export class ReactCheckers {

    constructor(columns) {
        this.columns = columns;
    }

    getCorners(coordinates) {

        const col = utils.getColAsInt(this.columns, coordinates);
        const row = utils.getRowAsInt(coordinates);

        const columnLeft  = col -1 >= 0 ? utils.getColAsAlph(this.columns, col - 1) : false;
        const columnRight = col +1 <= 7 ? utils.getColAsAlph(this.columns, col + 1) : false;

        const rowUpper = row +1 < 9 ? row +1 : false;
        const rowLower = row -1 > 0 ? row -1 : false;

        let corners = {};

        corners.leftUpper  = columnLeft  !== false && rowUpper !== false ? columnLeft  + rowUpper : null;
        corners.rightUpper = columnRight !== false && rowUpper !== false ? columnRight + rowUpper : null;
        corners.leftLower  = columnLeft  !== false && rowLower !== false ? columnLeft  + rowLower : null;
        corners.rightLower = columnRight !== false && rowLower !== false ? columnRight + rowLower : null;

        return corners;
    }

    getMoves(boardState, coordinates, isKing = false, hasJumped = false) {

        if (boardState[coordinates] === null) {
            return [];
        }

        let moves = [];
        let jumps = [];

        let killJumps = {};

        const corners = this.getCorners(coordinates);

        const row = utils.getRowAsInt(coordinates);
        const player = boardState[coordinates].player;

        const advanceRow = player === 'player1' ? row - 1 : row + 1;

        for (let key in corners) {
            if (!corners.hasOwnProperty(key)) {
                continue;
            }

            let cornerCoordinates = corners[key];

            if (cornerCoordinates === null) {
                continue;
            }

            if (!isKing && cornerCoordinates.indexOf(advanceRow) < 0) {
                continue;
            }

            if (boardState[cornerCoordinates] === null) {
                moves.push(cornerCoordinates);
            } else {
                let neighborPiece = boardState[cornerCoordinates];

                if (neighborPiece.player === player) {
                    continue;
                }

                let opponentCorners = this.getCorners(cornerCoordinates);
                let potentialJump = opponentCorners[key];

                if (boardState[potentialJump] === null) {
                    killJumps[cornerCoordinates] = potentialJump;
                    jumps.push(potentialJump);
                }
            }
        }

        let movesOut;

        if (hasJumped === false) {
            movesOut = moves.concat(jumps);
        } else {
            // If the piece has already jumped, only additional jumps are available
            movesOut = jumps;
        }

        let killJumpsOut = jumps.length > 0 ? killJumps : null;

        return [movesOut, killJumpsOut];

    }

    movePiece(coordinates, state) {
        let currentState  = Object.assign({}, state.history[state.stepNumber]);
        let boardState = Object.assign({}, currentState.boardState);
        let movingPiece = Object.assign({}, boardState[state.activePiece]);

        let jumpArray = [];

        for (let key in state.jumpKills) {
            if (!state.jumpKills.hasOwnProperty(key)) {
                continue;
            }

            jumpArray.push(state.jumpKills[key]);
        }

        // Don't move if the coordinates don't match a moveable or jumpable square.
        if (state.moves.indexOf(coordinates) < 0 && jumpArray.indexOf(coordinates) < 0) {
            return null;
        }

        // King me maybe?
        if (this.shouldKing(movingPiece, coordinates)) {
            movingPiece.isKing = true;
        }

        // Move piece to new coordinates
        boardState[state.activePiece] = null;
        boardState[coordinates] = movingPiece;

        // Remove opponent piece if jump is made
        const player = movingPiece.player;
        let hasJumped = null;
        let newMoves = [];
        let setCurrentPlayer = player === 'player2';
        let setActivePiece = null;

        if (jumpArray.indexOf(coordinates) > -1) {
            let opponentPosition = utils.getKeyByValue(state.jumpKills, coordinates);
            boardState[opponentPosition] = null;

            newMoves = this.getMoves(boardState, coordinates, movingPiece.isKing, true);

            if (newMoves[0].length > 0) {
                hasJumped = true;
                setCurrentPlayer = currentState.currentPlayer;
                setActivePiece = coordinates;
            } else {
                hasJumped = null;
            }
        }

        if (hasJumped === true) {
            if (newMoves[0].length > 0) {
                setCurrentPlayer = currentState.currentPlayer;
                setActivePiece = coordinates;
            }
        }

        let stateOut = {};

        stateOut.boardState = boardState;
        stateOut.currentPlayer = setCurrentPlayer;
        stateOut.activePiece = setActivePiece;
        stateOut.moves = hasJumped === true ? newMoves[0] : [];
        stateOut.jumpKills = hasJumped === true ? newMoves[1] : null;
        stateOut.hasJumped = hasJumped === true ? player : null;
        stateOut.winner = this.evaluateWinner(boardState);

        return stateOut;
    }

    shouldKing(movingPiece, coordinates) {

        if (movingPiece.isKing === true) {
            return false;
        }

        const row = utils.getRowAsInt(coordinates);
        const player = movingPiece.player;

        return ( (row === 1 && player === 'player1') || (row === 8 && player === 'player2') );
    }

    evaluateWinner(boardState) {

        let player1Pieces = 0;
        let player1Moves  = 0;

        let player2Pieces = 0;
        let player2Moves  = 0;

        for (let coordinates in boardState) {
            if (!boardState.hasOwnProperty(coordinates) || boardState[coordinates] === null) {
                continue;
            }

            const movesData = this.getMoves(boardState, coordinates, boardState[coordinates].isKing, false);
            const moveCount = movesData[0].length;

            if (boardState[coordinates].player === 'player1') {
                ++player1Pieces;
                player1Moves += moveCount;

            } else {
                ++player2Pieces;
                player2Moves += moveCount;
            }
        }

        if (player1Pieces === 0 ) {
            return 'player2pieces';
        }

        if (player2Pieces === 0 ) {
            return 'player1pieces';
        }

        if (player1Moves === 0) {
            return 'player2moves';
        }

        if (player2Moves === 0) {
            return 'player1moves';
        }

        return null;
    }
}