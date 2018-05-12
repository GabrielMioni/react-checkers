import {ReactCheckers} from './ReactCheckers.js';

export class Opponent extends ReactCheckers {

    getComputerMoves(boardState, player) {
        const self = this;
        let computerMoves = {};

        for (const coordinates in boardState) {
            if (!boardState.hasOwnProperty(coordinates)) {
                continue;
            }

            const currentSquare = boardState[coordinates];

            if (currentSquare == null) {
                continue;
            }

            if (currentSquare.player !== player) {
                continue;
            }

            const pieceMoves = self.getMoves(boardState, coordinates, boardState[coordinates].isKing, false);

            if (pieceMoves[0].length > 0 || pieceMoves[1] !== null) {
                computerMoves[coordinates] = pieceMoves;
            }
        }

        return computerMoves;
    }

    getSmartMove(state, boardState, player) {
        const computerMoves = this.getComputerMoves(boardState, player);

        const moveKeys = Object.keys(computerMoves);

        const superMoves = {};

        // Pieces
        for (let m = 0; m < moveKeys.length ; ++m) {
            const piece = moveKeys[m];

            const movesData = computerMoves[piece][0];
            const jumpKills = computerMoves[piece][1];

            const jumpMoves = [];

            for (const jumpCoordinates in jumpKills) {
                if (!jumpKills.hasOwnProperty(jumpCoordinates)) {
                    continue;
                }
                jumpMoves.push(jumpKills[jumpCoordinates]);
            }

            let highestScore = 0;
            let bestMove = null;

            // Piece moves
            for (let a = 0; a < movesData.length ; ++a) {

                const moveTo = movesData[a];

                let score = 0;

                // let boardStateLeaf = Object.assign({}, boardstate);
                let stateLeaf = Object.assign({}, state);

                stateLeaf.activePiece = piece;
                stateLeaf.moves = movesData;
                stateLeaf.jumpKills = jumpKills;

                if (jumpMoves.indexOf(moveTo) > -1) {
                    score += 10;
                }

                while (stateLeaf.currentPlayer === false) {

                    const newJumpMoves = this.getMoves(stateLeaf, stateLeaf.activePiece, stateLeaf.activePiece.isKing, true);

                    stateLeaf.moves = newJumpMoves[0];
                    stateLeaf.jumpKills = newJumpMoves[1];

                    score += 10;
                }

                if (score >= highestScore) {
                    highestScore = score;
                    bestMove = moveTo;
                }
            }

            superMoves[piece] = [bestMove, highestScore];
        }

        let finalMove = [];
        let highestAllMoves = 0;

        for (let pieces in superMoves) {
            if (!superMoves.hasOwnProperty(pieces)) {
                continue;
            }

            const pieceMove = superMoves[pieces][0];
            const moveScore = superMoves[pieces][1];

            if (moveScore >= highestAllMoves) {
                if (moveScore === highestAllMoves) {
                    finalMove.push([pieces, pieceMove]);
                }
                if (moveScore > highestAllMoves) {
                    finalMove = [];
                    finalMove.push([pieces, pieceMove]);
                    highestAllMoves = moveScore;
                }
            }
        }

        const chooseMove = finalMove[Math.floor(Math.random()*finalMove.length)];

        const out = {};
        out.piece = chooseMove[0];
        out.moveTo = chooseMove[1];

        return out;
    }

    getRandomMove(boardState, player) {
        const computerMoves = this.getComputerMoves(boardState, player);
        const keys = Object.keys(computerMoves);
        const randomPiece = keys[Math.floor(Math.random() * keys.length)];

        const movesData    = computerMoves[randomPiece][0];
        const randomMoveTo = movesData[Math.floor(Math.random()*movesData.length)];

        let out = {};
        out.piece = randomPiece;
        out.moveTo = randomMoveTo;

        return out;
    }
}